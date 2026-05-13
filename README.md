# Fansly AI CRM

AI-powered CRM for Fansly creators. Automates conversations, builds relationships, and sells PPVs.

## 🚀 Features

- **Sandbox-First Development**: Local simulation with no external dependencies
- **Real Encryption**: AES-256-GCM envelope encryption for credentials
- **Webhook Idempotency**: Exactly-once processing with hash mismatch detection
- **Platform Abstraction**: Swap Fansly connectors without touching business logic
- **AI Model Router**: DeepSeek default, Claude/GPT fallbacks
- **Safety First**: Draft-only, auto-low-risk, approval-required modes
- **Audit Trail**: Full policy events, redacted snapshots, 30-day retention

## 🚀 Quick Deployment (Railway)

### **One-Click Deploy**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/nextjs?referralCode=your-repo)

### **Manual Railway Setup**
```bash
# 1. Install CLI
npm i -g @railway/cli
railway login

# 2. Create project
railway init

# 3. Add PostgreSQL
railway add postgresql
railway run psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Set environment variables (Railway dashboard → Variables)
#    - ENCRYPTION_MASTER_KEY (64 hex chars)
#    - CLERK_* keys (from clerk.com)
#    - DEEPSEEK_API_KEY (from platform.deepseek.com)
#    - STRIPE_* keys (from stripe.com)

# 5. Deploy
railway up
```

### **Generate Encryption Key**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Database Schema

20 normalized tables with:
- Integer cents/micros for money (no decimals)
- Unique constraints on key columns
- Practical indexes for hot queries
- Denormalized creatorId on messages for performance
- Partial unique indexes where platform IDs exist

## 🔐 Security

- Server-only encryption (`node:crypto`)
- Credentials never logged
- Hash mismatch detection = security event
- Redacted snapshots (sensitive keys stripped)
- Retention windows (purge after 30 days)

## 🧪 Getting Started

### 1. Clone & Install
```bash
git clone <repo>
cd fansly-ai-crm
cp .env.example .env.local
# Edit .env.local with your values
npm install
```

### 2. Database Setup
```bash
# Run migrations
npm run db:push

# Or generate migrations first
npm run db:generate
```

### 3. Start Development
```bash
npm run dev
```

Visit http://localhost:3000/sandbox for the local simulation.

## 📁 Project Structure

```
fansly-ai-crm/
├── src/db/schema.ts          # 20-table Drizzle schema
├── src/lib/encryption.ts     # AES-256-GCM envelope encryption
├── src/lib/idempotency.ts    # Webhook deduplication
├── src/lib/connectors.ts     # Platform abstraction + sandbox
├── src/lib/trigger/          # Trigger.dev jobs
├── app/                      # Next.js app router
│   ├── sandbox/page.tsx      # Local simulation UI
│   └── page.tsx              # Landing
└── drizzle/                  # Migration files
```

## 🛡️ Safety Modes

1. **Sandbox**: Test responses without sending
2. **Draft-Only**: AI drafts, creator approves
3. **Auto Low-Risk**: AI replies to low-risk messages automatically
4. **Auto All with Approval**: AI handles all, creator reviews daily

## 📊 Key Metrics

- PPV revenue, unlock rate, reply rate
- Revenue per conversation, per fan
- Time saved, AI blocked/escalated counts
- Top converting PPVs, churn-risk fans

## 🤝 Contributing

1. Schema changes → update `/src/db/schema.ts`
2. Run `npm run db:generate` for migrations
3. Never store raw adult content in snapshots
4. Follow integer cents pattern for money
5. Use envelope encryption for credentials
