# Class Pay — Private Class Student Payment Platform

A secure web platform where private-class students register, select classes/subjects by Month/Year, generate invoices, and pay the exact amount using a **Dynamic QR code**. Includes an admin portal for student, class, subject, fee, payment, and report management.

## Tech Stack

- **Frontend/Backend:** Next.js 16 (App Router, TypeScript) + Tailwind CSS
- **Database:** PostgreSQL via Prisma (Supabase-compatible)
- **Auth:** Signed httpOnly session cookies (JWT via `jose`) + bcrypt password hashing
- **Payments:** Provider abstraction — `MockProvider` (dev) and `LankaQrProvider` stub
- **QR:** `qrcode` · **PDF:** `pdf-lib` · **Excel:** `exceljs` · **Email:** `nodemailer`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Database

Either point `DATABASE_URL` in `.env` at Supabase, or run a local Postgres:

```bash
docker compose up -d
```

### 3. Run migrations & seed

```bash
npx prisma migrate dev
npm run db:seed
```

The seed creates:

- **Admin login:** `admin@example.com` / `Admin@123`
- Streams, subjects (Bio Science, Chemistry, Physics, Mathematics), sessions (Day/Evening/Special), and three active class periods with fees.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start dev server                     |
| `npm run build`       | Production build                     |
| `npm run lint`        | ESLint                               |
| `npm run typecheck`   | TypeScript check                     |
| `npm run db:migrate`  | Create/apply Prisma migrations       |
| `npm run db:seed`     | Seed the database                    |
| `npm run db:studio`   | Open Prisma Studio                   |

## Environment Variables

See `.env.example`. Key variables:

- `DATABASE_URL` — Supabase/Postgres connection string
- `SESSION_SECRET` — secret for signing session cookies
- `PAYMENT_PROVIDER` — `mock` (default) or `lankaqr`
- `QR_EXPIRY_MINUTES` — dynamic QR expiry (default 10)
- `SMTP_*` / `EMAIL_FROM` — email delivery (emails are logged to console when unset)

## Payment Flow

1. Student registers / logs in.
2. Selects Month/Year, session, and subjects.
3. System computes the total **server-side** and generates an invoice.
4. `PAY NOW` creates a payment and a **dynamic QR** for the exact amount.
5. Payment provider confirms via **webhook** (signature-verified, idempotent).
6. System reconciles `invoice == payment == provider amount`, marks invoice PAID, and generates a receipt.

**Security:** amounts are always read from the database, never trusted from the client; a QR alone never marks an invoice paid; provider callbacks are signature-verified and idempotent; duplicate payments are blocked.

## LankaQR Integration

The LankaQR adapter is a stub (`src/providers/payment/lankaqr.ts`). Implement `createPayment` and `verifyWebhook` against the selected bank's API spec and set `PAYMENT_PROVIDER=lankaqr`. The mock provider exercises the full signature + reconciliation flow in development.
