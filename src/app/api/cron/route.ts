import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';
import { requireCronSecret } from '@/lib/security/config';
import { getRequestId } from '@/lib/security/request-context';
import { logAuditEvent } from '@/lib/security/audit-log';

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const cronSecret = requireCronSecret();

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      logAuditEvent({
        action: 'cron.reminder.run',
        outcome: 'DENY',
        requestId,
        actorId: 'system:cron',
        reason: 'invalid_cron_secret',
      });
      return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: 'CONFIRMED',
      },
      include: {
        user: true,
        tenant: true,
        service: true,
      },
    });

    for (const booking of bookings) {
      const message = `🔔 Reminder: Your booking for ${booking.service.name} is tomorrow at ${new Date(booking.startTime).toLocaleTimeString()}!`;
      await sendNotification(
        booking.tenantId,
        booking.user?.phone || '',
        booking.user?.email || '',
        message,
        'both'
      );

      logAuditEvent({
        action: 'cron.reminder.notification',
        outcome: 'SUCCESS',
        requestId,
        actorId: 'system:cron',
        tenantId: booking.tenantId,
        targetType: 'booking',
        targetId: booking.id,
      });
    }

    logAuditEvent({
      action: 'cron.reminder.run',
      outcome: 'SUCCESS',
      requestId,
      actorId: 'system:cron',
      targetType: 'booking_batch',
      targetId: String(bookings.length),
    });

    return NextResponse.json({ processed: bookings.length });
  } catch (error) {
    logAuditEvent({
      action: 'cron.reminder.run',
      outcome: 'ERROR',
      requestId,
      actorId: 'system:cron',
      reason: 'unhandled_exception',
    });
    return unknownErrorResponse(error);
  }
}
