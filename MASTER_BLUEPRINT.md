# MASTER BLUEPRINT: Papi Whitelabel Booking SaaS

## 1. Mission
Build a secure, multi-tenant, production-grade booking SaaS that is sellable as a white-label platform for salons and service businesses.

## 2. Non-Negotiables
- Tenant isolation must be enforced server-side.
- No secrets in repository.
- Critical APIs require auth + authorization.
- Billing and webhook flows must be idempotent and auditable.
- Deployment must be repeatable.

## 3. Product Scope (Sellable Core)
- Public booking flow.
- Staff and admin calendar.
- Service and staff management.
- Booking lifecycle states.
- Stripe subscriptions and payments.
- Reminder notifications.
- Tenant branding and domain mapping.

## 4. Explicitly Optional Modules
- AI booking assistant.
- Zapier automations.
- Twilio SMS.
- Crypto payments.

## 5. Architecture Baseline
- Frontend: Next.js App Router.
- API: Next route handlers.
- DB: PostgreSQL + Prisma.
- Payments: Stripe + webhook reconcile route.
- Tenant model: tenant-bound entities (`tenantId`) for all business records.

## 6. Security Blueprint
- Auth everywhere on mutating routes.
- Role-based authorization (owner/admin/staff/user).
- Request schema validation.
- Rate limiting on sensitive endpoints.
- Webhook signature validation.
- Structured audit logs with tenant and actor IDs.
- Secrets managed only in env/secret manager.

## 7. Data and Domain Blueprint
- Strict domain entities: Tenant, User, Service, Booking, Payment, Subscription.
- Booking conflict prevention at DB and service layer.
- Payment and booking status transition rules.
- Soft-delete and archival policy.

## 8. Tenant Isolation Blueprint
- Never trust tenantId from client payload.
- Derive tenant from authenticated context.
- Validate cross-tenant access on every sensitive query.
- Add automated tests for tenant boundary violations.

## 9. Billing Blueprint
- Plan mapping to Stripe price IDs.
- Idempotency keys for payment/session creation.
- Webhook event replay safety.
- Reconciliation job for failed or delayed webhooks.

## 10. Notification Blueprint
- Email baseline.
- SMS optional module.
- Retry policy and dead-letter handling.
- Notification observability.

## 11. API Quality Blueprint
- Unified error format.
- Request correlation IDs.
- Validation-first request parsing.
- Never leak internals in client-facing error messages.

## 12. DevEx Blueprint
- Scripts: `lint`, `typecheck`, `build`, `verify`, `test`.
- Consistent env onboarding with `.env.example`.
- No generated artifacts committed.

## 13. Test Blueprint
- Unit tests for domain rules and validators.
- Integration tests for Prisma and Stripe flows.
- E2E tests for booking + payment + role checks.
- Security regression tests for tenant spoofing.

## 14. CI/CD Blueprint
- PR checks required: lint, typecheck, test, build.
- Security checks: dependency audit + secret scan.
- Release via protected branches.
- Rollback procedure documented.

## 15. Observability Blueprint
- Logs: structured JSON.
- Metrics: request latency, error rate, booking conversions, webhook failures.
- Alerts: critical API error spikes, payment failures, cron failures.

## 16. Operations Blueprint
- Incident response runbook.
- Backup and restore runbook.
- SLA/SLO tracking.
- Monthly DR drill.

## 17. Whitelabel Commercial Blueprint
- Tenant provisioning flow under 30 minutes.
- Branding controls: logo, colors, typography, metadata.
- Domain mapping checklist.
- Per-tenant feature flags.

## 18. Sales-Readiness Blueprint
- Live demo tenant.
- Sandbox tenant.
- Sales deck and ROI narrative.
- Pricing and package matrix.
- Legal docs: TOS, Privacy, DPA.

## 19. Go-Live Gate
All below must be green before first production client:
- P0 security items complete.
- Critical E2E flow pass rate >= 95%.
- Billing flow pass in staging.
- Tenant enforcement tests passing.
- Monitoring and alerting active.
- Runbooks approved.

## 20. KPIs
- Trial-to-paid conversion.
- Booking conversion rate.
- No-show reduction.
- Payment success rate.
- Mean time to recovery.
- Churn.

## 21. 30/60/90 Day Delivery
### Day 1-30
- Security core, authz, validation, build reliability, CI baseline.
### Day 31-60
- Real booking write flow, billing hardening, E2E expansion.
### Day 61-90
- Tenant provisioning automation, SLO maturity, sales packaging.

## 22. Done Definition
Project is “sellable production candidate” when:
- Security controls are enforced, not documented-only.
- Booking and billing workflows are stable under test.
- New tenant onboarding is repeatable.
- Team can detect and recover from incidents quickly.
