/**
 * Fansly AI CRM – Drizzle ORM Schema
 *
 * Runtime: Node only. Never import from client/edge code.
 * Money: integer cents (price_cents) or micros (estimated_cost_micros = 1_000_000 = $1).
 * Encryption: AES-256-GCM envelope, server-only.
 * Snapshots: redacted by default, retention window enforced at application layer.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  date,
  index,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { vector } from 'drizzle-orm/pg-core'; // requires drizzle-orm >= 0.30 + pgvector extension

// ─────────────────────────────────────────────
// 1. ORGANIZATIONS  (Clerk org mirrored here)
// ─────────────────────────────────────────────
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Clerk org ID – single source of truth for auth. Null = personal workspace. */
  clerkOrgId: text('clerk_org_id').unique(),
  name: text('name').notNull(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 2. ORGANIZATION MEMBERS
// ─────────────────────────────────────────────
export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    /** Clerk user ID – never store passwords here. */
    clerkUserId: text('clerk_user_id').notNull(),
    role: text('role').notNull(), // 'owner' | 'admin' | 'member'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('org_member_unique').on(t.organizationId, t.clerkUserId),
  ],
);

// ─────────────────────────────────────────────
// 3. CREATORS
// ─────────────────────────────────────────────
export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  displayName: text('display_name').notNull(),
  /**
   * Automation safety mode.
   * draft_only | auto_low_risk | auto_all_with_approval | sandbox
   */
  automationMode: text('automation_mode').notNull().default('draft_only'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 4. CREATOR PERSONAS
// ─────────────────────────────────────────────
export const creatorPersonas = pgTable('creator_personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .references(() => creators.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  /** Full system prompt. Never include real fan PII inside prompts stored here. */
  systemPrompt: text('system_prompt').notNull(),
  promptVersion: text('prompt_version').notNull().default('v1.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 5. CONNECTOR ACCOUNTS  (KMS envelope encrypted)
// ─────────────────────────────────────────────
export const connectorAccounts = pgTable('connector_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .references(() => creators.id, { onDelete: 'cascade' })
    .notNull(),
  /**
   * 'sandbox' | 'apifansly'
   * apifansly is a THIRD-PARTY connector, not an official Fansly API.
   * Name it clearly to keep platform-risk visible.
   */
  connectorType: text('connector_type').notNull(),
  /** AES-256-GCM ciphertext (base64). Never log or return to client. */
  credentialsEncrypted: text('credentials_encrypted').notNull(),
  /** AES-256-GCM IV (base64, 12 bytes). */
  encryptionIv: text('encryption_iv').notNull(),
  /** AES-256-GCM auth tag (base64, 16 bytes). */
  encryptionAuthTag: text('encryption_auth_tag').notNull(),
  /** 'local_master_key' for v1; KMS key ARN for production. */
  encryptionKeyId: text('encryption_key_id').notNull(),
  /** 'v1_aes_256_gcm' – increment when rotating algorithm. */
  encryptionVersion: text('encryption_version').notNull().default('v1_aes_256_gcm'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 6. PLATFORM EVENTS  (webhook idempotency)
// ─────────────────────────────────────────────
export const platformEvents = pgTable(
  'platform_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectorAccountId: uuid('connector_account_id')
      .references(() => connectorAccounts.id, { onDelete: 'cascade' })
      .notNull(),
    /** Unique event ID from the platform (e.g., Fansly message ID). */
    externalEventId: text('external_event_id').notNull(),
    eventType: text('event_type').notNull(), // 'message_created' | 'subscription_created' | ...
    /** SHA-256 of raw payload. Used to detect replays with modified payloads. */
    payloadHash: text('payload_hash').notNull(),
    /**
     * 'pending' | 'processing' | 'processed' | 'failed' | 'hash_mismatch'
     * hash_mismatch = same externalEventId, different payload → security event.
     */
    status: text('status').notNull().default('pending'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('platform_event_external_unique').on(t.connectorAccountId, t.externalEventId),
    index('platform_events_status_idx').on(t.status),
  ],
);

// ─────────────────────────────────────────────
// 7. FANS  (platform identity only)
// ─────────────────────────────────────────────
export const fans = pgTable(
  'fans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .references(() => creators.id, { onDelete: 'cascade' })
      .notNull(),
    platformUserId: text('platform_user_id').notNull(),
    platformUsername: text('platform_username'),
    platform: text('platform').notNull(), // 'fansly'
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  },
  (t) => [
    unique('fan_platform_unique').on(t.creatorId, t.platform, t.platformUserId),
    index('fans_creator_username_idx').on(t.creatorId, t.platformUsername),
  ],
);

// ─────────────────────────────────────────────
// 8. FAN PROFILES  (derived AI data, integer money)
// ─────────────────────────────────────────────
export const fanProfiles = pgTable('fan_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  fanId: uuid('fan_id')
    .references(() => fans.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  /** Total spend in cents (integer). $10.00 = 1000. */
  totalSpentCents: integer('total_spent_cents').notNull().default(0),
  /** 'new' | 'active' | 'vip' | 'churn_risk' */
  lifecycleStage: text('lifecycle_stage').notNull().default('new'),
  tags: jsonb('tags').default([]).notNull(),
  preferences: jsonb('preferences').default({}).notNull(),
  lastEngagementAt: timestamp('last_engagement_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 9. FAN MEMORIES  (pgvector embeddings)
// ─────────────────────────────────────────────
export const fanMemories = pgTable(
  'fan_memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fanId: uuid('fan_id')
      .references(() => fans.id, { onDelete: 'cascade' })
      .notNull(),
    /** 'conversation_summary' | 'preference' | 'fact' */
    memoryType: text('memory_type').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('fan_memories_fan_type_idx').on(t.fanId, t.memoryType),
  ],
);

// ─────────────────────────────────────────────
// 10. CONVERSATIONS
// ─────────────────────────────────────────────
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .references(() => creators.id, { onDelete: 'cascade' })
      .notNull(),
    fanId: uuid('fan_id')
      .references(() => fans.id, { onDelete: 'cascade' })
      .notNull(),
    /** 'active' | 'archived' | 'blocked' */
    status: text('status').notNull().default('active'),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('conversations_creator_updated_idx').on(t.creatorId, t.updatedAt),
  ],
);

// ─────────────────────────────────────────────
// 11. MESSAGES
// ─────────────────────────────────────────────
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    /**
     * Denormalized for query performance (avoids join on every message fetch).
     * Must always match conversations.creator_id.
     */
    creatorId: uuid('creator_id')
      .references(() => creators.id)
      .notNull(),
    /** 'fan' | 'creator' | 'ai_assistant' */
    role: text('role').notNull(),
    content: text('content').notNull(),
    /**
     * 'draft' – AI generated, awaiting creator approval
     * 'queued' – approved, waiting on rate limiter
     * 'sending' – in flight to platform
     * 'sent' – platform confirmed
     * 'failed' – platform rejected, see metadata.lastError
     * 'blocked' – safety rule prevented sending
     */
    sendStatus: text('send_status').notNull().default('draft'),
    /** Platform-assigned message ID. Null until sent. */
    platformMessageId: text('platform_message_id'),
    /** Timestamp reported by the platform (may differ from createdAt). */
    externalCreatedAt: timestamp('external_created_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (t) => [
    index('messages_conversation_created_idx').on(t.conversationId, t.createdAt),
    // Partial unique index: only enforce uniqueness when platformMessageId is not null
    uniqueIndex('messages_platform_id_unique')
      .on(t.conversationId, t.platformMessageId)
      .where(sql`${t.platformMessageId} IS NOT NULL`),
  ],
);

// ─────────────────────────────────────────────
// 12. AI GENERATIONS  (full audit trail)
// ─────────────────────────────────────────────
export const aiGenerations = pgTable('ai_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** The fan message that triggered generation. */
  sourceMessageId: uuid('source_message_id')
    .references(() => messages.id)
    .notNull(),
  /**
   * The AI response message, if it was created.
   * Null = generation happened but message was blocked or discarded.
   */
  generatedMessageId: uuid('generated_message_id')
    .references(() => messages.id),
  model: text('model').notNull(), // 'deepseek-v3' | 'claude-3-5-sonnet' | 'gpt-4o'
  promptVersion: text('prompt_version').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  /** Cost in microdollars: 1_000_000 micros = $1.00 */
  estimatedCostMicros: integer('estimated_cost_micros'),
  latencyMs: integer('latency_ms'),
  /** 'stop' | 'length' | 'content_filter' | 'error' */
  finishReason: text('finish_reason'),
  /**
   * Redacted snapshots only. Never store raw adult content.
   * Application layer must strip/hash sensitive fields before writing.
   * Retention: purge after 30 days via scheduled job.
   */
  inputSnapshot: jsonb('input_snapshot'),
  outputSnapshot: jsonb('output_snapshot'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 13. TOKEN USAGE  (billing aggregation by day)
// ─────────────────────────────────────────────
export const tokenUsage = pgTable(
  'token_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    date: date('date').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    /** Accumulated cost in microdollars for the day. */
    estimatedCostMicros: integer('estimated_cost_micros').notNull().default(0),
  },
  (t) => [
    unique('token_usage_unique').on(t.organizationId, t.date, t.model),
  ],
);

// ─────────────────────────────────────────────
// 14. PPV ASSETS
// ─────────────────────────────────────────────
export const ppvAssets = pgTable('ppv_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .references(() => creators.id, { onDelete: 'cascade' })
    .notNull(),
  /** Platform media ID if uploaded directly to Fansly. */
  platformMediaId: text('platform_media_id'),
  /** Our own storage key (S3/GCS object key) if we host. */
  storageKey: text('storage_key'),
  /** Public CDN URL. */
  mediaUrl: text('media_url').notNull(),
  /** Listed price in cents. $9.99 = 999. */
  priceCents: integer('price_cents').notNull(),
  tags: jsonb('tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 15. PPV OFFERS  (price locked at offer time)
// ─────────────────────────────────────────────
export const ppvOffers = pgTable(
  'ppv_offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .references(() => messages.id)
      .notNull(),
    ppvAssetId: uuid('ppv_asset_id')
      .references(() => ppvAssets.id)
      .notNull(),
    /**
     * Price at time of offer, not the current asset price.
     * Asset price may be edited later; historical record must not change.
     */
    priceCents: integer('price_cents').notNull(),
    /** 'offered' | 'purchased' | 'declined' | 'expired' */
    status: text('status').notNull().default('offered'),
    /** Platform transaction ID, set when fan purchases. */
    platformPurchaseId: text('platform_purchase_id'),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('ppv_offers_asset_status_idx').on(t.ppvAssetId, t.status),
  ],
);

// ─────────────────────────────────────────────
// 16. AUTOMATION RULES
// ─────────────────────────────────────────────
export const automationRules = pgTable('automation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .references(() => creators.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  trigger: jsonb('trigger').notNull(),
  action: jsonb('action').notNull(),
  priority: integer('priority').notNull().default(0),
  enabled: boolean('enabled').notNull().default(true),
  /**
   * Safety mode this rule operates under.
   * 'sandbox' | 'draft_only' | 'auto_low_risk' | 'auto_all_with_approval'
   */
  mode: text('mode').notNull().default('draft_only'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 17. AUTOMATION RUNS
// ─────────────────────────────────────────────
export const automationRuns = pgTable('automation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id')
    .references(() => automationRules.id)
    .notNull(),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id),
  messageId: uuid('message_id')
    .references(() => messages.id),
  /** 'success' | 'failed' | 'blocked' | 'skipped' */
  status: text('status').notNull(),
  logs: jsonb('logs').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 18. POLICY EVENTS  (full audit with severity)
// ─────────────────────────────────────────────
export const policyEvents = pgTable(
  'policy_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .references(() => creators.id)
      .notNull(),
    /** 'info' | 'warning' | 'error' | 'critical' | 'security' */
    severity: text('severity').notNull(),
    eventType: text('event_type').notNull(),
    ruleId: uuid('rule_id').references(() => automationRules.id),
    /** 'allowed' | 'blocked' | 'queued' | 'escalated' | 'security_flagged' */
    actionTaken: text('action_taken').notNull(),
    /**
     * Redacted snapshots. Same retention/scrubbing rules as ai_generations.
     * Purge after 30 days via scheduled job.
     */
    inputSnapshot: jsonb('input_snapshot'),
    outputSnapshot: jsonb('output_snapshot'),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('policy_events_creator_created_idx').on(t.creatorId, t.createdAt),
    index('policy_events_severity_idx').on(t.severity),
  ],
);

// ─────────────────────────────────────────────
// 19. STRIPE EVENTS  (idempotency for webhooks)
// ─────────────────────────────────────────────
export const stripeEvents = pgTable(
  'stripe_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stripe event ID (evt_...). Used for idempotency. */
    stripeEventId: text('stripe_event_id').notNull().unique(),
    eventType: text('event_type').notNull(), // 'invoice.paid' | 'customer.subscription.deleted' | ...
    /** SHA-256 of Stripe event payload for replay detection. */
    payloadHash: text('payload_hash').notNull(),
    /** 'pending' | 'processed' | 'failed' | 'hash_mismatch' */
    status: text('status').notNull().default('pending'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('stripe_events_status_idx').on(t.status),
  ],
);

// ─────────────────────────────────────────────
// 20. STRIPE SUBSCRIPTIONS
// ─────────────────────────────────────────────
export const stripeSubscriptions = pgTable('stripe_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  /** 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' */
  status: text('status').notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
