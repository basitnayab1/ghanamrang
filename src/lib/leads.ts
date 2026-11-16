import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalisePhone } from "./checkout";
import { STORAGE_MISSING, fileStorageAllowed, getRedis } from "./redis";

/**
 * Leads: people who left their details with the chat assistant so the shop
 * can follow up. Stored like orders: Upstash Redis when configured, otherwise
 * `.data/leads.json` (git-ignored) for local development.
 */

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  city?: string;
  interest?: string;
  message?: string;
  /** page the visitor was on when they chatted */
  page?: string;
};

export type LeadInput = Omit<Lead, "id" | "createdAt">;

const KEY = "gr:leads"; // Redis list, newest first
const MAX = 2000;
const FILE = path.join(process.cwd(), ".data", "leads.json");

/** Validates and cleans what the chat sends. */
export function validateLead(input: unknown): { error: string } | { clean: LeadInput } {
  const o = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(o.name, 80);
  if (name.length < 2) return { error: "Please tell us your name." };
  const phone = normalisePhone(str(o.phone, 30));
  if (!phone) return { error: "Please enter a Pakistani mobile number, e.g. 0300 1234567." };
  const opt = (v: unknown, max: number) => str(v, max) || undefined;
  return {
    clean: {
      name,
      phone,
      city: opt(o.city, 60),
      interest: opt(o.interest, 120),
      message: opt(o.message, 500),
      page: opt(o.page, 200),
    },
  };
}

async function readFileLeads(): Promise<Lead[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Lead[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

let queue: Promise<unknown> = Promise.resolve();

export async function saveLead(input: LeadInput): Promise<Lead> {
  const lead: Lead = { id: randomBytes(8).toString("hex"), createdAt: new Date().toISOString(), ...input };
  const redis = getRedis();
  if (redis) {
    await redis.multi().lpush(KEY, lead).ltrim(KEY, 0, MAX - 1).exec();
    return lead;
  }
  if (!fileStorageAllowed()) throw new Error(STORAGE_MISSING);
  const run = queue.then(async () => {
    const all = await readFileLeads();
    all.unshift(lead);
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(all.slice(0, MAX), null, 2), "utf8");
    await rename(tmp, FILE);
  });
  queue = run.catch(() => undefined);
  await run;
  return lead;
}

/** Newest first. */
export async function listLeads(limit = 500): Promise<Lead[]> {
  const redis = getRedis();
  if (redis) return redis.lrange<Lead>(KEY, 0, limit - 1);
  if (!fileStorageAllowed()) throw new Error(STORAGE_MISSING);
  return (await readFileLeads()).slice(0, limit);
}
