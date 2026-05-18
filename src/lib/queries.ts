/**
 * Drizzle query helpers for the inbox surface.
 *
 * Each function takes the smallest tenant scope it can — a creatorId or
 * conversationId — and returns a flat, serializable shape so Server
 * Components can pass results into Client Components without typing
 * gymnastics. The shapes are intentionally narrower than the full table
 * rows: the inbox doesn't need every column on every render.
 *
 * Tenant authorization is the *caller's* job. These helpers assume the
 * caller has already resolved the current user → creatorId via Clerk and
 * org membership. Phase 3 will move enforcement into Postgres RLS.
 */

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  conversations,
  creators,
  fans,
  fanProfiles,
  messages,
  organizationMembers,
} from "@/db/schema";

export interface ConversationListItem {
  id: string;
  status: string;
  updatedAt: Date;
  fanId: string;
  fanName: string | null;
  platform: string;
  totalSpentCents: number;
  lifecycleStage: string;
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
}

export interface MessageItem {
  id: string;
  role: "fan" | "creator" | "ai_assistant" | string;
  content: string;
  sendStatus: string;
  createdAt: Date;
  sentAt: Date | null;
}

export interface ConversationDetail {
  id: string;
  status: string;
  creatorId: string;
  fan: {
    id: string;
    name: string | null;
    platform: string;
    totalSpentCents: number;
    lifecycleStage: string;
  } | null;
}

/**
 * Resolve the first creator visible to a Clerk user via org membership.
 * Returns null when the user has no membership or no creator under that org.
 * Kept here so the inbox page doesn't need to know schema layout.
 */
export async function getCreatorForClerkUser(
  clerkUserId: string,
): Promise<{ id: string; organizationId: string; displayName: string } | null> {
  const row = await db
    .select({
      id: creators.id,
      organizationId: creators.organizationId,
      displayName: creators.displayName,
    })
    .from(organizationMembers)
    .innerJoin(creators, eq(creators.organizationId, organizationMembers.organizationId))
    .where(eq(organizationMembers.clerkUserId, clerkUserId))
    .orderBy(desc(creators.updatedAt))
    .limit(1);

  return row[0] ?? null;
}

/**
 * Conversations for a creator, newest first by updatedAt. Joins the fan +
 * fan_profile so the queue row can render without N+1 follow-up reads, and
 * pulls the latest message body via a correlated subquery for the preview.
 *
 * `status` defaults to 'active'; pass `'all'` to bypass.
 */
export async function getConversations(
  creatorId: string,
  options: { limit?: number; status?: "active" | "archived" | "blocked" | "all" } = {},
): Promise<ConversationListItem[]> {
  const limit = options.limit ?? 50;
  const status = options.status ?? "active";

  const where =
    status === "all"
      ? eq(conversations.creatorId, creatorId)
      : and(eq(conversations.creatorId, creatorId), eq(conversations.status, status));

  const lastMessagePreview = sql<string | null>`(
    SELECT content FROM ${messages}
    WHERE ${messages.conversationId} = ${conversations.id}
    ORDER BY ${messages.createdAt} DESC
    LIMIT 1
  )`;
  const lastMessageAt = sql<Date | null>`(
    SELECT created_at FROM ${messages}
    WHERE ${messages.conversationId} = ${conversations.id}
    ORDER BY ${messages.createdAt} DESC
    LIMIT 1
  )`;

  const rows = await db
    .select({
      id: conversations.id,
      status: conversations.status,
      updatedAt: conversations.updatedAt,
      fanId: fans.id,
      fanName: fans.platformUsername,
      platform: fans.platform,
      totalSpentCents: fanProfiles.totalSpentCents,
      lifecycleStage: fanProfiles.lifecycleStage,
      lastMessagePreview,
      lastMessageAt,
    })
    .from(conversations)
    .innerJoin(fans, eq(fans.id, conversations.fanId))
    .leftJoin(fanProfiles, eq(fanProfiles.fanId, fans.id))
    .where(where)
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    updatedAt: r.updatedAt,
    fanId: r.fanId,
    fanName: r.fanName,
    platform: r.platform,
    totalSpentCents: r.totalSpentCents ?? 0,
    lifecycleStage: r.lifecycleStage ?? "new",
    lastMessagePreview: r.lastMessagePreview,
    lastMessageAt: r.lastMessageAt,
  }));
}

/**
 * Full conversation + fan card for the right pane and message view header.
 * Returns null if the conversation doesn't exist (or isn't visible — RLS
 * will enforce that in Phase 3; today the caller must already be scoped).
 */
export async function getConversationDetail(
  conversationId: string,
): Promise<ConversationDetail | null> {
  const row = await db
    .select({
      id: conversations.id,
      status: conversations.status,
      creatorId: conversations.creatorId,
      fanId: fans.id,
      fanName: fans.platformUsername,
      platform: fans.platform,
      totalSpentCents: fanProfiles.totalSpentCents,
      lifecycleStage: fanProfiles.lifecycleStage,
    })
    .from(conversations)
    .innerJoin(fans, eq(fans.id, conversations.fanId))
    .leftJoin(fanProfiles, eq(fanProfiles.fanId, fans.id))
    .where(eq(conversations.id, conversationId))
    .limit(1);

  const first = row[0];
  if (!first) return null;

  return {
    id: first.id,
    status: first.status,
    creatorId: first.creatorId,
    fan: {
      id: first.fanId,
      name: first.fanName,
      platform: first.platform,
      totalSpentCents: first.totalSpentCents ?? 0,
      lifecycleStage: first.lifecycleStage ?? "new",
    },
  };
}

/**
 * Messages in a conversation, oldest first. The default cap of 50 covers the
 * inbox's initial paint; older messages are loaded on scroll in a future PR.
 */
export async function getMessages(
  conversationId: string,
  options: { limit?: number } = {},
): Promise<MessageItem[]> {
  const limit = options.limit ?? 50;
  const rows = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      sendStatus: messages.sendStatus,
      createdAt: messages.createdAt,
      sentAt: messages.sentAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  // Re-reverse so the consumer gets chronological order without doing
  // extra work; the desc + limit ensures we kept the most-recent window.
  return rows.reverse();
}
