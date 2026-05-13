# WhitelabelDesign Next Booking

Multi-tenant booking SaaS built with Next.js, TypeScript and PWA support. This project focuses on tenant-safe booking flows, Stripe billing, admin operations, and deployment-ready engineering practices.

## Business Problem

Small service businesses (such as salons) need one booking surface for customers and one operations surface for staff/admin, with clean tenant boundaries and extensible billing hooks. This repository provides that foundation and documents where production hardening is still required.

## Implemented Features

This repository currently provides:
- Public booking flow at `/booking`
- Admin surfaces at `/admin`, `/admin/login`, `/admin/calendar`, `/admin/my`
- Tenant-aware middleware shell for host/domain routing behavior
- Prisma data model for tenants, users, bookings, payments, subscriptions, and API keys
- Stripe payment/subscription API route scaffolding and webhook handling route
- Optional API paths for AI assistant and crypto payments
- Optional/internal notification integration paths (SMS automation + webhook automation)
- PWA metadata and build-time service worker generation

Important implementation note:
- The current booking UI uses a mock repository boundary (`src/lib/data/mock-repository.ts`).
- The booking page explicitly states this is a prototype flow to be replaced with real Supabase/DB queries for production writes.

## Tech Stack

- Next.js App Router (v15)
- React 19 + TypeScript
- Prisma ORM + PostgreSQL schema
- Stripe server SDK + webhook verification logic
- `next-pwa` for PWA build integration
- Optional integrations in code paths: OpenAI (assistant), NOWPayments (crypto), Twilio/Zapier (notifications/automation)

## Architecture Overview

- Frontend: App Router pages/components (`src/app`, `src/components`)
- API: server route handlers (`src/app/api/*`)
- Data boundary: repository abstraction for booking views + Prisma for payment/subscription/tenant records
- Tenant model: tenant IDs and tenant-scoped Prisma relations
- Billing boundary: Stripe checkout/payment/webhook handlers

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed boundaries and failure modes.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
npm run verify
```

Dev URL:
- `http://localhost:4444`

## Environment Variables

Core local/dev variables are documented in `.env.example` using safe placeholders only.

| Variable | Scope | Required for local boot/build | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client (`NEXT_PUBLIC_*`) | Yes | Supabase project URL for client-side integration boundary |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (`NEXT_PUBLIC_*`) | Yes | Supabase anon key boundary for client use |
| `DATABASE_URL` | Server-only | Yes | Prisma/PostgreSQL connection string |
| `NEXTAUTH_URL` | Server-only | Yes | Base URL used in billing success/cancel redirects |
| `STRIPE_SECRET_KEY` | Server-only | Yes | Stripe API access for payment/subscription routes |
| `STRIPE_WEBHOOK_SECRET` | Server-only | Yes | Webhook signature verification |
| `STRIPE_STARTER_PRICE_ID` | Server-only | Yes | Starter plan price mapping |
| `STRIPE_PRO_PRICE_ID` | Server-only | Yes | Pro plan price mapping |
| `STRIPE_ENTERPRISE_PRICE_ID` | Server-only | Yes | Enterprise plan price mapping |
| `CRON_SECRET` | Server-only | Optional but recommended | Protects cron route when enabled |
| `OPENAI_API_KEY` | Server-only | Optional/internal | AI booking assistant route |
| `NOWPAYMENTS_API_KEY` | Server-only | Optional/internal | Crypto payment route |

Optional/internal (not part of public local setup defaults in `.env.example`):
- Twilio and Zapier envs are intentionally excluded from the default showcase setup and treated as internal integration surface.

## Verification

Run quality checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
```

Current status:
- Lint: configured
- Typecheck: configured
- Build: configured
- Tests: not configured yet as an npm script

## Deployment Notes

- This repository is production-oriented but not fully production-hardened yet.
- Before deployment, replace placeholders in `.env.local`/secret store with real values.
- Ensure database is reachable and Prisma migrations/workflow are aligned with target environment.
- Configure Stripe webhook endpoint with the correct signing secret.
- Add edge/API rate limiting and observability before public production traffic.

## Security Notes

- Never commit real secrets.
- Keep server-only secrets out of client bundles.
- Treat tenant boundary violations as critical severity bugs.
- See [`SECURITY.md`](SECURITY.md) for policy details.

## Troubleshooting

- `Error: Neither apiKey nor config.authenticator provided` during build:
  - Ensure server-side Stripe placeholders/values are set in `.env.local`.
- Prisma/DB connection errors:
  - Verify `DATABASE_URL` points to a reachable PostgreSQL instance.
- Missing optional integration keys:
  - AI/NOWPayments routes may fail if their optional keys are absent; this does not block the core UI boot path.

## Screenshots (Placeholders)

- `docs/screenshots/booking-flow.png` (planned)
- `docs/screenshots/admin-calendar.png` (planned)
- `docs/screenshots/admin-my-schedule.png` (planned)
- `docs/screenshots/tenant-home.png` (planned)

## Known Limitations

- Booking UI currently reads from mock repository data, not production write paths.
- End-to-end test automation for critical business flows is not wired into `npm test`.
- Rate limiting, alerting, and incident response workflows are not fully implemented in this repo.
- Auth/session model is not documented as production-complete yet.

## Roadmap

- Replace mock booking repository with tenant-scoped Supabase/DB data access.
- Add hardened auth and authorization checks for tenant/admin/staff boundaries.
- Add e2e coverage for booking creation, payment confirmation, and webhook reconciliation.
- Add production observability, rate limits, and abuse prevention controls.

## Recruiter / CTO Summary

This repository is a credible foundation for a multi-tenant booking SaaS: it demonstrates clear domain modeling, tenant-aware routing intent, and Stripe billing boundaries with webhook verification flow. It also openly documents what is still planned versus production-hardened, which is essential for trustworthy engineering signaling.
