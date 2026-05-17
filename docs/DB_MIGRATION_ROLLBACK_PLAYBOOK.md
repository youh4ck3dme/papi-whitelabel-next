# DB Migration Rollback Playbook (P0-024)

This runbook defines a safe rollback protocol for Prisma/PostgreSQL schema changes.

## Scope

- Schema and index migrations applied through Prisma migration workflow.
- Emergency rollback for production incidents caused by DB changes.
- Forward-fix fallback when direct rollback is unsafe.

## Preconditions

- Every schema change PR includes migration SQL diff review.
- Every migration has an owner and rollback owner.
- Backups are available for the target environment.
- Release tag exists for the last known good state.

## Risk Classes

### Low Risk

- Additive indexes.
- Additive nullable columns.
- Non-breaking enum extensions.

### Medium Risk

- Constraint tightening.
- Default value changes on populated tables.
- Dropping unused indexes.

### High Risk

- Dropping columns/tables.
- Type changes requiring data rewrite.
- Unique/exclusion constraints over hot write paths.

## Rollback Decision Tree

1. If migration is additive and incident impact is immediate:
   - Prefer rollback by removing new object (index/constraint) only.
2. If migration changes data shape:
   - Prefer forward-fix migration unless full restore is approved.
3. If tenant isolation or data integrity is at risk:
   - Freeze writes, evaluate restore point, coordinate incident owner.

## Incident Rollback Procedure

1. Freeze deployments and DB migration jobs.
2. Capture:
   - deployment SHA
   - migration name
   - onset timestamp
   - affected endpoints and tenant IDs
3. Validate DB health:
   - lock waits
   - error rates
   - critical query latency
4. Execute rollback strategy:
   - **Path A**: revert migration (safe down SQL or compensating SQL)
   - **Path B**: apply forward-fix migration if down migration is unsafe
5. Run post-rollback verification checks.
6. Re-enable traffic in controlled ramp.

## Command Templates

Use these templates in a DB-connected environment:

```bash
# Check current migration status
npx prisma migrate status

# Generate diff between current schema and target datamodel
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/schema_forward.sql

# Apply compensating SQL manually (reviewed and approved)
psql "$DATABASE_URL" -f /tmp/rollback_or_fix.sql
```

## Verification After Rollback

```bash
npm run verify
npm run test:security
npx playwright test e2e/contracts/api-contract.spec.ts --project=chromium
```

Operational checks:

- `GET /api/health` status is expected.
- booking create + status update endpoints respond correctly.
- payment create + status update endpoints respond correctly.
- webhook signature/idempotency flow still passes.

## Staging Rehearsal Evidence

Required for `P0-024` completion:

- rehearsal date
- migration used for rehearsal
- rollback path taken (A/B)
- execution time and observed errors
- verification result

Template: `docs/DB_MIGRATION_REHEARSAL_TEMPLATE.md`  
Evidence log: `docs/DB_MIGRATION_REHEARSAL_EVIDENCE.md`

Current status: **PENDING_STAGING_REHEARSAL**

## Production Guardrails

- Never run destructive rollback SQL without backup confirmation.
- Never combine app deploy + risky migration in a single unguarded release.
- Keep a rollback SQL artifact attached to the release issue/PR.
