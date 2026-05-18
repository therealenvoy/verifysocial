import { afterEach, describe, expect, it } from "vitest";

import { hashPayload } from "@/lib/encryption";
import {
  RATE_LIMITS,
  __resetForTests,
  consume,
} from "@/lib/rate-limit";

describe("hashPayload — idempotency keying", () => {
  it("identical webhook bodies hash to the same value (dedupe target)", () => {
    const body = JSON.stringify({ id: "evt_1", type: "msg", body: "hi" });
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(hashPayload(parsed)).toBe(hashPayload(parsed));
  });

  it("modified webhook bodies hash to different values (hash_mismatch signal)", () => {
    const original = { id: "evt_1", body: "hello" };
    const tampered = { id: "evt_1", body: "h3ll0" };
    expect(hashPayload(original)).not.toBe(hashPayload(tampered));
  });
});

describe("rate-limit consume", () => {
  afterEach(() => __resetForTests());

  it("allows up to `limit` requests inside the window", () => {
    const cfg = { limit: 3, windowMs: 60_000 };
    expect(consume("key-a", cfg).success).toBe(true);
    expect(consume("key-a", cfg).success).toBe(true);
    expect(consume("key-a", cfg).success).toBe(true);
    const fourth = consume("key-a", cfg);
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("isolates buckets per key (no cross-key bleed)", () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    expect(consume("alpha", cfg).success).toBe(true);
    expect(consume("alpha", cfg).success).toBe(false);
    // Different key → fresh bucket
    expect(consume("beta", cfg).success).toBe(true);
  });

  it("exposes the preset config under RATE_LIMITS for runtime use", () => {
    expect(RATE_LIMITS.webhook.limit).toBeGreaterThanOrEqual(60);
    expect(RATE_LIMITS.aiProcessing.limit).toBeGreaterThanOrEqual(10);
    expect(RATE_LIMITS.authRoute.limit).toBeLessThanOrEqual(20);
  });
});
