# PRD: SplitBill Web App (v1.0)

## Overview
Aplikasi web untuk membagi tagihan (bill splitting) antar teman/grup dengan kemudahan share via link. No authentication, auto-delete after 30 days.

## Tech Stack
- **Framework**: Next.js 15 + App Router + Server Actions
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4
- **Database**: Turso (SQLite) + Prisma ORM
- **State**: Server Components (data) + Zustand (UI state only)
- **Deploy**: Vercel (free) + Turso (free tier)
- **Export**: html2canvas untuk generate PNG

## Core Features

### 1. Bill Creation
- Form: Title, Description (optional)
- Auto-generate unique URL (`/bill/[id]`)
- Auto-delete after **30 days**
- No authentication required

### 2. Participant Management
- Add/remove participant (nama only)
- No limit jumlah participant
- Simple list UI

### 3. Item Management
- Add item: Nama, Harga (IDR), Quantity
- **Tax: 10% default**, bisa edit (0-100%)
- **Service charge**: Optional (0-20%)
- Edit/delete item
- Harga stored in IDR cents (integer) untuk precision

### 4. Split Assignment (Exact Amount)
- Per item, assign ke participant dengan **input exact amount**
- Support multiple participant per item
- Validation: Total assigned must equal Item price
- Manual input untuk flexibility

### 5. Summary & Export
- Total per person (include tax & service breakdown)
- **Export image** (PNG) dari summary view menggunakan html2canvas
- Copy summary text to clipboard
- Show who owes who (simplified debts)

### 6. Multi-language (i18n)
- Default: **Bahasa Indonesia**
- Toggle: **English**
- Save language preference to localStorage
- Use next-intl untuk i18n

## Database Schema (Prisma)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Bill {
  id          String   @id @default(cuid())
  title       String
  description String?
  taxRate     Float    @default(10) // percentage (e.g., 10 = 10%)
  serviceRate Float    @default(0)   // percentage (e.g., 5 = 5%)
  currency    String   @default("IDR")
  createdAt   DateTime @default(now())
  expiresAt   DateTime @default(dbgenerated("datetime('now', '+30 days')"))
  
  participants Participant[]
  items       Item[]
  
  @@index([expiresAt])
}

model Participant {
  id     String @id @default(cuid())
  name   String
  bill   Bill   @relation(fields: [billId], references: [id], onDelete: Cascade)
  billId String
  splits Split[]
  
  @@index([billId])
}

model Item {
  id       String  @id @default(cuid())
  name     String
  price    Int     // in IDR cents (smallest unit, e.g., 150000 = Rp 1,500.00)
  quantity Int     @default(1)
  bill     Bill    @relation(fields: [billId], references: [id], onDelete: Cascade)
  billId   String
  splits   Split[]
  
  @@index([billId])
}

model Split {
  id            String      @id @default(cuid())
  amount        Int         // in IDR cents, exact amount assigned to participant
  item          Item        @relation(fields: [itemId], references: [id], onDelete: Cascade)
  itemId        String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  participantId String
  
  @@unique([itemId, participantId])
  @@index([itemId])
  @@index([participantId])
}
```

## Page Structure

| Route | Function | Type |
|-------|----------|------|
| `/` | Landing + Create bill form | Server Component |
| `/bill/[id]` | Bill workspace (participants, items, split assignment) | Server Component + Client Components |
| `/bill/[id]/summary` | Final calculation + export image | Server Component + Client Components |

## Component Structure

```
app/
├── [locale]/                    # i18n routing
│   ├── page.tsx                  # Home / Create bill
│   ├── layout.tsx                # Root layout dengan i18n
│   └── bill/
│       └── [id]/
│           ├── page.tsx          # Bill detail
│           └── summary/
│               └── page.tsx      # Summary + export
├── api/
│   └── cleanup/
│       └── route.ts              # Cron job untuk auto-delete
├── actions/
│   ├── bill-actions.ts           # Server Actions: create, get, delete bill
│   ├── participant-actions.ts    # Server Actions: add, remove participant
│   ├── item-actions.ts           # Server Actions: add, update, delete item
│   └── split-actions.ts          # Server Actions: assign, update splits
├── components/
│   ├── CreateBillForm.tsx        # Form create bill
│   ├── ParticipantManager.tsx    # List + add/remove participants
│   ├── ItemList.tsx              # CRUD items
│   ├── TaxEditor.tsx             # Edit tax & service rates
│   ├── SplitAssigner.tsx         # Exact amount assignment UI
│   ├── SummaryView.tsx           # Calculation display
│   ├── ExportImage.tsx           # html2canvas export button
│   ├── LanguageToggle.tsx        # ID/EN switcher
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── calculator.ts             # Split calculation logic
│   └── utils.ts                  # Helpers (currency format, etc.)
├── stores/
│   └── ui-store.ts               # Zustand: UI state only
├── i18n/
│   ├── messages/
│   │   ├── id.json               # Indonesian translations
│   │   └── en.json               # English translations
│   └── config.ts                 # i18n configuration
└── middleware.ts                 # i18n middleware
```

## Server Actions

### Bill Actions
```typescript
// actions/bill-actions.ts
'use server'

async function createBill(formData: FormData): Promise<Bill>
async function getBill(id: string): Promise<BillWithRelations>
async function deleteExpiredBills(): Promise<number> // returns deleted count
```

### Participant Actions
```typescript
// actions/participant-actions.ts
'use server'

async function addParticipant(billId: string, name: string): Promise<Participant>
async function removeParticipant(id: string): Promise<void>
```

### Item Actions
```typescript
// actions/item-actions.ts
'use server'

async function addItem(billId: string, data: ItemData): Promise<Item>
async function updateItem(id: string, data: Partial<ItemData>): Promise<Item>
async function deleteItem(id: string): Promise<void>
async function updateTaxRates(billId: string, taxRate: number, serviceRate: number): Promise<Bill>
```

### Split Actions
```typescript
// actions/split-actions.ts
'use server'

async function assignSplit(itemId: string, participantId: string, amount: number): Promise<Split>
async function updateSplit(id: string, amount: number): Promise<Split>
async function removeSplit(id: string): Promise<void>
async function validateSplits(itemId: string): Promise<boolean> // check if total equals item price
```

## Calculation Logic

### Per-Item Calculation
```typescript
interface ItemCalculation {
  itemSubtotal: number;        // price * quantity
  itemTax: number;             // itemSubtotal * (taxRate / 100)
  itemService: number;         // itemSubtotal * (serviceRate / 100)
  itemTotal: number;           // itemSubtotal + itemTax + itemService
}
```

### Per-Participant Calculation
```typescript
interface ParticipantTotal {
  participantId: string;
  name: string;
  subtotal: number;            // sum of assigned amounts (before tax)
  taxShare: number;            // proportional tax based on subtotal
  serviceShare: number;        // proportional service based on subtotal
  total: number;               // subtotal + taxShare + serviceShare
}
```

### Simplified Debts
```typescript
interface Debt {
  from: string;                // participant who owes
  to: string;                  // participant who should receive
  amount: number;              // amount to pay
}

// Algorithm: Minimize number of transactions
// 1. Calculate net balance for each participant (total they paid - total they owe)
// 2. Separate into debtors (negative balance) and creditors (positive balance)
// 3. Match debtors to creditors to minimize transactions
```

## Export Image Feature

### Implementation
- Library: `html2canvas` atau `html-to-image`
- Target element: Summary card/container
- Format: PNG
- Filename: `splitbill-[bill-title]-[date].png`

### UI Flow
1. User clicks "Export Image" button
2. Show loading state
3. Generate canvas from summary element
4. Trigger download
5. Show success toast

## i18n Implementation

### Language Toggle
- Position: Header/navbar
- Options: 🇮🇩 ID / 🇬🇧 EN
- Save to localStorage
- Default: ID

### Translation Keys Structure
```json
{
  "home": {
    "title": "SplitBill",
    "subtitle": "Bagi tagihan dengan mudah",
    "createButton": "Buat Bill Baru"
  },
  "bill": {
    "participants": "Peserta",
    "items": "Item",
    "tax": "Pajak",
    "service": "Biaya Layanan",
    "total": "Total"
  },
  "summary": {
    "title": "Ringkasan",
    "exportImage": "Export Gambar",
    "copyText": "Copy Text",
    "perPerson": "Per Orang"
  }
}
```

## Auto-Delete Implementation

### Option 1: Vercel Cron Job (Recommended)
```typescript
// app/api/cleanup/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  const deleted = await prisma.bill.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
  return Response.json({ deleted: deleted.count });
}
```
- Setup: Vercel Cron (free tier: 1 execution/day)
- Schedule: Daily at midnight

### Option 2: Soft Delete + Cleanup
- Add `isExpired` boolean
- Show expired message saat access
- Cron hard delete setelah 7 hari expired

## Dependencies

```json
{
  "dependencies": {
    "next": "^15.0",
    "react": "^19.0",
    "react-dom": "^19.0",
    "@prisma/client": "^6.0",
    "@libsql/client": "^0.14",
    "zustand": "^5.0",
    "html2canvas": "^1.4",
    "next-intl": "^3.0",
    "lucide-react": "latest",
    "clsx": "^2.0",
    "tailwind-merge": "^2.0"
  },
  "devDependencies": {
    "prisma": "^6.0",
    "typescript": "^5.0",
    "tailwindcss": "^4.0",
    "@types/node": "^20.0",
    "@types/react": "^19.0",
    "@types/react-dom": "^19.0"
  }
}
```

## Environment Variables

```bash
# Database
DATABASE_URL="libsql://[db-name]-[username].turso.io"
DATABASE_AUTH_TOKEN="[turso-auth-token]"

# Cron (optional, untuk verify cron requests)
CRON_SECRET="random-secret-key"
```

## Deployment Checklist

- [ ] Setup Turso database
- [ ] Run Prisma migrations
- [ ] Setup Vercel project
- [ ] Add environment variables
- [ ] Configure Vercel Cron (if using auto-delete)
- [ ] Test all CRUD operations
- [ ] Test export image feature
- [ ] Test i18n toggle
- [ ] Mobile responsive check

## Future Enhancements (v2.0)

- [ ] QR Code share
- [ ] Equal split method option
- [ ] Percentage split method
- [ ] History/saved bills (with auth)
- [ ] Receipt upload (OCR)
- [ ] Real-time collaboration
- [ ] PWA support
- [ ] Push notifications

---

**Created**: 2026-04-01  
**Status**: Ready for Implementation
