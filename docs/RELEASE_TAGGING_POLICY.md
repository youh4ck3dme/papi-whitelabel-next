# Release Tagging Policy

This project uses semantic versioning tags for release traceability.

## Version Format

- `vMAJOR.MINOR.PATCH` (example: `v1.4.2`)

## Tagging Rules

- `MAJOR`: breaking API or schema changes.
- `MINOR`: backward-compatible features.
- `PATCH`: backward-compatible fixes and hardening updates.

## Release Gate

Before creating a release tag:

- `npm run verify` passes.
- `npm run test:security` passes.
- `npx playwright test e2e/contracts/api-contract.spec.ts --project=chromium` passes.
- CI workflows on `main` are green.
- No unresolved security blockers in open PR comments.

## Tag Creation Workflow

1. Merge approved PR into `main`.
2. Pull latest `main`.
3. Create annotated tag.
4. Push tag to origin.
5. Publish release notes summary.

```bash
git checkout main
git pull origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

## Release Notes Minimum

- Scope of changes.
- Security-relevant changes.
- Database or env variable impact.
- Rollback instructions reference.

For database-impacting releases, link:

- `docs/DB_INDEX_REVIEW.md`
- `docs/DB_MIGRATION_ROLLBACK_PLAYBOOK.md`
- `docs/DB_MIGRATION_REHEARSAL_EVIDENCE.md`
