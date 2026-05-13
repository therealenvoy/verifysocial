"use server";

import { db } from "@/src/db/client";
import { messages, aiGenerations, policyEvents } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function processFanMessageAction(messageId: string) {
  "use server";
  
  // 1. Fetch message with conversation
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: {
      conversation: {
        with: {
          fan: true,
        },
      },
    },
  });
  
  if (!message) {
    throw new Error(`Message ${messageId} not found`);
  }
  
  // 2. Safety check (simplified)
  const blockedKeywords = ["spam", "scam"];
  const content = message.content.toLowerCase();
  const hasBlocked = blockedKeywords.some(keyword => content.includes(keyword));
  
  if (hasBlocked) {
    await db.insert(policyEvents).values({
      creatorId: message.conversation.creatorId,
      severity: "warning",
      eventType: "content_filter_blocked",
      actionTaken: "blocked",
      metadata: {
        messageId,
        reason: "blocked_keyword",
      },
    });
    
    await db
      .update(messages)
      .set({ sendStatus: "blocked" })
      .where(eq(messages.id, messageId));
      
    return { status: "blocked", reason: "blocked_keyword" };
  }
  
  // 3. Generate AI response (placeholder - integrate real AI)
  const aiResponse = "Thanks for reaching out! How's your day going?";
  
  // 4. Create AI generation record
  const [aiGen] = await db
    .insert(aiGenerations)
    .values({
      sourceMessageId: messageId,
      model: "deepseek-v3",
      promptVersion: "v1.0",
      inputTokens: 50,
      outputTokens: 20,
      estimatedCostMicros: 50,
      finishReason: "stop",
      inputSnapshot: { content: message.content.substring(0, 100) },
      outputSnapshot: { content: aiResponse },
    })
    .returning();
  
  // 5. Create response message (draft status)
  const [responseMsg] = await db
    .insert(messages)
    .values({
      conversationId: message.conversationId,
      creatorId: message.conversation.creatorId,
      role: "ai_assistant",
      content: aiResponse,
      sendStatus: "draft", // Creator must approve
      metadata: {
        aiGenerationId: aiGen.id,
      },
    })
    .returning();
  
  // 6. Link AI generation to response
  await db
    .update(aiGenerations)
    .set({ generatedMessageId: responseMsg.id })
    .where(eq(aiGenerations.id, aiGen.id));
  
  return {
    status: "success",
    messageId: responseMsg.id,
    contentPreview: aiResponse.substring(0, 50) + "...",
  };
}

export async function sendQueuedMessageAction(messageId: string) {
  "use server";
  
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: {
      conversation: {
        with: {
          creator: true,
        },
      },
    },
  });
  
  if (!message) {
    throw new Error(`Message ${messageId} not found`);
  }
  
  if (message.sendStatus !== "queued") {
    throw new Error(`Message ${messageId} is not in queued state`);
  }
  
  // Update to sending
  await db
    .update(messages)
    .set({ sendStatus: "sending" })
    .where(eq(messages.id, messageId));
  
  // TODO: Integrate with actual platform connector
  // For now, simulate success
  const platformMessageId = `sim_${Date.now()}`;
  
  await db
    .update(messages)
    .set({
      sendStatus: "sent",
      platformMessageId,
      sentAt: new Date(),
    })
    .where(eq(messages.id, messageId));
  
  return { status: "sent", platformMessageId };
}
