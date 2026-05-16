import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { sendToZapier } from '@/lib/zapier';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody, requireString } from '@/lib/security/validation';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const roleCheck = requireRole(auth.context, ['owner', 'admin', 'staff']);
    if (!roleCheck.ok) return roleCheck.response;

    const rateLimit = enforceRateLimit({
      request,
      bucket: 'ops:send-booking-confirmation',
      identity: `${auth.context.tenantId}:${auth.context.userId}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const bookingId = requireString(parsedBody.data.bookingId, 'bookingId');
    if (!bookingId.ok) return bookingId.response;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId.data },
      include: {
        user: true,
        tenant: true,
        service: true,
      },
    });

    if (!booking) {
      return errorResponse(404, 'NOT_FOUND', 'Booking not found');
    }

    if (booking.tenantId !== auth.context.tenantId) {
      return errorResponse(403, 'FORBIDDEN', 'Booking tenant does not match authenticated tenant');
    }

    const message = `📅 Confirmation: Your booking with ${booking.tenant.name} for ${booking.service.name} on ${new Date(booking.startTime).toLocaleDateString()} is confirmed!`;

    await sendNotification(
      booking.tenantId,
      booking.user?.phone || '',
      booking.user?.email || '',
      message,
      'both'
    );

    await sendToZapier('booking.confirmed', {
      bookingId: booking.id,
      tenant: booking.tenant.name,
      service: booking.service.name,
      user: booking.user?.email,
      time: booking.startTime,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return unknownErrorResponse(error);
  }
}
