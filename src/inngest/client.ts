/**
 * Inngest client.
 *
 * Constructed with the event key when one is provisioned; without it the
 * SDK runs in local-dev mode where send() is a no-op and createFunction
 * still produces a valid definition for type-safety. This keeps Phase 1
 * working without a real Inngest account — the route handler at
 * app/api/inngest/route.ts will still resolve, the dev server will still
 * accept events, and production picks up the live backend the moment
 * INNGEST_EVENT_KEY is set.
 *
 * Event typing is deferred to Inngest 4.x's StandardSchema-based eventType
 * helper; for Phase 1 we keep untyped sends so the surface stays small.
 */
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "verifysocial",
  // eventKey may be undefined in dev/test; Inngest tolerates this and
  // produces local-only no-op sends until a real key is provided.
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type InngestClient = typeof inngest;
