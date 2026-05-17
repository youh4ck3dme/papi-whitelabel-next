import { logSafe } from './logging';

export type AuditOutcome = 'SUCCESS' | 'DENY' | 'ERROR';

export interface AuditEvent {
  action: string;
  outcome: AuditOutcome;
  requestId: string;
  tenantId?: string;
  actorId?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
}

export function logAuditEvent(event: AuditEvent) {
  const payload = {
    level: 'audit',
    ts: new Date().toISOString(),
    correlationId: event.requestId,
    ...event,
  };

  logSafe('info', 'audit_event', payload);
}
