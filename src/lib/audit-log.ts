/**
 * Audit log helper.
 *
 * Phase 1 piggy-backs on the existing policy_events table — Phase 2 splits
 * audit logging into a dedicated audit_logs table per the data-model spec.
 * The shape here matches the future split so the migration is mechanical:
 * caller passes a typed record, helper writes to policy_events today, and
 * we swap the destination later without touching call sites.
 */

import { db } from "@/db/client";
import { policyEvents } from "@/db/schema";
import { redactSnapshot } from "@/lib/encryption";
import { logger } from "@/lib/logger";

export type AuditSeverity = "info" | "warning" | "error" | "critical" | "security";

export interface AuditLogEntry {
  creatorId: string;
  severity: AuditSeverity;
  eventType: string;
  actionTaken: string;
  ruleId?: string;
  inputSnapshot?: unknown;
  outputSnapshot?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Persist a typed audit entry. Snapshots run through redactSnapshot before
 * the write so secrets/credentials never reach the DB even if the caller
 * accidentally hands us a full payload.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(policyEvents).values({
      creatorId: entry.creatorId,
      severity: entry.severity,
      eventType: entry.eventType,
      actionTaken: entry.actionTaken,
      ruleId: entry.ruleId,
      inputSnapshot: entry.inputSnapshot !== undefined
        ? (redactSnapshot(entry.inputSnapshot) as Record<string, unknown>)
        : undefined,
      outputSnapshot: entry.outputSnapshot !== undefined
        ? (redactSnapshot(entry.outputSnapshot) as Record<string, unknown>)
        : undefined,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    // Audit log writes must never crash the caller. Log loud, drop, move on.
    logger.error("audit_log.write_failed", {
      eventType: entry.eventType,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
