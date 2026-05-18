"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  aiGenerations,
  conversations,
  messages,
  policyEvents,
} from "@/db/schema";
import { aiRouter, type ChatMessage } from "@/lib/ai-router";
import { logger } from "@/lib/logger";

/**
 * Input contract for the fan-message processing action. The idempotency key
 * is required and must be globally unique per fan turn so retries (network,
 * Inngest retry policy, optimistic-UI double-submit) all collapse to the
 * same persisted state.
 */
export interface ProcessFanMessageInput {
  conversationId: string;
  fanMessageContent: string;
  idempotencyKey: string;
}

export type ProcessFanMessageResult =
  | {
      status: "processed";
      fanMessageId: string;
      aiMessageId: string;
      aiResponse: string;
    }
  | { status: "duplicate"; fanMessageId: string; aiMessageId: string | null }
  | { status: "error"; error: string };

const BLOCKED_KEYWORDS = ["spam", "scam"] as const;

/**
 * End-to-end pipeline for a single fan turn:
 *   1. Idempotency check (metadata.idempotencyKey on messages)
 *   2. Resolve conversation → creatorId
 *   3. Content safety filter (blocked keywords write a policy_event + abort)
 *   4. Persist fan message
 *   5. Build prompt from last N messages + new fan content
 *   6. Call aiRouter.complete()
 *   7. Persist AI message + ai_generations audit row
 *   8. Return AI response or typed error
 *
 * The router falls back to a deterministic sandbox response when API keys
 * are unset, so this path works in CI and in local dev without provisioning.
 */
export async function processFanMessageAction(
  input: ProcessFanMessageInput,
): Promise<ProcessFanMessageResult> {
  const { conversationId, fanMessageContent, idempotencyKey } = input;

  try {
    // 1. Idempotency: a prior message tagged with the same key means we've
    //    already processed this fan turn. Return cached pointers.
    const existing = await db.query.messages.findFirst({
      where: sql`${messages.metadata} ->> 'idempotencyKey' = ${idempotencyKey}`,
      columns: { id: true, role: true },
    });
    if (existing) {
      const aiCounterpart = await db.query.messages.findFirst({
        where: sql`${messages.metadata} ->> 'replyToIdempotencyKey' = ${idempotencyKey}`,
        columns: { id: true },
      });
      logger.info("ai_processing.idempotent_replay", {
        conversationId,
        idempotencyKey,
        existingMessageId: existing.id,
      });
      return {
        status: "duplicate",
        fanMessageId: existing.id,
        aiMessageId: aiCounterpart?.id ?? null,
      };
    }

    // 2. Resolve the conversation to get the creatorId. Without it we
    //    can't write messages or audit policy events.
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      columns: { id: true, creatorId: true, status: true },
    });
    if (!conv) {
      logger.warn("ai_processing.conversation_not_found", { conversationId });
      return { status: "error", error: "conversation_not_found" };
    }
    if (conv.status === "blocked") {
      logger.warn("ai_processing.conversation_blocked", { conversationId });
      return { status: "error", error: "conversation_blocked" };
    }

    // 3. Safety filter. A real classifier ships in Phase 2; for now a
    //    blocked-keyword guard prevents the obvious cases and records a
    //    policy event for the audit trail.
    const lowered = fanMessageContent.toLowerCase();
    const hit = BLOCKED_KEYWORDS.find((k) => lowered.includes(k));
    if (hit) {
      await db.insert(policyEvents).values({
        creatorId: conv.creatorId,
        severity: "warning",
        eventType: "content_filter_blocked",
        actionTaken: "blocked",
        metadata: { reason: "blocked_keyword", keyword: hit, conversationId },
      });
      logger.warn("ai_processing.content_blocked", { conversationId, keyword: hit });
      return { status: "error", error: "content_blocked" };
    }

    // 4. Fetch recent history (last 10 messages, oldest first) for context.
    const recent = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
      limit: 10,
      columns: { role: true, content: true },
    });
    const history: ChatMessage[] = recent.reverse().map((m) => ({
      role: m.role as ChatMessage["role"],
      content: m.content,
    }));
    history.push({ role: "fan", content: fanMessageContent });

    // 5. Persist the fan message before calling the model. Storing first
    //    means a model failure still leaves a clean audit trail.
    const [fanMsg] = await db
      .insert(messages)
      .values({
        conversationId,
        creatorId: conv.creatorId,
        role: "fan",
        content: fanMessageContent,
        sendStatus: "sent",
        metadata: { idempotencyKey, source: "action" },
      })
      .returning({ id: messages.id });

    // 6. Generate the AI response. Router auto-falls-back to sandbox when
    //    no API key is configured for the chosen model.
    const started = Date.now();
    let aiResp;
    try {
      aiResp = await aiRouter.complete({ history });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("ai_processing.router_failed", {
        conversationId,
        idempotencyKey,
        error: message,
      });
      return { status: "error", error: "ai_router_failed" };
    }
    const latencyMs = Date.now() - started;

    // 7. Persist the AI response, then write the ai_generations audit row
    //    linking source → generated.
    const [aiMsg] = await db
      .insert(messages)
      .values({
        conversationId,
        creatorId: conv.creatorId,
        role: "ai_assistant",
        content: aiResp.content,
        sendStatus: "draft",
        metadata: {
          replyToIdempotencyKey: idempotencyKey,
          model: aiResp.model,
        },
      })
      .returning({ id: messages.id });

    await db.insert(aiGenerations).values({
      sourceMessageId: fanMsg.id,
      generatedMessageId: aiMsg.id,
      model: aiResp.model,
      promptVersion: "v1.0",
      inputTokens: aiResp.tokens.input,
      outputTokens: aiResp.tokens.output,
      estimatedCostMicros: aiResp.costMicros,
      latencyMs,
      finishReason: "stop",
      inputSnapshot: { contentLength: fanMessageContent.length },
      outputSnapshot: { contentLength: aiResp.content.length },
    });

    logger.info("ai_processing.completed", {
      conversationId,
      idempotencyKey,
      model: aiResp.model,
      latencyMs,
      inputTokens: aiResp.tokens.input,
      outputTokens: aiResp.tokens.output,
      costMicros: aiResp.costMicros,
    });

    return {
      status: "processed",
      fanMessageId: fanMsg.id,
      aiMessageId: aiMsg.id,
      aiResponse: aiResp.content,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("ai_processing.unexpected", {
      conversationId,
      idempotencyKey,
      error: message,
    });
    return { status: "error", error: "internal_error" };
  }
}

/**
 * Transition a queued message to sent. Kept thin — Phase 1 doesn't ship the
 * Fansly send path yet, so this simulates a platform message id. PR 4 will
 * route this through the Inngest send function with a real rate-limit bucket.
 */
export async function sendQueuedMessageAction(messageId: string) {
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    columns: { id: true, sendStatus: true },
  });

  if (!message) throw new Error(`Message ${messageId} not found`);
  if (message.sendStatus !== "queued") {
    throw new Error(`Message ${messageId} is not in queued state`);
  }

  await db
    .update(messages)
    .set({ sendStatus: "sending" })
    .where(eq(messages.id, messageId));

  const platformMessageId = `sim_${Date.now()}`;

  await db
    .update(messages)
    .set({
      sendStatus: "sent",
      platformMessageId,
      sentAt: new Date(),
    })
    .where(and(eq(messages.id, messageId)));

  logger.info("ai_processing.message_sent", { messageId, platformMessageId });
  return { status: "sent", platformMessageId };
}
