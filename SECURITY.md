# Security Policy

## Scope
This project is a multi-tenant booking SaaS backend/frontend surface with Stripe billing and optional integrations.

## Core Security Rules
- Never commit secrets to git.
- Keep server-only secrets out of client bundles.
- Validate all mutating API payloads.
- Enforce auth, role checks, and tenant boundaries on server side.

## Environment and Secret Handling
- Public/client variables must use `NEXT_PUBLIC_*` prefix.
- Server-only secrets include at minimum:
  - `DATABASE_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `CRON_SECRET`
- Optional integrations (Twilio/Zapier/AI/NOWPayments) must be treated as non-core and fail safely when unset.

## Stripe and Webhooks
- Webhook routes must verify signature using `STRIPE_WEBHOOK_SECRET`.
- Duplicate webhook events must be handled idempotently.
- Never trust client-submitted payment state without server verification.

## Tenant Isolation Expectations
- Tenant context is resolved server-side.
- Client-supplied `tenantId` must be validated against authenticated tenant context.
- Cross-tenant reads/writes are denied.

## Rate Limiting and Abuse Controls
- Billing/auth-sensitive endpoints use rate limiting.
- Repeated abuse returns stable `429` responses without leaking internals.

## Logging and PII
- Avoid logging raw secrets, tokens, or payment details.
- Keep logs structured and include request correlation IDs.
- Redact PII where not required for security/audit trails.

## Responsible Disclosure
If you discover a vulnerability, report it privately to:
- `security@your-domain.example` (placeholder)

Do not open a public issue containing exploit details or sensitive data.
