import { describe, expect, it } from "vitest";

import {
  AIModelRouter,
  MODEL_PRICING,
  calculateCost,
} from "@/lib/ai-router";

describe("calculateCost", () => {
  it("computes DeepSeek micros with the documented per-million pricing", () => {
    // 1M input tokens @ $0.14 + 0.5M output @ $0.28 = $0.14 + $0.14 = $0.28
    const micros = calculateCost("deepseek-v3", 1_000_000, 500_000);
    const expectedMicros =
      MODEL_PRICING["deepseek-v3"].inputPerMillion * 1 +
      MODEL_PRICING["deepseek-v3"].outputPerMillion * 0.5;
    expect(micros).toBe(Math.round(expectedMicros * 1_000_000));
  });

  it("computes Claude micros at $3 in / $15 out per million", () => {
    const micros = calculateCost("claude-3-5-sonnet", 1_000_000, 1_000_000);
    expect(micros).toBe(18_000_000); // $3 + $15 = $18 → 18M micros
  });

  it("computes GPT-4o micros at $5 in / $15 out per million", () => {
    const micros = calculateCost("gpt-4o", 200_000, 100_000);
    // $5 * 0.2 + $15 * 0.1 = $1 + $1.5 = $2.5 → 2_500_000 micros
    expect(micros).toBe(2_500_000);
  });
});

describe("AIModelRouter.selectModelForMessage", () => {
  const router = new AIModelRouter();

  it("routes VIP fans to Claude regardless of message content", () => {
    const model = router.selectModelForMessage("hey", 20_000, 5);
    expect(model).toBe("claude-3-5-sonnet");
  });

  it("routes sales-keyword messages to GPT-4o for non-VIPs", () => {
    const model = router.selectModelForMessage(
      "can I buy that offer?",
      500,
      2,
    );
    expect(model).toBe("gpt-4o");
  });

  it("defaults to DeepSeek for cheap, short, non-sales turns", () => {
    const model = router.selectModelForMessage("hi", 0, 1);
    expect(model).toBe("deepseek-v3");
  });
});

describe("AIModelRouter.complete (sandbox)", () => {
  const router = new AIModelRouter();

  it("returns a deterministic sandbox response when sandbox: true", async () => {
    const response = await router.complete({
      sandbox: true,
      history: [{ role: "fan", content: "hello there" }],
    });
    expect(response.content).toContain("sandbox");
    expect(response.costMicros).toBe(0);
    expect(response.tokens.input).toBeGreaterThan(0);
  });

  it("falls back to sandbox when the chosen model has no API key", async () => {
    const original = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    try {
      const response = await router.complete({
        history: [{ role: "fan", content: "ping" }],
      });
      expect(response.model).toBe("deepseek-v3");
      expect(response.content).toContain("sandbox");
    } finally {
      if (original !== undefined) process.env.DEEPSEEK_API_KEY = original;
    }
  });
});
