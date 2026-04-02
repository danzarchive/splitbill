# SplitBill

[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://bayarbill.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

> **Biar Ga Ada Yang Nombok** - Aplikasi web untuk membagi tagihan antar teman dengan mudah.

[🇮🇩 **Live Demo** → bayarbill.vercel.app](https://bayarbill.vercel.app)

---

## ✨ Features

- 📝 **Buat Bill Instan** - Tambah tagihan dengan judul dan deskripsi
- 👥 **Manajemen Peserta** - Tambah/hapus orang yang patungan
- 🍔 **Manajemen Item** - Input menu, harga, quantity
- 💰 **Pembagian Otomatis** - Bagi rata atau atur manual per item
- 🧾 **PPN & Service Charge** - Pajak 10% default, editable
- 🖼️ **Export Gambar** - Simpan ringkasan sebagai PNG
- 🌐 **Multi Bahasa** - Indonesia & English
- 📱 **Mobile First** - Responsive design
- 🗑️ **Auto Delete** - Bill hapus otomatis setelah 30 hari
- 🔗 **Shareable Link** - Bagikan link ke teman

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 16](https://nextjs.org) + App Router |
| **Language** | [TypeScript](https://typescriptlang.org) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Database** | [Turso](https://turso.tech) (SQLite) + [Prisma](https://prisma.io) |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app) |
| **Export** | [html-to-image](https://github.com/bubkoo/html-to-image) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs) |
| **Icons** | [Lucide React](https://lucide.dev) |

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/danzarchive/splitbill.git
cd splitbill

# Install dependencies
npm install

# Setup environment
# Copy .env.example ke .env dan isi dengan credentials Turso

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🔧 Environment Variables

Buat file `.env`:

```env
# Database (Required)
DATABASE_URL="libsql://your-db.turso.io"
DATABASE_AUTH_TOKEN="your-turso-token"

# Security (Required)
CRON_SECRET="random-secret-for-cleanup-api"

# App Config (Optional)
NEXT_PUBLIC_APP_URL="https://bayarbill.vercel.app"
NEXT_PUBLIC_DEFAULT_CURRENCY="IDR"
BILL_EXPIRY_DAYS="30"
DEFAULT_TAX_RATE="10"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | Turso database URL |
| `DATABASE_AUTH_TOKEN` | ✅ | - | Turso auth token |
| `CRON_SECRET` | ✅ | - | Secret for cleanup API |
| `NEXT_PUBLIC_APP_URL` | ❌ | Auto | Public app URL for share links |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | ❌ | IDR | Default currency (IDR, USD, SGD) |
| `BILL_EXPIRY_DAYS` | ❌ | 30 | Auto-delete bills after X days |
| `DEFAULT_TAX_RATE` | ❌ | 10 | Default PPN percentage |

---

## 📖 Usage

1. **Buat Bill Baru** - Klik "Split Bill-in Aja" dan masukkan judul
2. **Tambah Peserta** - Masukkan nama orang yang patungan
3. **Tambah Item** - Input nama menu, harga, dan quantity
4. **Atur Pembagian** - Pilih "Atur Pembagian" untuk tentuin siapa bayar apa
5. **Lihat Ringkasan** - Klik "Lihat Detail" untuk total per orang
6. **Export/Share** - Export gambar atau copy link untuk share

---

## 📝 License

[MIT](LICENSE)

---

<p align="center">
  Dibuat dengan ❤️ oleh <a href="https://github.com/danzarchive">@danzarchive</a>
  <br>
  <a href="https://bayarbill.vercel.app">bayarbill.vercel.app</a>
</p>
