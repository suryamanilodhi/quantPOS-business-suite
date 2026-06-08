# QuantPOS

QuantPOS is a production-ready MVP SaaS POS and inventory platform for small retail shops. It uses Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, JWT cookie sessions, and role-based access controls.

## Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run seed
npm run dev
```

Open `http://localhost:3000`.

For local PostgreSQL, set `DATABASE_URL` in `.env` like:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/quantpos"
```

Create the database first if it does not exist:

```bash
createdb -U postgres quantpos
```

Demo users after seeding:

- Owner: `owner@quantpos.test` / `password123`
- Manager: `manager@quantpos.test` / `password123`
- Cashier: `cashier@quantpos.test` / `password123`
- Inventory: `inventory@quantpos.test` / `password123`
- Super Admin: `superadmin@quantpos.test` / `password123`

## Deployment

1. Create a Neon PostgreSQL database.
2. Add `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL` in Vercel project settings.
3. Push the Prisma schema during deployment or from your local machine:

```bash
npx prisma db push
```

Run `npm run seed` only if you want the demo shop, demo users, products, vendors, and customers.

## Structure

- `src/app` - App Router pages and API routes
- `src/components` - reusable dashboard, form, table, and POS components
- `src/lib` - Prisma, auth, RBAC, API helpers, money/date utilities
- `prisma/schema.prisma` - complete database schema
- `prisma/seed.ts` - demo shop, roles, users, products, vendors, and customers
