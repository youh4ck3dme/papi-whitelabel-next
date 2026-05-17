# Dependency Audit Baseline

Date: 2026-05-16
Project: `papi-whitelabel-next`

## Snapshot

- Dependencies audited: 686 packages
- Vulnerabilities: `high=8`, `critical=0` (`total=8`)

## Patch Actions Completed

- Upgraded `next` to `^15.5.18`
- Upgraded `eslint-config-next` to `^15.5.18`

This removes known vulnerable ranges tied to earlier Next.js 15.x patch lines.

## Remaining High-Risk Buckets

- `@babel/plugin-transform-modules-systemjs` (transitive)
- `fast-uri` (transitive)
- `langsmith` (transitive)
- `next-pwa` toolchain transitive group (`workbox-*`, `rollup-plugin-terser`, `serialize-javascript`)

## Risk Notes

- Remaining high findings are predominantly transitive and concentrated in the PWA/workbox toolchain.
- No critical vulnerabilities are currently reported.
- CI now publishes audit output on PRs to keep risk visible and track deltas.

## Next Remediation Steps

1. Evaluate replacing `next-pwa` with a maintained SW strategy or updated plugin path.
2. Resolve transitive `workbox`/`rollup-plugin-terser` findings via dependency upgrades when compatible.
3. Re-run baseline after each dependency PR and record before/after counts.
