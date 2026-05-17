# DB Index Review (P0-025)

This document tracks index decisions based on current API query shapes.

## Scope

- Booking conflict detection (`POST /api/bookings`)
- Cron reminder window scan (`GET /api/cron`)
- Tenant payment status operations
- Tenant subscription status operations
- Tenant active service lookups

## Added Indexes

### `Service`

- `@@index([tenantId, isActive])`
  - Supports tenant-scoped active service filtering.

### `Booking`

- Existing: `@@index([tenantId, startTime])`
- Added: `@@index([status, startTime])`
  - Supports cron scan by `status + startTime`.
- Added: `@@index([tenantId, serviceId, status, startTime])`
  - Supports conflict detection overlap pre-filter by tenant/service/status/start.
- Added: `@@index([tenantId, serviceId, status, endTime])`
  - Supports conflict detection overlap pre-filter by tenant/service/status/end.

### `Payment`

- Added: `@@index([tenantId, status, createdAt])`
  - Supports tenant-scoped payment status and timeline operations.

### `Subscription`

- Added: `@@index([tenantId, status])`
  - Supports tenant billing state queries and admin overviews.

## Why Not More Indexes

- `id` lookups are already covered by primary keys.
- Over-indexing increases write amplification and storage footprint.
- Full overlap constraints for arbitrary time ranges are not expressible via plain B-tree unique constraints; interval exclusion constraints require advanced DB-specific rollout.

## Rollout Notes

This repo currently does not contain tracked Prisma migrations. Apply index changes using your standard migration process for each environment.

Suggested local check commands:

```bash
npx prisma format
npx prisma validate
```

If your team uses `prisma migrate`, create a migration in a DB-connected environment and commit it before production rollout.
