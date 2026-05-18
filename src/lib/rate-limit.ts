/**
 * In-process token-bucket rate limiter.
 *
 * Upstash would be the right tool at scale — surfaced as an open question in
 * .phase1-progress.md — but Phase 1 cannot block on provisioning. This
 * implementation:
 *   - resets buckets per-process (acceptable on Railway's single-worker setup)
 *   - tracks per-key remaining tokens and refill timestamps
 *   - exposes a `consume(key, options)` helper that returns the standard
 *     {success, remaining, reset} shape any HTTP middleware can serialize.
 *
 * Replace the storage layer with Upstash + Redis.fromEnv() once
 * UPSTASH_REDIS_REST_URL is provisioned; the consume() contract is stable.
 */

export interface RateLimitConfig {
  /** Allowed requests inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Unix epoch ms when the bucket fully refills. */
  reset: number;
}

interface Bucket {
  remaining: number;
  refillAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Consume one token from `key`'s bucket. Creates the bucket on first use.
 * Bucket reset is hard (window-based), not leaky — simpler, predictable.
 */
export function consume(key: string, cfg: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.refillAt) {
    const refillAt = now + cfg.windowMs;
    buckets.set(key, { remaining: cfg.limit - 1, refillAt });
    return { success: true, remaining: cfg.limit - 1, reset: refillAt };
  }

  if (existing.remaining <= 0) {
    return { success: false, remaining: 0, reset: existing.refillAt };
  }

  existing.remaining -= 1;
  return {
    success: true,
    remaining: existing.remaining,
    reset: existing.refillAt,
  };
}

/** Test-only helper. Clears all buckets so unit tests can run in isolation. */
export function __resetForTests(): void {
  buckets.clear();
}

/**
 * Standard policy presets per the Phase 0 backend spec:
 *   - webhook ingress: 60/min/IP — tolerates Fansly redelivery storms
 *   - AI processing: 10/min/creator — defends against runaway loops
 *   - public auth routes: 5/min/IP — slows credential-stuffing
 */
export const RATE_LIMITS = {
  webhook: { limit: 60, windowMs: 60_000 },
  aiProcessing: { limit: 10, windowMs: 60_000 },
  authRoute: { limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;
