import { AuthContext } from './auth';
import { errorResponse } from './http';

export function enforceTenantContext(
  clientTenantId: string | undefined,
  authContext: AuthContext
) {
  if (!clientTenantId) {
    return { ok: true as const, tenantId: authContext.tenantId };
  }

  if (clientTenantId !== authContext.tenantId) {
    return {
      ok: false as const,
      response: errorResponse(403, 'FORBIDDEN', 'Tenant context mismatch'),
    };
  }

  return { ok: true as const, tenantId: authContext.tenantId };
}
