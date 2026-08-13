# Easer Financial Planner

Personal finance planning web app: income, expenses, savings goals, health score, and optional Premium via Paystack.

> Planning guidance only — **not** regulated financial advice.

## Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma
- bcrypt sessions (HttpOnly cookies)
- Paystack payments (server-side amount + webhook HMAC)
- Resend (optional email)
- Tailwind CSS
- Vitest for finance engine tests

## Quick start

```bash
cp .env.example .env
# fill DATABASE_URL and keys
npm install
npx prisma migrate dev --name init
npx prisma db seed   # optional demo user
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run dev` — development
- `npm run build` / `npm start` — production
- `npm test` — finance unit tests
- `npx prisma migrate deploy` — production migrations

## Paystack

1. Set `PAYSTACK_SECRET_KEY` (server only) and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
2. Set `PAYSTACK_PREMIUM_AMOUNT_KOBO` (default 250000 = ₦2,500)
3. Webhook URL: `https://YOUR_DOMAIN/api/payments/webhook`
4. Never grant Premium from client-only success callbacks

## Admin

Promote a user in the database:

```sql
UPDATE "User" SET plan = 'ADMIN' WHERE email = 'you@example.com';
```

Then visit `/admin`.

## Security notes

See [SECURITY.md](./SECURITY.md).

Critical production items:

- Use live Paystack keys only in production env
- Replace in-memory rate limiter with Redis for multi-instance
- Legal review of Privacy / Terms / Disclaimer drafts
- Database backups and monitoring

## License

Proprietary — all rights reserved unless otherwise stated by the operator.
