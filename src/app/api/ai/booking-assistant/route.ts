import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAIBookingResponse } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { tenantId, query, date } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        services: true,
        bookings: {
          where: {
            startTime: {
              gte: new Date(date),
              lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
            },
          },
        },
      },
    });

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const servicesText = tenant.services
      .filter(s => s.isActive)
      .map(s => `- ${s.name} (${s.duration} min, $${s.price})`)
      .join('\n');

    const timeSlotsText = "9:00, 10:00, 11:00, 14:00, 15:00"; // Zjednodušené pre demo

    const response = await getAIBookingResponse(
      tenant.name,
      servicesText,
      timeSlotsText,
      query,
      tenant.language
    );

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
