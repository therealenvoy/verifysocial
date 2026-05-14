#!/bin/bash
# VerifySocial Complete Setup Script
# Run this on your local machine to deploy everything

set -e

echo "🚀 VerifySocial Complete Setup"
echo "==============================="
echo ""
echo "This script will guide you through:"
echo "1. GitHub repository creation & push"
echo "2. Railway token setup"
echo "3. Domain registration (verifysocial.cm)"
echo "4. Production deployment"
echo ""

# Check prerequisites
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. The build will fail."
    echo "Install Node.js 20+ from https://nodejs.org"
fi

echo "📦 Current project status:"
echo "   - Brand: VerifySocial"
echo "   - Domain: verifysocial.cm (to register)"
echo "   - Theme: Linear dark (implemented)"
echo "   - Deployment: Railway via GitHub Actions"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "🔐 STEP 1: Create GitHub Repository"
echo "-----------------------------------"
echo "1. Go to https://github.com/new"
echo "2. Repository name: verifysocial (or fansly-ai-crm)"
echo "3. Visibility: Private (recommended)"
echo "4. Do NOT initialize with README, .gitignore, or license"
echo "5. Click 'Create repository'"
echo ""
echo "After creation, you'll see instructions. Run these commands:"
echo ""
echo "  git remote add origin https://github.com/YOUR_USERNAME/verifysocial.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
read -p "Have you created the GitHub repo? (y to continue): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the repo first, then re-run."
    exit 1
fi

echo ""
echo "🚂 STEP 2: Railway Token"
echo "-----------------------"
echo "1. Go to https://railway.app"
echo "2. Click your profile → Settings → Tokens"
echo "3. Click 'New Token'"
echo "4. Name: verifysocial-deploy"
echo "5. Copy the token (starts with 'railway_')"
echo ""
echo "Then add to GitHub Secrets:"
echo "1. Go to your GitHub repo → Settings → Secrets and variables → Actions"
echo "2. Click 'New repository secret'"
echo "3. Name: RAILWAY_TOKEN"
echo "4. Value: Paste your Railway token"
echo ""
read -p "Have you added the Railway token to GitHub Secrets? (y to continue): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please add the token first, then re-run."
    exit 1
fi

echo ""
echo "🌐 STEP 3: Domain Registration"
echo "-----------------------------"
echo "Register verifysocial.cm:"
echo "1. Go to https://get.cm (or any domain registrar that sells .cm)"
echo "2. Search for 'verifysocial.cm'"
echo "3. Complete purchase (≈ $50/year)"
echo ""
echo "Alternative domains (if .cm unavailable):"
echo "- verifysocial.io (≈ $60/year)"
echo "- verifyso.cm (≈ $50/year)"
echo "- getsafety.io (≈ $60/year)"
echo ""
read -p "Have you registered a domain? (y to continue): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "You can register later and update Railway."
fi

echo ""
echo "🚢 STEP 4: Push & Deploy"
echo "-----------------------"
echo "Run these commands to push and trigger deployment:"
echo ""
echo "  cd /root/fansly-ai-crm"
echo "  git push origin main"
echo ""
echo "Then check GitHub Actions:"
echo "1. Go to your repo → Actions tab"
echo "2. Watch the 'Deploy to Railway' workflow"
echo "3. Should complete in 2-5 minutes"
echo ""
echo "After deployment:"
echo "1. Go to Railway dashboard → your project → Settings → Domains"
echo "2. Add your custom domain (verifysocial.cm)"
echo "3. Wait for SSL certificate (auto-provisioned)"
echo ""

echo "✅ Setup complete! Your VerifySocial platform will be live at:"
echo "   https://verifysocial.cm"
echo ""
echo "📋 Post-deployment checklist:"
echo "   [ ] Verify dark theme is live"
echo "   [ ] Test inbox functionality"
echo "   [ ] Set up redirect from old domain (igsafetychecker.com)"
echo "   [ ] Update any marketing materials"
echo ""
echo "Need help? The complete setup guide is in .setup/README.md"