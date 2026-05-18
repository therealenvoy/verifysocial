/**
 * Vitest global setup.
 *
 * Loads test-only env vars so encryption / rate-limiter / connector
 * modules see consistent values across test files. We hand-set them
 * instead of dotenv because dotenv isn't in the dependency list and
 * the surface area is small enough that explicit beats magic here.
 */

// NODE_ENV is typed as readonly in @types/node — defineProperty bypasses it.
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, "NODE_ENV", { value: "test", configurable: true });
}
process.env.ENCRYPTION_MASTER_KEY =
  process.env.ENCRYPTION_MASTER_KEY ??
  "0000000000000000000000000000000000000000000000000000000000000000";
process.env.ENCRYPTION_KEY_ID = process.env.ENCRYPTION_KEY_ID ?? "test_master_key";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5433/verifysocial_test";
process.env.FANSLY_WEBHOOK_SECRET = process.env.FANSLY_WEBHOOK_SECRET ?? "test_fansly_secret";
process.env.SKIP_ENV_VALIDATION = "1";
