# EXECUTION BACKLOG: Papi Whitelabel Booking SaaS

## Priority Legend
- `P0`: blocking security/reliability work
- `P1`: required for launch quality
- `P2`: scale and commercial optimization

## Backlog Table
| ID | Priority | Area | Task | Definition of Done |
| --- | --- | --- | --- | --- |
| P0-001 | P0 | Security | Add auth middleware for mutating API routes | All mutating endpoints return 401 without auth |
| P0-002 | P0 | Security | Add role guard utility | Routes enforce owner/admin/staff policy |
| P0-003 | P0 | Security | Enforce tenant context server-side | Client `tenantId` ignored or must match server context |
| P0-004 | P0 | Security | Add request schema validation for all API routes | Invalid payloads return 400 with stable error shape |
| P0-005 | P0 | Security | Add rate limit middleware for billing and auth APIs | Throttling behavior verified by integration tests |
| P0-006 | P0 | Security | Remove sensitive error leakage | API errors no longer expose internals |
| P0-007 | P0 | Security | Add webhook replay protection | Duplicate webhook events are idempotent |
| P0-008 | P0 | Security | Add Stripe secret runtime validation | Startup check fails fast with actionable message |
| P0-009 | P0 | Security | Add secret scanning in CI | PR fails on secret pattern matches |
| P0-010 | P0 | Security | Add tenant-bound audit logging | Critical actions include actorId + tenantId + requestId |
| P0-011 | P0 | Reliability | Add config validation module | Required env list enforced in non-dev runtime |
| P0-012 | P0 | Reliability | Fix build reliability without production keys | Build passes with safe placeholders |
| P0-013 | P0 | Reliability | Add retry policy for notification jobs | Transient failures retried with backoff |
| P0-014 | P0 | Reliability | Add dead-letter handling for failed notifications | Failed jobs persisted for replay |
| P0-015 | P0 | Reliability | Add database connection health endpoint | Health route reflects DB reachability |
| P0-016 | P0 | Reliability | Add request timeout guards | Long-running requests fail predictably |
| P0-017 | P0 | Reliability | Add fallback behavior for optional integrations | Optional modules never crash core booking flow |
| P0-018 | P0 | Reliability | Add correlation ID middleware | Request IDs visible in all server logs |
| P0-019 | P0 | Reliability | Harden cron route auth | Cron route rejects unauthenticated requests always |
| P0-020 | P0 | Reliability | Add production-safe logging policy | PII redaction verified in logs |
| P0-021 | P0 | Data | Add booking conflict DB constraints | Conflicting slots cannot be created |
| P0-022 | P0 | Data | Add booking status transition rules | Illegal transitions blocked |
| P0-023 | P0 | Data | Add payment status transition rules | Illegal transitions blocked |
| P0-024 | P0 | Data | Add migration rollback playbook | Rollback steps tested once in staging |
| P0-025 | P0 | Data | Add tenant index review | Query plans acceptable for key endpoints |
| P0-026 | P0 | API | Validate `amount/currency/method` in payment route | Invalid combinations rejected with 400 |
| P0-027 | P0 | API | Validate `plan/email` in subscription route | Invalid plan or email rejected |
| P0-028 | P0 | API | Validate AI route inputs (`tenantId/query/date`) | Invalid payload test coverage exists |
| P0-029 | P0 | API | Normalize API error envelope | All routes return consistent error object |
| P0-030 | P0 | API | Add contract tests for critical routes | Contract tests in CI and green |
| P0-031 | P0 | Dependencies | Upgrade Next.js to security patch line | `next` on approved patched version |
| P0-032 | P0 | Dependencies | Establish audit baseline report | Baseline doc committed and referenced |
| P0-033 | P0 | Dependencies | Reduce high vulnerabilities where patch-safe | High count reduced or documented rationale |
| P0-034 | P0 | Dependencies | Evaluate `next-pwa` transitive risk | Decision documented (keep/replace) |
| P0-035 | P0 | CI/CD | Add required checks workflow | lint + typecheck + build + tests on PR |
| P0-036 | P0 | CI/CD | Add dependency audit workflow | Audit result visible in PR |
| P0-037 | P0 | CI/CD | Add branch protection recommendations | Protected branch rules documented |
| P0-038 | P0 | CI/CD | Add release tagging policy | Semver and release notes template defined |
| P0-039 | P0 | CI/CD | Add rollback checklist | Rollback process documented and rehearsed |
| P0-040 | P0 | Docs | Add SECURITY.md | Security policy complete and reviewed |
| P0-041 | P0 | Docs | Add ARCHITECTURE.md | Boundaries + failure modes documented |
| P0-042 | P0 | Docs | Expand README env + setup + limits | README aligns with code reality |
| P0-043 | P0 | Docs | Add optional integrations policy | Twilio/Zapier/AI/NOWPayments marked optional |
| P0-044 | P0 | Tests | Fix Playwright port mismatch | E2E config aligned with app dev port |
| P0-045 | P0 | Tests | Add tenant spoofing negative tests | Cross-tenant requests fail as expected |
| P0-046 | P0 | Tests | Add unauthorized mutation tests | 401/403 coverage for critical routes |
| P0-047 | P0 | Tests | Add webhook signature negative test | Invalid signature returns 400 |
| P0-048 | P0 | Tests | Add idempotency tests for billing flows | Duplicate submissions safe |
| P0-049 | P0 | Product | Replace mock booking writes for core path | Real persisted booking create flow working |
| P0-050 | P0 | Product | Add cancel/reschedule safeguards | Policy-compliant booking changes enforced |

| P1-001 | P1 | Auth | Implement session management strategy | Session lifecycle documented + tested |
| P1-002 | P1 | Auth | Add password policy or provider policy | Weak credentials rejected |
| P1-003 | P1 | Auth | Add login rate limiting | Brute force mitigation active |
| P1-004 | P1 | Auth | Add account lockout/recovery flows | Recovery flow tested |
| P1-005 | P1 | Auth | Add role admin UI controls | Owner can manage staff roles safely |
| P1-006 | P1 | Product | Build service CRUD UI | Services manageable in admin UI |
| P1-007 | P1 | Product | Build staff CRUD UI | Staff manageable in admin UI |
| P1-008 | P1 | Product | Build availability rules UI | Working hours and breaks configurable |
| P1-009 | P1 | Product | Add booking confirmation page flow | Customer sees deterministic final state |
| P1-010 | P1 | Product | Add no-show workflow | No-show actions tracked and reported |
| P1-011 | P1 | Product | Add timezone correctness checks | Booking times accurate across regions |
| P1-012 | P1 | Product | Add localization baseline | Core UI strings localizable |
| P1-013 | P1 | Billing | Add invoice visibility for tenant admins | Billing events view available |
| P1-014 | P1 | Billing | Add failed payment recovery UX | Retry flow available |
| P1-015 | P1 | Billing | Add downgrade/upgrade guardrails | Plan changes safe and tested |
| P1-016 | P1 | Billing | Add refund workflow policy | Refund process documented and tested |
| P1-017 | P1 | Integrations | Add feature flags per integration | Per-tenant toggle verified |
| P1-018 | P1 | Integrations | Add Twilio optional path tests | No-key path and key path tested |
| P1-019 | P1 | Integrations | Add Zapier optional path tests | No-webhook path and success path tested |
| P1-020 | P1 | Integrations | Add AI assistant guardrails | Prompt/output constraints documented |
| P1-021 | P1 | Observability | Add metrics dashboard | Error/latency/business KPIs visible |
| P1-022 | P1 | Observability | Add alert rules | Critical alerts routed to on-call channel |
| P1-023 | P1 | Observability | Add synthetic checks | Public booking path monitored |
| P1-024 | P1 | Ops | Add backup automation | Scheduled backups verified |
| P1-025 | P1 | Ops | Add restore drill | One successful restore drill logged |
| P1-026 | P1 | Ops | Add incident runbook | Runbook tested in tabletop exercise |
| P1-027 | P1 | Ops | Add support escalation matrix | Owner/support responsibilities clear |
| P1-028 | P1 | Performance | Add API latency budgets | Budgets tracked in CI or monitoring |
| P1-029 | P1 | Performance | Optimize calendar rendering path | Measurable render improvement |
| P1-030 | P1 | Performance | Add caching strategy doc | Cache keys + invalidation defined |
| P1-031 | P1 | Compliance | Add privacy policy draft | PII processing documented |
| P1-032 | P1 | Compliance | Add data retention policy | Retention/deletion windows defined |
| P1-033 | P1 | Compliance | Add DPA draft | Customer data processing terms prepared |
| P1-034 | P1 | Docs | Add API docs starter (OpenAPI) | Critical endpoints documented |
| P1-035 | P1 | Docs | Add deployment guide | Stage/prod setup steps complete |
| P1-036 | P1 | Docs | Add troubleshooting guide | Top failure modes and fixes documented |
| P1-037 | P1 | QA | Add regression suite for booking lifecycle | Lifecycle tests stable |
| P1-038 | P1 | QA | Add mobile UI sanity checks | Booking flow tested on mobile viewports |
| P1-039 | P1 | QA | Add accessibility baseline tests | Key pages pass baseline a11y checks |
| P1-040 | P1 | QA | Add release checklist | No production deploy without checklist |

| P2-001 | P2 | Whitelabel | Build branding management UI | Tenant branding editable in admin |
| P2-002 | P2 | Whitelabel | Add custom domain automation | Domain onboarding playbook complete |
| P2-003 | P2 | Whitelabel | Add tenant template presets | New tenant presets available |
| P2-004 | P2 | Whitelabel | Add white-label email templates | Templates per tenant supported |
| P2-005 | P2 | Whitelabel | Add whitelabel package export | Config snapshot exportable |
| P2-006 | P2 | Sales | Create demo tenant script | One-command demo tenant setup |
| P2-007 | P2 | Sales | Build ROI calculator | Sales-ready calculator available |
| P2-008 | P2 | Sales | Create pricing matrix | Tier features + margins defined |
| P2-009 | P2 | Sales | Add case-study template | Customer success stories repeatable |
| P2-010 | P2 | Sales | Add trial onboarding journey | Trial activation and conversion tracked |
| P2-011 | P2 | Scale | Add queue for notifications/jobs | Async jobs moved out of request path |
| P2-012 | P2 | Scale | Add horizontal scaling playbook | Scale tests and limits documented |
| P2-013 | P2 | Scale | Add DB capacity plan | Capacity assumptions documented |
| P2-014 | P2 | Scale | Add load tests for peak booking | Peak scenario test report available |
| P2-015 | P2 | Scale | Optimize slow query hotspots | Top N slow queries improved |
| P2-016 | P2 | Governance | Add ADR process | Architectural decisions documented |
| P2-017 | P2 | Governance | Add risk register | Top technical/business risks tracked |
| P2-018 | P2 | Governance | Add quarterly security review cadence | Security review calendar set |
| P2-019 | P2 | Governance | Add vendor dependency policy | Integration lifecycle governance defined |
| P2-020 | P2 | Governance | Add change management policy | Controlled rollout protocol documented |

## Suggested Execution Order
1. Complete all `P0-001` to `P0-020`.
2. Parallelize `P0-021` to `P0-050` by area owner.
3. Execute `P1` in 2-week sprints after P0 gates are green.
4. Use `P2` as post-launch hardening and scale roadmap.

## Launch Gate Checklist
- All P0 tasks complete.
- P1 auth/billing/product essentials complete.
- CI green for 2 consecutive release candidates.
- Incident/backup runbooks tested.
