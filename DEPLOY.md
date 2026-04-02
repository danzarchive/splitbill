# SplitBill - Deployment Guide

## Project Overview
SplitBill adalah aplikasi web untuk membagi tagihan antar teman dengan mudah.

## Tech Stack
- Next.js 15 + App Router
- TypeScript + Tailwind CSS
- Prisma + SQLite (Turso untuk production)
- next-intl (i18n)
- html2canvas (export image)

## Deployment to Vercel

### 1. Environment Variables

Tambahkan di Vercel Dashboard:

**Required:**
```
DATABASE_URL="libsql://your-db.turso.io"
DATABASE_AUTH_TOKEN="your-turso-token"
CRON_SECRET="random-secret-for-cron"
```

**Optional:**
```
NEXT_PUBLIC_APP_URL="https://bayarbill.vercel.app"
NEXT_PUBLIC_DEFAULT_CURRENCY="IDR"
BILL_EXPIRY_DAYS="30"
DEFAULT_TAX_RATE="10"
```

### 2. Build Settings
Build Command:
```
prisma generate && next build
```

### 3. Cron Job Setup
Di Vercel Dashboard → Cron Jobs:
- URL: `/api/cleanup`
- Schedule: `0 0 * * *` (daily at midnight)
- Secret: `CRON_SECRET`

### 4. Database Setup (Turso)
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create splitbill

# Get connection URL
turso db show splitbill

# Generate auth token
turso db tokens create splitbill
```

Update `.env` dengan credentials dari Turso.

### 5. Deploy
```bash
# Push to GitHub
git add .
git commit -m "Initial release"
git push origin main

# Connect to Vercel
# 1. Import project from GitHub
# 2. Add environment variables
# 3. Deploy
```

## Local Development
```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000

## Features
✅ Create bill dengan title & description
✅ Add/remove participants
✅ Add items dengan price & quantity
✅ Exact amount split assignment
✅ Tax 10% default, editable
✅ Service charge optional
✅ Export summary sebagai PNG
✅ Multi-language (ID/EN)
✅ Auto-delete after 30 days
✅ Mobile responsive

## License
MIT
