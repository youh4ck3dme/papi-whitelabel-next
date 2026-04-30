# WhitelabelDesign Next Booking

A clean Next.js 15 starter for a salon booking product.

## What is included

- Public documentation homepage at `/`
- Customer booking flow at `/booking`
- Owner/admin entry at `/admin`
- Admin login shell at `/admin/login`
- Admin calendar at `/admin/calendar`
- Employee schedule at `/admin/my`
- Mock data repository with a Supabase-ready boundary
- White-label brand configuration

## What is intentionally not included

- No Firebase
- No secrets
- No production auth implementation
- No database writes
- No old project scaffolding or legacy calendar code

## Supabase integration point

Replace the mock repository in `src/lib/data/mock-repository.ts` with a Supabase-backed implementation that satisfies `BookingRepository` from `src/lib/data/types.ts`.

## Commands

```bash
npm install
npm run build
npm run dev
```
