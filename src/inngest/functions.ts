/**
 * Inngest function definitions (Inngest SDK v4 API).
 *
 * processFanMessage: durable, retried path for fan-message ingest. The
 *   webhook handler (PR 3) emits "fan-message/received"; this function
 *   persists, calls the AI router, persists the reply, and finishes.
 *   The Server Action also does this synchronously for fast UX feedback;
 *   the Inngest function is the async path for webhook-driven traffic.
 *
 * recordProcessedFanMessage: pure observability hook on
 *   "fan-message/processed". Useful place to fan out to analytics or
 *   downstream consumers later without coupling them to the critical path.
 */
import { processFanMessageAction } from "@/actions/ai-processing";
import { logger } from "@/lib/logger";

import { inngest } from "./client";

interface FanMessageReceivedData {
  conversationId: string;
  fanMessageContent: string;
  idempotencyKey: string;
  connectorAccountId?: string;
}

interface FanMessageProcessedData {
  conversationId: string;
  fanMessageId: string;
  aiMessageId: string;
  model: string;
  latencyMs: number;
  idempotencyKey: string;
}

export const processFanMessage = inngest.createFunction(
  {
    id: "process-fan-message",
    retries: 3,
    concurrency: { limit: 50 },
    triggers: [{ event: "fan-message/received" }],
  },
  async ({ event, step }) => {
    const data = event.data as FanMessageReceivedData;

    const result = await step.run("process", () =>
      processFanMessageAction({
        conversationId: data.conversationId,
        fanMessageContent: data.fanMessageContent,
        idempotencyKey: data.idempotencyKey,
      }),
    );

    return result;
  },
);

export const recordProcessedFanMessage = inngest.createFunction(
  {
    id: "record-processed-fan-message",
    triggers: [{ event: "fan-message/processed" }],
  },
  async ({ event }) => {
    const data = event.data as FanMessageProcessedData;
    logger.info("inngest.fan_message_processed", {
      conversationId: data.conversationId,
      aiMessageId: data.aiMessageId,
      model: data.model,
      latencyMs: data.latencyMs,
    });
    return { ok: true };
  },
);

export const inngestFunctions = [processFanMessage, recordProcessedFanMessage];
