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
    ...event,
  };

  console.log(JSON.stringify(payload));
}
