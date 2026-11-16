import "server-only";

import { Redis } from "@upstash/redis";

/**
 * The shop's Upstash Redis client, or null when it isn't configured.
 * Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN;
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN work too.
 */
let client: Redis | null | undefined;
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

/** On Vercel the file system is read-only, so file storage can't be used there. */
export const fileStorageAllowed = () => !process.env.VERCEL;

export const STORAGE_MISSING = "Storage is not set up: connect Upstash for Redis in Vercel → Storage, then redeploy.";
