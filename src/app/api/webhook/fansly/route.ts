import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { platformEvents } from "@/db/schema";
import { hashPayload } from "@/lib/encryption";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const signature = request.headers.get("x-fansly-signature");
    
    // TODO: Verify signature with connector
    // For now, accept all in sandbox mode
    
    const payloadHash = hashPayload(rawBody);
    const externalEventId = payload.id || `event_${Date.now()}`;
    
    // Insert with idempotency
    const [event] = await db
      .insert(platformEvents)
      .values({
        connectorAccountId: "sandbox", // TODO: Get from auth
        externalEventId,
        eventType: payload.type || "message_created",
        payloadHash,
        status: "pending",
        metadata: { payload },
      })
      .onConflictDoNothing({
        target: [platformEvents.connectorAccountId, platformEvents.externalEventId],
      })
      .returning();
    
    if (!event) {
      // Duplicate event
      return NextResponse.json(
        { status: "duplicate", message: "Event already processed" },
        { status: 200 }
      );
    }
    
    // TODO: Process event in background
    // For now, just mark as processed
    await db
      .update(platformEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(platformEvents.id, event.id));
    
    return NextResponse.json(
      { status: "received", eventId: event.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }
}
