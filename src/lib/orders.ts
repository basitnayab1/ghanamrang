import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { deliveryFor, priceLines, type CustomerInput, type OrderInput, type PaymentMethod, type PricedLine } from "./checkout";

/**
 * Order storage.
 *
 * Orders live in a JSON file under `.data/` (git-ignored, it holds customer
 * details). That is fine on a single server or VPS. On serverless hosting
 * (e.g. Vercel) the file system doesn't persist — swap these four functions
 * for a database before going live there.
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

const FILE = path.join(process.cwd(), ".data", "orders.json");

async function readAll(): Promise<Order[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Order[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

// Writes go through one queue so two orders at the same moment can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function writeAll(orders: Order[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await rename(tmp, FILE); // atomic replace
}

function orderNumber(d: Date) {
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const tail = randomBytes(2).toString("hex").toUpperCase();
  return `GR-${ymd}-${tail}`;
}

/** Creates an order from already-validated input. Prices always come from the catalog. */
export function createOrder(input: OrderInput): Promise<Order> {
  return withLock(async () => {
    const lines = priceLines(input.lines);
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const delivery = deliveryFor(subtotal);
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
    const all = await readAll();
    all.push(order);
    await writeAll(all);
    return order;
  });
}

export async function getOrderByToken(token: string): Promise<Order | undefined> {
  if (!/^[a-f0-9]{32}$/.test(token)) return undefined;
  return (await readAll()).find((o) => o.token === token);
}

export async function listOrders(): Promise<Order[]> {
  return (await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function setOrderStatus(number: string, status: OrderStatus): Promise<Order | undefined> {
  return withLock(async () => {
    const all = await readAll();
    const order = all.find((o) => o.number === number);
    if (!order) return undefined;
    order.status = status;
    await writeAll(all);
    return order;
  });
}
