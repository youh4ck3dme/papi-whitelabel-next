import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDatabaseUrl } from '@/lib/security/config';
import { errorResponse } from '@/lib/security/http';
import { withRequestTimeout } from '@/lib/security/timeout';

export async function GET() {
  try {
    requireDatabaseUrl();
  } catch (error) {
    return errorResponse(503, 'CONFIG_ERROR', error instanceof Error ? error.message : 'Database not configured');
  }

  try {
    await withRequestTimeout(5_000, async () => {
      await prisma.$queryRaw`SELECT 1`;
    });

    return NextResponse.json({
      status: 'ok',
      database: 'up',
    });
  } catch {
    return errorResponse(503, 'INTERNAL_ERROR', 'Database unreachable');
  }
}
