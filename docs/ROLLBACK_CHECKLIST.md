# Rollback Checklist

Use this checklist when a production deployment causes regressions.

## Trigger Conditions

- Elevated 5xx rates on booking or billing endpoints.
- Security contract break (`401/403/400/429/503` behavior drift).
- Stripe webhook processing failures.
- Tenant data isolation concerns.

## Immediate Actions (0-10 minutes)

1. Freeze new deploys to `main`.
2. Announce incident in team channel.
3. Capture failing route, request IDs, and deploy SHA.
4. Decide rollback target (last known good tag).

## Rollback Steps

1. Checkout release branch from target tag.
2. Redeploy previous stable artifact.
3. Verify service health route and core flows.
4. Re-run security contract smoke tests.

## Verification Commands

```bash
npm run verify
npm run test:security
npx playwright test e2e/contracts/api-contract.spec.ts --project=chromium
```

## Post-Rollback Validation

- `GET /api/health` returns expected status.
- Booking creation flow works.
- Subscription checkout path responds correctly.
- Stripe webhook signature verification works.
- Audit logs include `requestId` and tenant context.

## Incident Follow-up (within 24h)

1. Open root-cause issue linked to rollback commit/tag.
2. Add prevention actions (test, guardrail, or lint rule).
3. Schedule controlled re-release with explicit checklist sign-off.
