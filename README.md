# PAPI Whitelabel Next

Multi-tenant booking SaaS built with Next.js and TypeScript, focused on tenant-safe booking flows, Stripe billing, and operations-ready API hardening.

## What is implemented

- Public landing page and booking UI shells (`/`, `/booking`, `/admin/*`)
- Protected mutating API routes with:
  - auth guard (Bearer token)
  - role guard (`owner/admin/staff`)
  - tenant context enforcement
  - payload validation with stable error envelope
  - request rate limiting
- Stripe subscription and payment API integration points
- Stripe webhook signature verification + replay protection
- Cron endpoint with mandatory bearer secret
- Playwright security tests for core API controls

## What is not production-hardened yet

- Real auth/session provider integration (currently expects a trusted auth token bridge)
- Database-backed/global rate limiting (current limiter is in-memory per instance)
- Fully persisted audit logging and SIEM integration
- Full booking write lifecycle in UI (frontend is still mostly shell/mock oriented)

## Tech stack

- Next.js 15
- TypeScript (strict)
- Prisma + PostgreSQL
- Stripe
- Playwright

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs on: `http://localhost:4444`

## Environment variables

Core required (server-side):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ENTERPRISE_PRICE_ID`

Client-side:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional/internal:

- `OPENAI_API_KEY`
- `NOWPAYMENTS_API_KEY`
- `TWILIO_*`
- `ZAPIER_WEBHOOK_URL`

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
npm run test:security
```

## Operational policies

- Branch protection baseline: `docs/BRANCH_PROTECTION.md`
- Release tagging process: `docs/RELEASE_TAGGING_POLICY.md`
- Incident rollback steps: `docs/ROLLBACK_CHECKLIST.md`
- DB migration rollback playbook: `docs/DB_MIGRATION_ROLLBACK_PLAYBOOK.md`

## Security notes

- Never commit real secrets.
- Stripe keys and webhook secret are server-only.
- API routes return a normalized error object: `error.code`, `error.message`, optional `error.details`.
- Cross-tenant spoofing attempts are rejected.

## Recruiter / CTO summary

This repository demonstrates practical backend security hardening on a booking SaaS surface (auth guards, role/tenant enforcement, validation, throttling, webhook replay defense) with reproducible CI checks. Frontend/product polish is intentionally secondary to engineering controls in the current phase.
