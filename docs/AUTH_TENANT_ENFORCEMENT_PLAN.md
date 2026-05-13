# Auth and Tenant Enforcement Plan (Minimal-Impact)

## Goal

Add authentication and tenant authorization safeguards to existing booking/payment APIs with minimal disruption to current flow, UI routes, and database schema.

## Current Risks (Observed)

- Mutating API routes accept `tenantId` from client payload without verified user context.
- No mandatory auth gate for payment/subscription/notification routes.
- Tenant boundary depends on caller honesty instead of server enforcement.

## Design Principles

- Minimal invasive changes first (guard layer + validation), avoid broad rewrites.
- Preserve existing route contracts where possible.
- Enforce tenant identity server-side, not from request body.
- Add incremental hardening in phases so rollout is reversible.

## Phase 1: Guardrail Foundation (Low-Risk)

1. Add centralized API auth helper
- Implement `requireAuthenticatedUser(request)` in `src/lib/auth`.
- Return normalized identity object: `{ userId, tenantId, role }`.

2. Add centralized authorization helper
- `requireTenantAccess(identity, tenantId)`.
- Reject cross-tenant attempts with `403`.

3. Add request validation helper
- Schema-validate payloads (`tenantId`, `plan`, `amount`, `method`, `bookingId`, `date`).
- Reject malformed requests with `400`.

4. Apply to critical routes first
- `/api/create-payment`
- `/api/create-subscription`
- `/api/send-booking-confirmation`
- `/api/cron` (already token-gated conditionally; make gate mandatory for prod)

## Phase 2: Tenant Source-of-Truth Enforcement

1. Stop trusting tenantId from client body
- Derive tenant from authenticated session/token claims.
- Keep body tenantId only as optional sanity-check (must match server tenant).

2. Normalize metadata writes
- Stripe metadata should use server-derived tenant identity.

3. Harden query filters
- Ensure every Prisma query touching tenant-scoped entities includes tenant scope from identity.

## Phase 3: Role Enforcement (Owner/Admin/Employee)

1. Introduce route-level role policy
- `create-subscription`: owner/admin only
- `create-payment`: owner/admin (or constrained user path, if explicitly intended)
- `send-booking-confirmation`: owner/admin/employee with tenant scope
- `cron`: internal service role only

2. Add explicit forbidden responses
- Return `403` with stable error shape for authorization failures.

## Phase 4: Security Operational Hardening

1. Rate limiting
- Add per-route limits, stricter on payment/auth endpoints.

2. Error handling policy
- Return generic messages to clients.
- Log details server-side with request correlation ID.

3. Audit logging
- Track sensitive actions (payment creation, subscription mutation, confirmation sends).

## Minimal Code Touch Sequence (Recommended)

1. Add `src/lib/auth.ts` and `src/lib/authorize.ts`
2. Add `src/lib/validation.ts`
3. Patch critical API routes to call helpers
4. Add focused tests for authz failure/success paths
5. Roll out role checks route-by-route

## Proposed Test Additions (Targeted)

- 401 when no auth context is present
- 403 when tenant mismatch is attempted
- 403 when role lacks permission
- 200/201 on valid same-tenant authorized requests
- Payment route rejects invalid amount/method/currency

## Rollout Strategy

- Feature-flag strict auth enforcement in non-production first.
- Deploy with logs-only mode for 24-48h if needed.
- Switch to hard-fail once false positives are resolved.

## Known Tradeoffs

- Minimal-impact path may retain temporary dual behavior while clients migrate.
- Some legacy test fixtures may need updates for auth context injection.
- Full RLS/session strategy remains a broader architecture decision outside this narrow patch plan.

## Definition of Done (Auth/Tenant Plan)

- All critical mutating endpoints require auth.
- Tenant identity server-derived and enforced.
- Cross-tenant requests blocked.
- Role checks documented and tested.
- Error model stable and non-leaky.
