import { sendSMS } from './twilio';
import { logSafe } from '@/lib/security/logging';

type NotificationType = 'sms' | 'email' | 'both';

export const sendEmail = async (to: string, subject: string, body: string) => {
  // Stub for future provider integration.
  logSafe('info', 'Email send simulated', { to, subject, body });
  return true;
};

export const sendNotification = async (
  tenantId: string,
  userPhone: string,
  userEmail: string,
  message: string,
  type: NotificationType = 'both'
) => {
  const results: Promise<unknown>[] = [];

  if ((type === 'sms' || type === 'both') && userPhone) {
    results.push(sendSMS(userPhone, message));
  }

  if ((type === 'email' || type === 'both') && userEmail) {
    results.push(
      sendEmail(userEmail, 'Booking Notification', message).catch((error) => {
        logSafe('warn', 'Email send failed, notification skipped', {
          tenantId,
          userEmail,
          error: String(error),
        });
        return null;
      })
    );
  }

  await Promise.all(results);
};
