# Audit Baseline (Dependencies)

## Scope
- Branch: `chore/deps-hardening-next-audit`
- Change type: patch-only dependency hardening
- Updated packages (lockfile-resolved): `next@15.5.18`, `eslint-config-next@15.5.18`

## Before
- total: 8, high: 8, moderate: 0, low: 0, critical: 0

## After
- total: 8, high: 8, moderate: 0, low: 0, critical: 0

## High vulnerabilities (before)
- @babel/plugin-transform-modules-systemjs
- fast-uri
- next
- next-pwa
- rollup-plugin-terser
- serialize-javascript
- workbox-build
- workbox-webpack-plugin

## High vulnerabilities (after)
- @babel/plugin-transform-modules-systemjs
- fast-uri
- next
- next-pwa
- rollup-plugin-terser
- serialize-javascript
- workbox-build
- workbox-webpack-plugin

## Notes
- Next.js advisories were reduced by patch upgrade, but high findings remain in transitive PWA/workbox chain and related packages.
- Further reduction likely requires `next-pwa` strategy change or dependency tree modernization.
