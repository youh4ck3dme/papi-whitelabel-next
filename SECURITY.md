# Security Policy

## Secret Handling

- Do not commit secrets to this repository.
- Use `.env.local` for local development only.
- Keep `.env.example` sanitized with placeholder values.
- Rotate any credential immediately if exposed.

## Environment Variable Handling

- Only `NEXT_PUBLIC_*` variables may be exposed to the browser bundle.
- Stripe keys, database URLs, webhook secrets, and integration API keys are server-only.
- Treat accidental client exposure of server secrets as a security incident.

## Stripe Secrets and Webhooks

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only secrets.
- Never expose Stripe secret keys in client-side code.
- Webhook handlers must verify Stripe signatures before processing events.

## Tenant Boundary Expectations

- Tenant identifiers must be validated and enforced on all tenant-scoped reads/writes.
- Cross-tenant data access is a critical security bug.
- Middleware/domain routing logic must not weaken tenant isolation guarantees.

## Rate Limiting and Abuse Controls

- API endpoints are expected to be protected by rate limiting at edge or API gateway level.
- Auth, booking creation, payment, and webhook endpoints should have stricter limits.
- Missing rate limits should be treated as deployment risk, not ignored.

## PII Handling

- Booking/customer contact data is sensitive and should be minimized.
- Avoid logging raw PII in production logs.
- Define retention/deletion policy before production rollout.

## Responsible Disclosure

- Security contact (placeholder): `security@example.com`
- Please include reproduction steps, impact estimate, and affected routes/components.
