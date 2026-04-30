import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { sendToZapier } from '@/lib/zapier';

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        tenant: true,
        service: true,
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const message = `📅 Confirmation: Your booking with ${booking.tenant.name} for ${booking.service.name} on ${new Date(booking.startTime).toLocaleDateString()} is confirmed!`;

    // 1. Poslať notifikácie (SMS/Email)
    await sendNotification(
      booking.tenantId,
      booking.user?.phone || '',
      booking.user?.email || '',
      message,
      'both'
    );

    // 2. Pingnúť Zapier
    await sendToZapier('booking.confirmed', {
      bookingId: booking.id,
      tenant: booking.tenant.name,
      service: booking.service.name,
      user: booking.user?.email,
      time: booking.startTime,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
