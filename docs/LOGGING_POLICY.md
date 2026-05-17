# Logging Policy

## Goals

- Prevent secret and PII leakage in logs.
- Keep audit/security telemetry usable for incident response.
- Ensure optional integration failures are observable without breaking core flows.

## Rules

- Never log raw secrets (`token`, `password`, `secret`, auth headers, cookies).
- Redact PII fields (`email`, `phone`, free-text message payloads).
- Use structured JSON logs for machine parsing.
- Include `requestId`, `tenantId`, and `actorId` for critical security events.

## Implemented Controls

- `src/lib/security/logging.ts`
  - `sanitizeForLog()` redacts secrets and PII.
  - `logSafe()` emits structured redacted logs.
- Audit events in critical routes include:
  - `action`, `outcome`, `requestId`, `tenantId`, `actorId`, optional target fields.

## Optional Integrations

- Twilio/Zapier failures are logged as warnings and treated as non-fatal.
- Core booking/admin operations must continue even when optional integrations fail.

## Known Limitations

- Logs are currently stdout-based; no persistent SIEM sink wired yet.
- Redaction rules are pattern-based and should be extended as payload surface grows.
