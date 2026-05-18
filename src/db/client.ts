import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Lazy Drizzle handle.
 *
 * Connecting to Neon at module load time breaks `next build` whenever
 * DATABASE_URL is absent (Next 15 imports route modules during page-data
 * collection, even for force-dynamic routes). We defer the connection
 * until the first query, fail loudly if the URL is missing at that point,
 * and cache the handle for subsequent calls.
 */
let cached: DrizzleDB | null = null;

function getDb(): DrizzleDB {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Run with a valid Neon connection string.",
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

export const db = new Proxy({} as DrizzleDB, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
