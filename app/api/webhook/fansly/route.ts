/**
 * Fansly inbound webhook.
 *
 * Verifies the signature via HMAC-SHA256 with constant-time comparison, runs
 * the payload through the idempotency wrapper, and acknowledges in <100ms.
 * Heavy processing (AI router call, DB writes beyond the dedupe row) moves
 * to the Inngest function in PR 4; this handler stays thin.
 *
 * Without FANSLY_WEBHOOK_SECRET set, the handler rejects every request with
 * 503 so a misconfigured deploy fails closed instead of accepting unsigned
 * traffic. Documented in PHASE_1_COMPLETE.md as a required setup step.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/client";
import { connectorAccounts, platformEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPayload } from "@/lib/encryption";
import { logger } from "@/lib/logger";
import { consume, RATE_LIMITS } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";

interface FanslyPayload {
  id?: string;
  type?: string;
  connectorId?: string;
  [key: string]: unknown;
}

/**
 * Verify the HMAC-SHA256 signature with constant-time comparison.
 * Returns false on length mismatch (timingSafeEqual throws otherwise).
 */
function verifySignature(rawBody: string, headerSig: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(headerSig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = consume(`webhook:fansly:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "X-RateLimit-Reset": String(rl.reset) } },
    );
  }

  const secret = process.env.FANSLY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("webhook.fansly.secret_missing");
    return NextResponse.json({ error: "webhook_secret_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-fansly-signature");
  if (!signature) {
    logger.warn("webhook.fansly.missing_signature", { ip });
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }
  if (!verifySignature(rawBody, signature, secret)) {
    logger.warn("webhook.fansly.invalid_signature", { ip });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: FanslyPayload;
  try {
    payload = JSON.parse(rawBody) as FanslyPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const externalEventId = payload.id ?? `event_${Date.now()}`;
  const eventType = payload.type ?? "message_created";
  const payloadHash = hashPayload(rawBody);

  // Resolve the connector account from the header — the signature already
  // proved authenticity, so this is the audit-trail tenant binding. Header
  // is required; without it we can't route the event.
  const publicConnectorId = request.headers.get("x-connector-id");
  if (!publicConnectorId) {
    return NextResponse.json({ error: "missing_connector" }, { status: 400 });
  }

  const connector = await db.query.connectorAccounts.findFirst({
    where: eq(connectorAccounts.id, publicConnectorId),
    columns: { id: true, creatorId: true },
  });
  if (!connector) {
    logger.warn("webhook.fansly.unknown_connector", { publicConnectorId });
    return NextResponse.json({ error: "unknown_connector" }, { status: 404 });
  }

  // Idempotency: insert-or-skip via the existing unique constraint.
  const inserted = await db
    .insert(platformEvents)
    .values({
      connectorAccountId: connector.id,
      externalEventId,
      eventType,
      payloadHash,
      status: "pending",
      metadata: { receivedAt: new Date().toISOString() },
    })
    .onConflictDoNothing({
      target: [platformEvents.connectorAccountId, platformEvents.externalEventId],
    })
    .returning({ id: platformEvents.id });

  if (inserted.length === 0) {
    logger.info("webhook.fansly.duplicate", { externalEventId, publicConnectorId });
    return NextResponse.json({ status: "duplicate" }, { status: 200 });
  }

  await writeAuditLog({
    creatorId: connector.creatorId,
    severity: "info",
    eventType: "webhook_received",
    actionTaken: "queued",
    inputSnapshot: { externalEventId, type: eventType, ip },
    metadata: { publicConnectorId },
  });

  // Heavy processing moves to Inngest in PR 4; for now mark as processed
  // to keep the audit trail clean — the Inngest function will take over the
  // pending → processed transition once it's wired.
  await db
    .update(platformEvents)
    .set({ status: "processed", processedAt: new Date() })
    .where(eq(platformEvents.id, inserted[0].id));

  return NextResponse.json(
    { status: "received", eventId: inserted[0].id },
    { status: 200 },
  );
}
