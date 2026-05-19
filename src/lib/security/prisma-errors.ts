export function isBookingOverlapConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const record = error as { code?: unknown; message?: unknown; meta?: unknown };
  const message = typeof record.message === 'string' ? record.message : '';

  if (message.includes('booking_no_overlap_active')) {
    return true;
  }

  if (record.code !== 'P2004') {
    return false;
  }

  const meta = record.meta;
  if (!meta || typeof meta !== 'object') {
    return false;
  }

  const dbError =
    typeof (meta as { database_error?: unknown }).database_error === 'string'
      ? ((meta as { database_error: string }).database_error ?? '')
      : '';

  return dbError.includes('booking_no_overlap_active');
}
