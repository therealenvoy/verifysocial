/**
 * Webhook Idempotency Service
 *
 * Guarantees each platform event is processed exactly once.
 * Uses insert-on-conflict to handle parallel delivery races.
 *
 * Security rule:
 *   Same externalEventId + different payloadHash = security event.
 *   Do NOT reprocess. Log a critical policy_event and return.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db/client'; // Drizzle db instance with schema
import { platformEvents, policyEvents } from '../db/schema';
import { hashPayload } from './encryption';

export type IdempotencyResult =
  | { outcome: 'processed' }
  | { outcome: 'duplicate'; existingId: string }
  | { outcome: 'hash_mismatch'; existingId: string }
  | { outcome: 'error'; error: string };

/**
 * Wrap a webhook handler to guarantee exactly-once processing.
 *
 * @param connectorAccountId  - DB id of the connector account
 * @param externalEventId     - Platform's unique event ID (e.g., Fansly message ID)
 * @param eventType           - e.g., 'message_created'
 * @param payload             - Raw webhook payload object
 * @param handler             - Your processing logic. Called only if event is new.
 * @param creatorId           - For logging policy events on security anomalies
 */
export async function withIdempotency(
  connectorAccountId: string,
  externalEventId: string,
  eventType: string,
  payload: unknown,
  handler: () => Promise<void>,
  creatorId?: string,
): Promise<IdempotencyResult> {
  const payloadHash = hashPayload(payload);

  // ── Attempt atomic insert (wins the race) ────────────────────────────────
  // onConflictDoNothing: if another worker already inserted this event,
  // this insert is silently skipped and we get zero rows back.
  const inserted = await db
    .insert(platformEvents)
    .values({
      connectorAccountId,
      externalEventId,
      eventType,
      payloadHash,
      status: 'processing',
      metadata: { receivedAt: new Date().toISOString() },
    })
    .onConflictDoNothing({
      target: [platformEvents.connectorAccountId, platformEvents.externalEventId],
    })
    .returning({ id: platformEvents.id });

  // ── Another worker won the race ────────────────────────────────────────
  if (inserted.length === 0) {
    // Fetch existing record to check for hash mismatch
    const existing = await db.query.platformEvents.findFirst({
      where: and(
        eq(platformEvents.connectorAccountId, connectorAccountId),
        eq(platformEvents.externalEventId, externalEventId),
      ),
      columns: { id: true, payloadHash: true, status: true },
    });

    if (!existing) {
      // Should not happen, but guard it
      return { outcome: 'error', error: 'Race condition: event not found after conflict' };
    }

    // Security check: same event ID, different payload = suspicious
    if (existing.payloadHash !== payloadHash) {
      await db.insert(platformEvents)
        .values({
          connectorAccountId,
          externalEventId: `${externalEventId}_MISMATCH_${Date.now()}`,
          eventType,
          payloadHash,
          status: 'hash_mismatch',
          metadata: {
            originalEventId: externalEventId,
            existingHash: existing.payloadHash,
            receivedHash: payloadHash,
            detectedAt: new Date().toISOString(),
          },
        });

      if (creatorId) {
        await db.insert(policyEvents).values({
          creatorId,
          severity: 'critical',
          eventType: 'webhook_hash_mismatch',
          actionTaken: 'security_flagged',
          metadata: {
            connectorAccountId,
            externalEventId,
            existingHash: existing.payloadHash,
            receivedHash: payloadHash,
          },
        });
      }

      return { outcome: 'hash_mismatch', existingId: existing.id };
    }

    // Legitimate duplicate delivery
    return { outcome: 'duplicate', existingId: existing.id };
  }

  // ── We own this event – run the handler ───────────────────────────────
  const eventId = inserted[0].id;

  try {
    await handler();

    await db
      .update(platformEvents)
      .set({ status: 'processed', processedAt: new Date() })
      .where(eq(platformEvents.id, eventId));

    return { outcome: 'processed' };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

    await db
      .update(platformEvents)
      .set({
        status: 'failed',
        metadata: {
          error,
          failedAt: new Date().toISOString(),
        },
      })
      .where(eq(platformEvents.id, eventId));

    return { outcome: 'error', error };
  }
}
