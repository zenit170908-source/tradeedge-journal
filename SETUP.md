
# TradeEdge Journal — Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Vercel account (free tier works)

---

## 1. Local Development

```bash
# Clone / create folder
mkdir trading-journal && cd trading-journal

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local
```

Fill in .env.local:
- Go to supabase.com → your project → Settings → API
- Copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL
- Copy "anon public" key → NEXT_PUBLIC_SUPABASE_ANON_KEY

```bash
# Run dev server
npm run dev
# Open http://localhost:3000
```

---

## 2. Supabase Setup

1. Go to Supabase Dashboard → SQL Editor → New Query
2. Paste the entire contents of supabase/schema.sql
3. Click Run
4. Go to Storage → Create bucket named "trade-screenshots" (public)

---

## 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Production deploy
vercel --prod
```

After deploying, add your Vercel domain to Supabase:
- Supabase → Authentication → URL Configuration
- Site URL: https://your-app.vercel.app
- Redirect URL: https://your-app.vercel.app/api/auth/callback
