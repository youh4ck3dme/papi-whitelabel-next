import { sendSMS } from './twilio';
import { logSafe } from '@/lib/security/logging';
import { enqueueDeadLetter } from '@/lib/reliability/dead-letter';
import { retryWithBackoff } from '@/lib/reliability/retry';

type NotificationType = 'sms' | 'email' | 'both';
interface NotificationContext {
  requestId?: string;
}

const NOTIFICATION_RETRY_ATTEMPTS = 3;

export const sendEmail = async (to: string, subject: string, body: string) => {
  // Stub for future provider integration.
  logSafe('info', 'Email send simulated', { to, subject, body });
  return true;
};

async function runReliableNotificationTask<T>(
  operation: () => Promise<T>,
  context: {
    channel: 'sms' | 'email';
    tenantId: string;
    requestId?: string;
    payload: unknown;
  }
) {
  try {
    return await retryWithBackoff(operation, {
      attempts: NOTIFICATION_RETRY_ATTEMPTS,
      context: {
        channel: context.channel,
        tenantId: context.tenantId,
        requestId: context.requestId,
      },
    });
  } catch (error) {
    await enqueueDeadLetter({
      channel: context.channel,
      requestId: context.requestId,
      tenantId: context.tenantId,
      payload: context.payload,
      error,
      retryCount: NOTIFICATION_RETRY_ATTEMPTS,
    });

    logSafe('warn', 'Notification channel failed after retries', {
      channel: context.channel,
      tenantId: context.tenantId,
      requestId: context.requestId,
      error: String(error),
    });
    return null;
  }
}

export const sendNotification = async (
  tenantId: string,
  userPhone: string,
  userEmail: string,
  message: string,
  type: NotificationType = 'both',
  context: NotificationContext = {}
) => {
  const results: Promise<unknown>[] = [];

  if ((type === 'sms' || type === 'both') && userPhone) {
    results.push(
      runReliableNotificationTask(
        () => sendSMS(userPhone, message, { requestId: context.requestId, tenantId }),
        {
        channel: 'sms',
        tenantId,
        requestId: context.requestId,
        payload: { tenantId, userPhone, message },
      })
    );
  }

  if ((type === 'email' || type === 'both') && userEmail) {
    results.push(
      runReliableNotificationTask(() => sendEmail(userEmail, 'Booking Notification', message), {
        channel: 'email',
        tenantId,
        requestId: context.requestId,
        payload: { tenantId, userEmail, message },
      })
    );
  }

  await Promise.all(results);
};
