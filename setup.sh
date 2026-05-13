#!/bin/bash
set -e

echo "🚀 Fansly AI CRM – Production Deployment Script"
echo "==============================================="

# 1. Check prerequisites
echo ""
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not installed"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "⚠️  psql not found (PostgreSQL client)"; }

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# 2. Install dependencies
echo ""
echo "📦 Installing dependencies..."
if [ -d "node_modules" ]; then
  echo "📁 node_modules already exists, skipping install"
else
  npm ci --omit=dev || npm install --no-audit --no-fund
fi

# 3. Environment setup
echo ""
echo "🔧 Setting up environment..."
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "📄 Created .env.local from .env.example"
    echo "⚠️  Please edit .env.local with your actual values"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - ENCRYPTION_MASTER_KEY (64 hex chars)"
    echo "   - Clerk, Stripe, AI API keys"
  else
    echo "❌ .env.example not found"
  fi
else
  echo "✅ .env.local already exists"
fi

# 4. Database setup
echo ""
echo "🗄️  Database setup..."
if command -v psql >/dev/null 2>&1; then
  echo "Checking PostgreSQL connection..."
  if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw fansly_crm; then
    echo "✅ Database 'fansly_crm' exists"
  else
    echo "📁 Creating database 'fansly_crm'..."
    createdb fansly_crm 2>/dev/null || echo "⚠️  Could not create database (might need sudo)"
  fi
  
  echo "🔌 Enabling pgvector extension..."
  psql -d fansly_crm -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || echo "⚠️  Could not enable pgvector"
else
  echo "⚠️  psql not available, skipping DB checks"
  echo "   Make sure you have PostgreSQL running with:"
  echo "   - Database: fansly_crm"
  echo "   - Extension: pgvector"
fi

# 5. Run migrations
echo ""
echo "📊 Running database migrations..."
npm run db:push 2>&1 || {
  echo "⚠️  Migration failed. Trying with Drizzle Kit..."
  npx drizzle-kit push 2>&1 || echo "❌ Could not run migrations"
}

# 6. Build
echo ""
echo "🏗️  Building application..."
npm run build 2>&1 || {
  echo "⚠️  Build failed. Check TypeScript errors above."
  echo "   You can still run dev mode with: npm run dev"
}

# 7. Start
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "   npm run dev          # Development mode"
echo "   npm start            # Production mode"
echo ""
echo "Default URLs:"
echo "   http://localhost:3000          # Landing page"
echo "   http://localhost:3000/sandbox  # Sandbox simulation"
echo ""
echo "Next steps:"
echo "   1. Edit .env.local with your API keys"
echo "   2. Run: npm run dev"
echo "   3. Set up Clerk auth (https://clerk.com)"
echo "   4. Set up Stripe billing"
echo ""