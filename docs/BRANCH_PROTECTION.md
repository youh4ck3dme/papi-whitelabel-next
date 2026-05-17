# Branch Protection Recommendations

This repository should treat `main` as a protected release branch.

## Required Branch Rules for `main`

- Require pull request before merging.
- Require at least 1 approving review.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merge.
- Require status checks to pass before merging.
- Do not allow force pushes.
- Do not allow branch deletion.

## Required Status Checks

- `CI / checks`
- `CI / security-contract-tests`
- `Dependency Audit / audit`
- `Secret Scan / scan`

## Admin Exceptions

- Avoid bypassing rules except for incident recovery.
- If bypass is used, open a follow-up issue with incident context and remediation.

## Merge Strategy

- Prefer squash merge for feature branches.
- Keep commit title aligned with conventional format: `feat:`, `fix:`, `docs:`, `chore:`.
