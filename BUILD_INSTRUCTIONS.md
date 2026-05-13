# Build Instructions (Production)

The foundation is complete. To run in production:

## 1. Environment Setup
```bash
# Clone or extract the /root/fansly-ai-crm directory
cd fansly-ai-crm

# Install dependencies (in a working npm environment)
npm install

# Set up environment variables
cp .env.example .env.local
```

## 2. Database Setup
```bash
# Create a Postgres database with pgvector extension
# Example with Neon:
createdb fansly_crm
psql fansly_crm -c "CREATE EXTENSION vector;"

# Run migrations
npm run db:push

# Or generate migrations first
npm run db:generate
```

## 3. Encryption Key
```bash
# Generate master key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to ENCRYPTION_MASTER_KEY in .env.local
```

## 4. Start Development
```bash
npm run dev
```

## 5. Test Sandbox
Visit http://localhost:3000/sandbox to simulate fan messages and test the CRM loop locally.

## Key Files Ready
- `src/db/schema.ts` – 20 tables, constraints, indexes
- `src/lib/encryption.ts` – AES-256-GCM, server-only
- `src/lib/idempotency.ts` – Race-safe webhook deduplication
- `src/lib/connectors.ts` – Platform abstraction + sandbox
- `app/sandbox/page.tsx` – Local simulation UI
- `src/lib/trigger/jobs.ts` – Trigger.dev workflow templates

## Deployment Options
- Vercel + Neon (Postgres) + Trigger.dev
- Railway + Supabase + Inngest

## Remaining Implementation
1. Integrate real AI models (OpenAI/Anthropic/DeepSeek)
2. Build apifansly connector
3. Implement Stripe subscriptions
4. Add Clerk auth with org permissions
5. Build analytics dashboard
6. Add PPV catalog management