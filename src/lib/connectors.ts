/**
 * Platform Connector Interface + Sandbox Implementation
 *
 * All real connectors (apifansly, future native) must implement PlatformConnector.
 * SandboxConnector runs locally with no external calls – safe for testing the full
 * CRM loop without risking real accounts.
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface PlatformMessage {
  id: string;
  conversationId: string;
  platformUserId: string;
  role: 'fan' | 'creator';
  content: string;
  externalCreatedAt: Date;
  mediaUrls?: string[];
}

export interface SendMessageOptions {
  conversationId: string;
  content: string;
  mediaUrls?: string[];
  ppvAssetId?: string;
  /** Price in cents when sending a PPV offer. */
  ppvPriceCents?: number;
}

export interface SendMessageResult {
  success: boolean;
  platformMessageId?: string;
  error?: string;
}

export interface GetMessagesOptions {
  limit?: number;
  beforeId?: string;
}

export interface ConversationSummary {
  platformConversationId: string;
  platformUserId: string;
  platformUsername?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
}

/**
 * All connectors must implement this interface.
 * This makes Fansly (via apifansly third-party API) swappable without touching
 * business logic.
 */
export interface PlatformConnector {
  /** Human-readable platform name, e.g. 'fansly', 'sandbox'. */
  readonly platformName: string;
  /**
   * True when this connector routes through a third-party intermediary
   * (not the platform's own API). Marks operational risk clearly.
   */
  readonly isThirdParty: boolean;

  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
  getMessages(conversationId: string, opts?: GetMessagesOptions): Promise<PlatformMessage[]>;
  getConversations(limit?: number): Promise<ConversationSummary[]>;

  /** Verify that a webhook payload came from the expected source. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  /** Parse raw webhook payload into a normalized PlatformMessage. */
  parseWebhookPayload(raw: unknown): PlatformMessage;
}

// ─────────────────────────────────────────────
// SANDBOX CONNECTOR
// ─────────────────────────────────────────────

/**
 * In-memory sandbox connector for local development.
 * Simulates fan messages, replies, PPV offers.
 * Zero external calls. Zero risk to real accounts.
 */
export class SandboxConnector implements PlatformConnector {
  readonly platformName = 'sandbox';
  readonly isThirdParty = false;

  private sentMessages: Array<{ conversationId: string; content: string; sentAt: Date }> = [];
  private inboxMessages = new Map<string, PlatformMessage[]>();

  /**
   * Inject a fake inbound message from a fan.
   * Call this in tests/scripts to drive the AI response loop.
   */
  injectFanMessage(conversationId: string, content: string): PlatformMessage {
    const msg: PlatformMessage = {
      id: `sandbox_msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      conversationId,
      platformUserId: 'sandbox_fan_001',
      role: 'fan',
      content,
      externalCreatedAt: new Date(),
    };
    const existing = this.inboxMessages.get(conversationId) ?? [];
    this.inboxMessages.set(conversationId, [...existing, msg]);
    return msg;
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    // Simulate 300-600ms network latency
    await delay(300 + Math.random() * 300);

    // Simulate 5% failure rate to test error handling
    if (Math.random() < 0.05) {
      return { success: false, error: '[sandbox] Simulated platform error' };
    }

    const platformMessageId = `sandbox_sent_${Date.now()}`;
    this.sentMessages.push({
      conversationId: options.conversationId,
      content: options.content,
      sentAt: new Date(),
    });

    return { success: true, platformMessageId };
  }

  async getMessages(
    conversationId: string,
    opts: GetMessagesOptions = {}
  ): Promise<PlatformMessage[]> {
    const messages = this.inboxMessages.get(conversationId) ?? [];
    const limit = opts.limit ?? 50;
    return messages.slice(-limit);
  }

  async getConversations(limit = 20): Promise<ConversationSummary[]> {
    return Array.from(this.inboxMessages.keys())
      .slice(0, limit)
      .map((conversationId) => {
        const msgs = this.inboxMessages.get(conversationId) ?? [];
        const last = msgs.at(-1);
        return {
          platformConversationId: conversationId,
          platformUserId: 'sandbox_fan_001',
          platformUsername: 'sandbox_fan',
          lastMessage: last?.content,
          lastMessageAt: last?.externalCreatedAt,
        };
      });
  }

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    // Sandbox always accepts
    return true;
  }

  parseWebhookPayload(raw: unknown): PlatformMessage {
    const payload = raw as Record<string, unknown>;
    return {
      id: String(payload.id ?? `sandbox_${Date.now()}`),
      conversationId: String(payload.conversationId ?? 'sandbox_conv_001'),
      platformUserId: String(payload.userId ?? 'sandbox_fan_001'),
      role: 'fan',
      content: String(payload.content ?? ''),
      externalCreatedAt: new Date(),
    };
  }

  /** Inspect sent messages in tests. */
  getSentMessages() {
    return [...this.sentMessages];
  }
}

// ─────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────

export type ConnectorType = 'sandbox' | 'apifansly';

/**
 * Returns the right connector instance for a given connector_accounts row.
 * credentials is the already-decrypted JSON string – never log it.
 */
export function createConnector(
  type: ConnectorType,
  credentials?: string
): PlatformConnector {
  switch (type) {
    case 'sandbox':
      return new SandboxConnector();

    case 'apifansly':
      if (!credentials) throw new Error('[connector] apifansly requires credentials');
      throw new Error('[connector] ApifanslyConnector is not implemented yet; use sandbox until the API contract is configured');

    default:
      throw new Error(`[connector] Unknown connector type: ${type}`);
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
