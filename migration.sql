-- Fansly AI CRM Database Migration
-- Generated from Drizzle schema (20 tables)

-- Enable pgvector extension (already done via Railway)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 1. ORGANIZATIONS
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_org_id TEXT UNIQUE,
    name TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. ORGANIZATION MEMBERS
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, clerk_user_id)
);

-- 3. CREATORS
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    automation_mode TEXT NOT NULL DEFAULT 'draft_only',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_creators_updated_at
    BEFORE UPDATE ON creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CREATOR PERSONAS
CREATE TABLE creator_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    prompt_version TEXT NOT NULL DEFAULT 'v1.0',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONNECTOR ACCOUNTS (AES‑256‑GCM envelope encrypted)
CREATE TABLE connector_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    connector_type TEXT NOT NULL,
    credentials_encrypted TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    encryption_auth_tag TEXT NOT NULL,
    encryption_key_id TEXT NOT NULL,
    encryption_version TEXT NOT NULL DEFAULT 'v1_aes_256_gcm',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLATFORM EVENTS (webhook idempotency)
CREATE TABLE platform_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connector_account_id UUID NOT NULL REFERENCES connector_accounts(id) ON DELETE CASCADE,
    external_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (connector_account_id, external_event_id)
);

CREATE INDEX platform_events_status_idx ON platform_events(status);

-- 7. FANS
CREATE TABLE fans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    platform_user_id TEXT NOT NULL,
    platform_username TEXT,
    platform TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    UNIQUE (creator_id, platform, platform_user_id)
);

CREATE INDEX fans_creator_username_idx ON fans(creator_id, platform_username);

-- 8. FAN PROFILES
CREATE TABLE fan_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID NOT NULL UNIQUE REFERENCES fans(id) ON DELETE CASCADE,
    total_spent_cents INTEGER NOT NULL DEFAULT 0,
    lifecycle_stage TEXT NOT NULL DEFAULT 'new',
    tags JSONB NOT NULL DEFAULT '[]',
    preferences JSONB NOT NULL DEFAULT '{}',
    last_engagement_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_fan_profiles_updated_at
    BEFORE UPDATE ON fan_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. FAN MEMORIES (pgvector embeddings)
CREATE TABLE fan_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX fan_memories_fan_type_idx ON fan_memories(fan_id, memory_type);

-- 10. CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversations_creator_updated_idx ON conversations(creator_id, updated_at);

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creators(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    send_status TEXT NOT NULL DEFAULT 'draft',
    platform_message_id TEXT,
    external_created_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ
);

CREATE INDEX messages_conversation_created_idx ON messages(conversation_id, created_at);

-- Partial unique index: only enforce uniqueness when platform_message_id is not null
CREATE UNIQUE INDEX messages_platform_id_unique 
    ON messages(conversation_id, platform_message_id) 
    WHERE platform_message_id IS NOT NULL;

-- 12. AI GENERATIONS
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_message_id UUID NOT NULL REFERENCES messages(id),
    generated_message_id UUID REFERENCES messages(id),
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    estimated_cost_micros INTEGER,
    latency_ms INTEGER,
    finish_reason TEXT,
    input_snapshot JSONB,
    output_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TOKEN USAGE (billing aggregation by day)
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_micros INTEGER NOT NULL DEFAULT 0,
    UNIQUE (organization_id, date, model)
);

-- 14. PPV ASSETS
CREATE TABLE ppv_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    platform_media_id TEXT,
    storage_key TEXT,
    media_url TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PPV OFFERS (price locked at offer time)
CREATE TABLE ppv_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id),
    ppv_asset_id UUID NOT NULL REFERENCES ppv_assets(id),
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'offered',
    platform_purchase_id TEXT,
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ppv_offers_asset_status_idx ON ppv_offers(ppv_asset_id, status);

-- 16. AUTOMATION RULES
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger JSONB NOT NULL,
    action JSONB NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    mode TEXT NOT NULL DEFAULT 'draft_only',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 17. AUTOMATION RUNS
CREATE TABLE automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES automation_rules(id),
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES messages(id),
    status TEXT NOT NULL,
    logs JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. POLICY EVENTS (full audit with severity)
CREATE TABLE policy_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id),
    severity TEXT NOT NULL,
    event_type TEXT NOT NULL,
    rule_id UUID REFERENCES automation_rules(id),
    action_taken TEXT NOT NULL,
    input_snapshot JSONB,
    output_snapshot JSONB,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX policy_events_creator_created_idx ON policy_events(creator_id, created_at);
CREATE INDEX policy_events_severity_idx ON policy_events(severity);

-- 19. STRIPE EVENTS (idempotency for webhooks)
CREATE TABLE stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stripe_events_status_idx ON stripe_events(status);

-- 20. STRIPE SUBSCRIPTIONS
CREATE TABLE stripe_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_stripe_subscriptions_updated_at
    BEFORE UPDATE ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration completed.
SELECT '✅ Fansly AI CRM database schema created (20 tables)' AS result;