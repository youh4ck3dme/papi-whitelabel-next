# Architecture Overview

## System Overview

This project is a multi-tenant booking SaaS shell built with Next.js App Router and TypeScript. It includes booking/admin UI surfaces, tenant-aware middleware behavior, Stripe billing routes, and a Prisma-based domain model.

## Boundaries

- Frontend (App Router UI): `src/app/*`
- API routes (server handlers): `src/app/api/*`
- Database boundary: Prisma client + `prisma/schema.prisma`
- Billing boundary: Stripe server SDK + webhook route
- Optional integrations: AI assistant and crypto payments are route-level optional paths

## Tenant Isolation Model

- Tenant data is modeled explicitly via `tenantId` relations in Prisma models.
- Middleware sets tenant context hints via cookies for host/domain flows.
- Tenant isolation is expected at query layer and service/business logic layer.

## Payment Lifecycle (High-Level)

1. Client initiates payment/subscription request.
2. API route creates Stripe checkout/payment intent.
3. Stripe webhook confirms lifecycle events.
4. Server updates subscription/payment/booking status in database.

## Failure Modes

| Failure mode | Impact | Current behavior | Hardening direction |
| --- | --- | --- | --- |
| Missing Stripe env | Billing routes fail | Runtime error path | Startup validation + health checks |
| Webhook signature mismatch | Invalid event processing risk | Rejects invalid signature | Add explicit alerting/monitoring |
| DB unavailable | Booking/payment APIs fail | Request failure | Retries, circuit breaking, incident runbook |
| Tenant boundary bug | Cross-tenant data leak risk | Depends on query discipline | Add tenant-scope guards + tests |
| Optional integration keys missing | Feature path unavailable | Route/utility skips or fails per path | Document clearly as optional/internal |

## Known Tradeoffs

- Some integration paths are present but not yet production-hardened.
- Automated tests are not yet wired as a standard `npm test` pipeline.
- Rate limiting and full observability are assumed deployment concerns and should be enforced before production use.
