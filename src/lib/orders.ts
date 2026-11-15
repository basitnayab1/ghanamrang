import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { deliveryFor, priceLines, type CustomerInput, type OrderInput, type PaymentMethod, type PricedLine } from "./checkout";

/**
 * Order storage.
 *
 * - With Upstash Redis configured (Vercel → Storage → Upstash for Redis sets
 *   KV_REST_API_URL / KV_REST_API_TOKEN, or set UPSTASH_REDIS_REST_URL /
 *   UPSTASH_REDIS_REST_TOKEN yourself), orders are kept in Redis. Use this on
 *   Vercel and any serverless host.
 * - Without it, orders go to `.data/orders.json` (git-ignored, it holds
 *   customer details) — fine for local development or a single VPS.
 */

export const ORDER_STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  /** Long random id used in the confirmation URL, so orders can't be guessed. */
  token: string;
  /** Short, human-friendly number for WhatsApp and the admin page. */
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: CustomerInput;
  payment: PaymentMethod;
  lines: PricedLine[];
  subtotal: number;
  delivery: number;
  total: number;
};

/** The few operations the shop needs from a store. */
type Store = {
  /** Saves a new order. Returns false if its number is already taken. */
  insert(order: Order): Promise<boolean>;
  byToken(token: string): Promise<Order | undefined>;
  byNumber(number: string): Promise<Order | undefined>;
  /** Newest first. */
  list(limit: number): Promise<Order[]>;
  replace(order: Order): Promise<void>;
};

/* ----------------------------- Upstash Redis ----------------------------- */

function redisStore(redis: Redis): Store {
  const kOrder = (token: string) => `gr:order:${token}`;
  const kNumber = (number: string) => `gr:num:${number}`;
  const kIndex = "gr:orders"; // sorted set: token scored by creation time

  return {
    async insert(order) {
      // claim the number first so two orders can never share one
      const claimed = await redis.set(kNumber(order.number), order.token, { nx: true });
      if (claimed !== "OK") return false;
      await redis
        .multi()
        .set(kOrder(order.token), order)
        .zadd(kIndex, { score: Date.parse(order.createdAt), member: order.token })
        .exec();
      return true;
    },
    async byToken(token) {
      return (await redis.get<Order>(kOrder(token))) ?? undefined;
    },
    async byNumber(number) {
      const token = await redis.get<string>(kNumber(number));
      return token ? this.byToken(token) : undefined;
    },
    async list(limit) {
      const tokens = await redis.zrange<string[]>(kIndex, 0, limit - 1, { rev: true });
      if (!tokens.length) return [];
      const orders = await redis.mget<(Order | null)[]>(...tokens.map(kOrder));
      return orders.filter((o): o is Order => !!o);
    },
    async replace(order) {
      await redis.set(kOrder(order.token), order);
    },
  };
}

/* ------------------------------- JSON file ------------------------------- */

function fileStore(): Store {
  const FILE = path.join(process.cwd(), ".data", "orders.json");

  const readAll = async (): Promise<Order[]> => {
    try {
      return JSON.parse(await readFile(FILE, "utf8")) as Order[];
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  };
  const writeAll = async (orders: Order[]) => {
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
    await rename(tmp, FILE); // atomic replace
  };

  // Writes go through one queue so two orders at the same moment can't clobber each other.
  let queue: Promise<unknown> = Promise.resolve();
  const withLock = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    insert: (order) =>
      withLock(async () => {
        const all = await readAll();
        if (all.some((o) => o.number === order.number)) return false;
        all.push(order);
        await writeAll(all);
        return true;
      }),
    byToken: async (token) => (await readAll()).find((o) => o.token === token),
    byNumber: async (number) => (await readAll()).find((o) => o.number === number),
    list: async (limit) => (await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit),
    replace: (order) =>
      withLock(async () => {
        const all = await readAll();
        await writeAll(all.map((o) => (o.token === order.token ? order : o)));
      }),
  };
}

/* ------------------------------ choose one ------------------------------- */

let store: Store | undefined;
function getStore(): Store {
  if (store) return store;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    store = redisStore(new Redis({ url, token }));
  } else if (process.env.VERCEL) {
    // Vercel's file system is read-only and temporary — saving to a file would lose orders.
    throw new Error("Order storage is not set up: connect Upstash for Redis in Vercel → Storage, then redeploy.");
  } else {
    store = fileStore();
  }
  return store;
}

/* --------------------------------- API ----------------------------------- */

function orderNumber(d: Date) {
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const tail = randomBytes(3).toString("hex").toUpperCase();
  return `GR-${ymd}-${tail}`;
}

/** Creates an order from already-validated input. Prices always come from the catalog. */
export async function createOrder(input: OrderInput): Promise<Order> {
  const lines = priceLines(input.lines);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = deliveryFor(subtotal);

  for (let attempt = 0; attempt < 5; attempt++) {
    const now = new Date();
    const order: Order = {
      token: randomBytes(16).toString("hex"),
      number: orderNumber(now),
      createdAt: now.toISOString(),
      status: "new",
      customer: input.customer,
      payment: input.payment,
      lines,
      subtotal,
      delivery,
      total: subtotal + delivery,
    };
    if (await getStore().insert(order)) return order;
  }
  throw new Error("Could not allocate an order number");
}

export async function getOrderByToken(token: string): Promise<Order | undefined> {
  if (!/^[a-f0-9]{32}$/.test(token)) return undefined;
  return getStore().byToken(token);
}

/** The most recent orders, newest first. */
export async function listOrders(limit = 500): Promise<Order[]> {
  return getStore().list(limit);
}

export async function setOrderStatus(number: string, status: OrderStatus): Promise<Order | undefined> {
  const s = getStore();
  const order = await s.byNumber(number);
  if (!order) return undefined;
  const updated = { ...order, status };
  await s.replace(updated);
  return updated;
}
