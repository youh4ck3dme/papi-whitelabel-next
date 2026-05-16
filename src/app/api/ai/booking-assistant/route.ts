import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAIBookingResponse } from '@/lib/ai';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { unknownErrorResponse, errorResponse } from '@/lib/security/http';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { enforceTenantContext } from '@/lib/security/tenant';
import { optionalString, parseJsonBody, requireIsoDate, requireString } from '@/lib/security/validation';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const roleCheck = requireRole(auth.context, ['owner', 'admin', 'staff']);
    if (!roleCheck.ok) return roleCheck.response;

    const rateLimit = enforceRateLimit({
      request,
      bucket: 'ai:booking-assistant',
      identity: `${auth.context.tenantId}:${auth.context.userId}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const tenantIdInput = optionalString(parsedBody.data.tenantId, 'tenantId');
    if (!tenantIdInput.ok) return tenantIdInput.response;

    const tenantCheck = enforceTenantContext(tenantIdInput.data, auth.context);
    if (!tenantCheck.ok) return tenantCheck.response;

    const query = requireString(parsedBody.data.query, 'query', { minLength: 2, maxLength: 1000 });
    if (!query.ok) return query.response;

    const date = requireIsoDate(parsedBody.data.date, 'date');
    if (!date.ok) return date.response;

    const nextDay = new Date(date.data);
    nextDay.setDate(nextDay.getDate() + 1);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantCheck.tenantId },
      include: {
        services: true,
        bookings: {
          where: {
            startTime: {
              gte: date.data,
              lt: nextDay,
            },
          },
        },
      },
    });

    if (!tenant) {
      return errorResponse(404, 'NOT_FOUND', 'Tenant not found');
    }

    const servicesText = tenant.services
      .filter((service) => service.isActive)
      .map((service) => `- ${service.name} (${service.duration} min, $${service.price})`)
      .join('\n');

    const timeSlotsText = '9:00, 10:00, 11:00, 14:00, 15:00';

    const response = await getAIBookingResponse(
      tenant.name,
      servicesText,
      timeSlotsText,
      query.data,
      tenant.language
    );

    return NextResponse.json({ response });
  } catch (error) {
    return unknownErrorResponse(error);
  }
}
