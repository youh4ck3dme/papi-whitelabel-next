# DB Migration Rehearsal Template

Use this template for each staging rollback rehearsal.

## Rehearsal Metadata

- rehearsal_id:
- date_utc:
- environment: staging
- migration_name:
- migration_commit_sha:
- rollback_owner:
- observer:

## Scenario

- change_type: (`index_add` | `constraint_change` | `column_change` | `other`)
- risk_class: (`low` | `medium` | `high`)
- trigger_condition:

## Execution Path

- chosen_path: (`A_revert` | `B_forward_fix`)
- reason_for_path:
- commands_executed:
  - `npx prisma migrate status`
  - ...
- sql_artifacts:
  - `/tmp/rollback_or_fix.sql` (or stored path)

## Runtime Observations

- migration_apply_time_ms:
- rollback_or_fix_time_ms:
- lock_waits_observed: (`none` | `low` | `high`)
- errors_observed:
  - none / list

## Verification

- `npm run verify`: (`pass` | `fail`)
- `npm run test:security`: (`pass` | `fail`)
- `npx playwright test e2e/contracts/api-contract.spec.ts --project=chromium`: (`pass` | `fail`)
- `GET /api/health`: (`expected` | `unexpected`)
- booking/payment/webhook smoke: (`pass` | `fail`)

## Outcome

- result: (`PASS` | `FAIL`)
- rollback_readiness: (`ready` | `blocked`)
- blockers:
  - none / list
- follow_up_actions:
  - none / list
