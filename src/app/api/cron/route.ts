import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  // Overenie Cron Secretu (ak je nastavený vo Verceli)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
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
  }

  return NextResponse.json({ processed: bookings.length });
}
