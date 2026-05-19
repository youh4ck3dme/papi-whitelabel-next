-- Postgres-only guard for active booking overlaps.
-- Apply after validating no existing conflicting rows.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS booking_no_overlap_active;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap_active
  EXCLUDE USING gist (
    "tenantId" WITH =,
    "serviceId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
