# Phase 1 — COMPLETE

5 PRs shipped against master. The Ferrari schema is now connected to the
application layer: real AI processing, real inbox data, hardened webhook,
Inngest queue, and a tested CI baseline.

Verifier:
`bash "/Users/envoy/Library/Mobile Documents/iCloud~md~obsidian/Documents/envoy brain/.goal-verify-verifysocial-phase1.sh"`

## What shipped

| PR | Commit | Title |
|----|--------|-------|
| 1 | `feat(pr1): wire AI processing pipeline end-to-end` | router + idempotency + DB persist + structured logger |
| 2 | `feat(pr2): wire inbox to real Drizzle queries` | Server Component `/inbox` + `[conversationId]` route + queries.ts + clean shell |
| 3 | `feat(pr3): close the security perimeter` | HMAC webhook + t3-env + Clerk middleware + rate limiter + audit log |
| 4 | `feat(pr4): wire Inngest background queue` | client + functions + serve route + action emits processed event |
| 5 | `feat(pr5): testing + CI baseline` | vitest + playwright + 20 unit tests + 4 e2e specs + GitHub Actions |

20 unit tests pass in <250ms. Lint, typecheck, build are all green.

## Demoable state

You can now demo the app end-to-end without lying:

- Open `/inbox` → fetches real conversations from Postgres (gracefully empty if no data)
- Click a conversation → loads from `/inbox/[conversationId]` with real messages
- Webhook POSTs to `/api/webhook/fansly` → HMAC-verified, idempotent, audited
- `processFanMessageAction` calls the AI router with real conversation history, persists, audits
- Inngest queue mounted at `/api/inngest` ready for async processing
- All inputs validated through `src/env.mjs` at boot

## Setup actions required

Phase 1 stubs every external integration so the app boots and tests pass
without provisioning. Before going live, the following keys must be set
on Railway (or your runtime env):

### Required for production

| Env var | Purpose | Where to provision |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | Neon dashboard → branches → connection |
| `ENCRYPTION_MASTER_KEY` | 64 hex chars (32 bytes) for AES-256-GCM envelope | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key | clerk.com → API Keys |
| `CLERK_SECRET_KEY` | Clerk server key | clerk.com → API Keys |
| `FANSLY_WEBHOOK_SECRET` | HMAC-SHA256 shared secret with Fansly | Fansly connector dashboard |

### Strongly recommended

| Env var | Purpose | Fallback if absent |
|---|---|---|
| `DEEPSEEK_API_KEY` | Cheap default AI model | Router returns deterministic sandbox stub |
| `ANTHROPIC_API_KEY` | Claude for VIP fans / long convos | Router falls back to DeepSeek or sandbox |
| `OPENAI_API_KEY` | GPT-4o for sales-intent messages | Router falls back to sandbox |
| `INNGEST_EVENT_KEY` | Inngest cloud event ingestion | No-op send (events not delivered) |
| `INNGEST_SIGNING_KEY` | Inngest serve HMAC verification | Adapter accepts unsigned (dev only) |
| `STRIPE_SECRET_KEY` | Billing | Stripe code paths skip |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing | n/a — webhook handler not wired in PR 1 |

### Optional

| Env var | Purpose |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring (Phase 2 wires Sentry SDK) |
| `LOG_LEVEL` | Set to `debug` to enable debug-level logger output |

## Open questions surfaced during Phase 1

- Should rate-limit buckets share state across replicas (Upstash) or per-replica
  suffices for current scale? Today: in-process; Phase 2 if traffic grows.
- The Fansly webhook `x-connector-id` header contract is internal. What does
  Fansly actually send in production? Unblock by verifying with the connector
  integration docs.
- Typed Inngest events via `eventType()` + StandardSchema vs untyped: kept
  untyped for Phase 1 to keep surface small; revisit when we have 5+ events.
- The `[conversationId]` route fully resolves before render. Phase 2 introduces
  Suspense streaming once SSE arrives.
- Should the CI workflow gate merges via required status checks? Branch
  protection settings deferred to repo owner.
- 50-message default cap on `getMessages` is arbitrary; scroll-to-load-older
  comes when there's real volume.

## What's explicitly NOT shipped (deferred to Phase 2+)

- AI persona development (creator-specific tones)
- Cmd-K palette / full keyboard shortcuts
- Mobile responsive overhaul beyond the existing breakpoints
- Design system token migration (Liquid Glass still uses inline RGBA)
- pgvector / RAG retrieval over `fan_memories`
- Multi-tenant Postgres RLS (still application-enforced)
- Audit log explorer UI (writes work; admin route comes later)
- Stripe billing route handler
- Email / push notifications
- Browserbase Fansly connector — `connector_accounts.connector_type = 'apifansly'`
  still throws "not implemented yet" in `src/lib/connectors.ts`

## File-level diff at a glance

New top-level surfaces:

```
app/api/inngest/route.ts
app/api/webhook/fansly/route.ts
app/inbox/[conversationId]/page.tsx
middleware.ts
src/env.mjs
src/inngest/client.ts
src/inngest/functions.ts
src/lib/audit-log.ts
src/lib/logger.ts
src/lib/queries.ts
src/lib/rate-limit.ts
tests/setup.ts
tests/unit/ai-router.test.ts
tests/unit/encryption.test.ts
tests/unit/idempotency.test.ts
tests/e2e/inbox.spec.ts
tests/e2e/auth.spec.ts
.github/workflows/ci.yml
.phase1-progress.md
.env.test
playwright.config.ts
vitest.config.ts
```

Modified:

```
app/inbox/page.tsx        (879-line mockup → Server Component data layer)
src/actions/ai-processing.ts  (hard-coded string → real pipeline + Inngest emit)
src/db/client.ts          (eager neon() → lazy Proxy init)
src/lib/ai-router.ts      (added complete(), MODEL_PRICING, sandbox fallback, cost-math fix)
package.json              (added test scripts + inngest + vitest + playwright)
```

Removed:

```
src/app/api/webhook/fansly/route.ts  (dead — root app/ took precedence in Next 15)
```

## Next steps

Phase 2 begins after this verifier exits 0. Top of that backlog:
- Browserbase Fansly connector (5+ days, single biggest risk)
- TanStack Query + optimistic mutations in the inbox shell
- SSE real-time stream at `/api/v1/inbox/stream`
- Storybook 8 + Chromatic visual regression
- Multi-tenant RLS policies on Neon
- `audit_logs` and `security_events` tables (split from `policy_events`)

Detailed sequence in `wiki/synthesis/2026-05-18-30-60-90-technical-roadmap.md`.
