import { BookingStatus, PaymentStatus } from '@prisma/client';

const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

export function canTransitionBookingStatus(current: BookingStatus, next: BookingStatus) {
  if (current === next) return true;
  return BOOKING_TRANSITIONS[current].includes(next);
}

export function canTransitionPaymentStatus(current: PaymentStatus, next: PaymentStatus) {
  if (current === next) return true;
  return PAYMENT_TRANSITIONS[current].includes(next);
}
