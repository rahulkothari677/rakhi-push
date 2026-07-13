# 🪔 House of Neelam — Rakhi Collection

A premium e-commerce website for handcrafted Rakhis with **WhatsApp-based ordering**, a full **admin panel**, and a luxury burgundy/gold/ivory design aesthetic celebrating the eternal bond of Raksha Bandhan.

## ✨ Features

### Customer-Facing
- 🎨 Premium burgundy + gold + ivory design with Playfair Display + Cormorant Garamond fonts
- 🛍️ Full product catalog with 9 categories (Traditional, Designer, Kids, Bhaiya-Bhabhi Lumba, Premium Gold, Silver, Handmade, Personalized, Roli-Chawal & Thali)
- 🔍 Shop with category filters, price ranges, and sort options
- 📦 Product detail pages with image galleries and related items
- 💚 **WhatsApp ordering** (single product or full cart) — orders go straight to your WhatsApp
- ❤️ Wishlist with one-click add to cart
- 📱 Fully mobile-responsive

### Admin Panel
1. **Dashboard** — sales stats, recent orders, low-stock alerts
2. **Products** — full CRUD with direct image upload from phone/laptop
3. **Categories** — full CRUD
4. **Hero Slides** — edit homepage carousel
5. **Site Content** — edit About / Story / Care / Shipping / Contact pages
6. **Orders** — view and manage WhatsApp orders
7. **Settings** — WhatsApp numbers (primary + secondary), contact info, shipping rates, announcement bar, social links, branding

## 🔑 Default Admin Credentials
- **Email**: `admin@houseofneelam.com`
- **Password**: `Neelam@Admin2026`

> ⚠️ **Change these immediately** on first login by running `bun run scripts/init-admin.ts` with a new password, or wait for the change-password feature in the next release.

## 🚀 Local Development

### Prerequisites
- Node.js 18+ or Bun
- npm/bun package manager

### Setup
```bash
# Install dependencies
bun install   # or npm install

# Push database schema
bun run db:push

# Initialize admin user + seed demo data
bun run scripts/init-admin.ts

# Generate demo SVG images
bun run scripts/generate-images.ts

# Start dev server
bun run dev
```

Visit http://localhost:3000 — you're ready to go!

## ☁️ Deploying to Vercel (Going Live)

The site runs on Vercel's free tier with a few configuration steps:

### 1. Vercel Account (Free)
- Sign up at https://vercel.com using your GitHub account
- Vercel is free for personal/hobby projects

### 2. Database — Use Turso (Free Tier)
SQLite local files **do not persist** on Vercel's serverless functions. Use Turso (SQLite-compatible, free tier, no code changes needed):

1. Sign up at https://turso.tech (free tier: 500 databases, 9 GB total)
2. Create a new database named `house-of-neelam`
3. Get your database URL (looks like `libsql://house-of-neelam-xxxx.turso.io`)
4. Generate an auth token
5. Add these environment variables in Vercel:
   ```
   DATABASE_URL=libsql://your-db.turso.io
   DATABASE_AUTH_TOKEN=your-token-here
   ```

**Note**: The Prisma schema already supports the Turso driver adapter — see `prisma/schema.prisma` line `previewFeatures = ["driverAdapters"]`. You'll need to update `src/lib/db.ts` to use the `@libsql/client` adapter when deploying with Turso.

### 3. Image Uploads — Use Cloudinary (Free Tier)
Local file uploads **don't persist** on Vercel. Use Cloudinary (free tier: 25 GB storage + 25 GB bandwidth/month):

1. Sign up at https://cloudinary.com (free)
2. From your dashboard, copy: Cloud Name, API Key, API Secret
3. Add to Vercel env vars:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

> 💡 **Currently**: Image uploads use local file system `/public/uploads/`. For Vercel, you need to wire up Cloudinary (the env vars are already set up in `.env` — just uncomment them and add the integration to `src/app/api/admin/upload/route.ts`).

### 4. NextAuth Configuration
Add these env vars to Vercel:
```
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.vercel.app
```

### 5. Deploy
1. Push your code to GitHub (see below)
2. In Vercel, click "New Project" → Import your GitHub repo
3. Vercel auto-detects Next.js — accept the defaults
4. Add all the environment variables above
5. Click Deploy — done!

Your site will be live at `https://<your-project>.vercel.app` (you can add a custom domain later in Vercel settings).

## 📦 Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: House of Neelam Rakhi website"

# Create a new empty repo on GitHub first, then:
git remote add origin https://github.com/your-username/house-of-neelam.git
git branch -M main
git push -u origin main
```

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite local / Turso production)
- **Auth**: NextAuth.js v4 (credentials provider, JWT sessions)
- **State**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Playfair Display + Cormorant Garamond + Inter (via next/font)

## 📁 Project Structure
```
prisma/schema.prisma           — Database models
src/lib/                       — Auth, DB, store, utils, WhatsApp helpers
src/app/api/                   — REST API routes (public + admin)
src/app/page.tsx               — Single-page app entry
src/components/rakhi/          — All UI components
public/images/                 — Generated SVG placeholder images
scripts/                       — Setup scripts (init-admin, generate-images)
```

## 🎨 Customization
- **Colors**: Edit CSS variables in `src/app/globals.css` (`:root` block)
- **Fonts**: Edit `src/app/layout.tsx` (next/font imports)
- **Brand name**: Edit in `src/components/rakhi/Header.tsx`, `Footer.tsx`
- **Default content**: Edit `scripts/init-admin.ts` and re-run

## 📝 License
© House of Neelam. All rights reserved.

---

Made with 🪔 for celebrating the eternal bond of brothers and sisters.
