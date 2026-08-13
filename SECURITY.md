# Security — Easer Financial Planner

## Architecture

- Next.js App Router with server-side session authentication
- Session token stored in HttpOnly cookie (`easer_session`), hashed (SHA-256) at rest
- Passwords hashed with bcrypt (cost 12)
- Password reset tokens stored hashed; single-use; 1-hour expiry; all sessions invalidated on reset
- Paystack secret key server-only; public key may use `NEXT_PUBLIC_`
- Premium granted only after server-side amount/currency/ownership verification + webhook signature check
- PaymentEvent table for idempotency of payment references

## Secrets

Never commit `.env`. Required private variables:

- `DATABASE_URL`
- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY` (optional in dev)
- `PAYSTACK_PREMIUM_AMOUNT_KOBO` (optional override)

Public:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

## Authentication

- Registration / login rate-limited (in-memory; replace for multi-instance)
- Strong password policy on register and reset
- Session rotation limits concurrent sessions
- Soft-deleted users cannot authenticate

## Authorization

- Every user-data query filters by `userId` from the session, never from client body alone
- Admin endpoints require `plan === ADMIN` set only via database
- Free users cannot self-escalate plan without a verified payment event

## Payments

1. Client calls `/api/payments/initialize` — **server sets amount**
2. Paystack redirects to callback
3. Client calls `/api/payments/verify` — server re-verifies with Paystack API, checks amount, currency, metadata.userId, records PaymentEvent
4. Webhook `/api/payments/webhook` verifies `x-paystack-signature` with timing-safe compare, same amount checks, idempotent

Never trust frontend “payment success” alone.

## Rate limiting

In-memory limiter is **not** safe across multiple serverless instances. For production, swap `rateLimit` in `lib/security.ts` for Redis/Upstash.

## Reporting

Report vulnerabilities to the security contact configured by the operator (set before launch).

## Deployment requirements

- HTTPS only
- Production env vars (no test Paystack keys for real money)
- Webhook URL registered in Paystack dashboard
- Database backups and migration process
- Monitoring / error tracking without logging full financial payloads
