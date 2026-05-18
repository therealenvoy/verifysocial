import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment.
 *
 * Required vars throw at first access if missing — fails fast in prod. Vars
 * marked .optional() are graceful no-ops (router falls back to sandbox AI,
 * webhook handlers reject if secret missing, etc.). Build-time access is
 * guarded via skipValidation so `next build` works without provisioning.
 */
export const env = createEnv({
  server: {
    // Core
    DATABASE_URL: z.string().url(),
    ENCRYPTION_MASTER_KEY: z.string().length(64),
    ENCRYPTION_KEY_ID: z.string().default("local_master_key_v1"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Auth
    CLERK_SECRET_KEY: z.string().optional(),

    // AI providers — optional; router falls back to sandbox response.
    DEEPSEEK_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),

    // Webhooks
    FANSLY_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),

    // Inngest (PR 4)
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ENCRYPTION_MASTER_KEY: process.env.ENCRYPTION_MASTER_KEY,
    ENCRYPTION_KEY_ID: process.env.ENCRYPTION_KEY_ID,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    FANSLY_WEBHOOK_SECRET: process.env.FANSLY_WEBHOOK_SECRET,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  // `next build` runs the schema without real values; skipping validation lets
  // the build succeed in CI and on Railway preview deploys.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1" || process.env.NEXT_PHASE === "phase-production-build",
  emptyStringAsUndefined: true,
});
