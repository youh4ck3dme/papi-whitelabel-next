import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { errorResponse } from './http';

export type AppRole = 'owner' | 'admin' | 'staff';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: AppRole;
}

const APP_ROLES: AppRole[] = ['owner', 'admin', 'staff'];

function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

function mapPrismaRole(role: Role): AppRole {
  if (role === 'SUPER_ADMIN') return 'owner';
  if (role === 'ADMIN') return 'admin';
  return 'staff';
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

function parseDevToken(token: string): AuthContext | null {
  // Dev fallback token format: dev:<tenantId>:<role>[:<userId>]
  // This is intentionally disabled in production.
  const [prefix, tenantId, role, userId = 'dev-user'] = token.split(':');
  if (prefix !== 'dev') return null;
  if (!tenantId || !role || !isAppRole(role)) return null;

  return {
    userId,
    tenantId,
    role,
  };
}

async function parseUserToken(token: string): Promise<AuthContext | null> {
  // Token format expected from upstream auth bridge: user:<userId>
  const [prefix, userId] = token.split(':');
  if (prefix !== 'user' || !userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      role: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: mapPrismaRole(user.role),
  };
}

export async function requireAuth(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false as const,
      response: errorResponse(401, 'UNAUTHORIZED', 'Authentication required'),
    };
  }

  const userContext = await parseUserToken(token);
  if (userContext) {
    return { ok: true as const, context: userContext };
  }

  if (process.env.NODE_ENV !== 'production') {
    const devContext = parseDevToken(token);
    if (devContext) {
      return { ok: true as const, context: devContext };
    }
  }

  return {
    ok: false as const,
    response: errorResponse(401, 'UNAUTHORIZED', 'Invalid auth token'),
  };
}

export function requireRole(context: AuthContext, allowedRoles: AppRole[]) {
  if (!allowedRoles.includes(context.role)) {
    return {
      ok: false as const,
      response: errorResponse(403, 'FORBIDDEN', 'Insufficient role permissions', {
        required: allowedRoles,
        actual: context.role,
      }),
    };
  }

  return { ok: true as const };
}
