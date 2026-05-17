import { logSafe } from '@/lib/security/logging';
import { retryWithBackoff } from '@/lib/reliability/retry';
import { enqueueDeadLetter } from '@/lib/reliability/dead-letter';

interface ZapierContext {
  requestId?: string;
  tenantId?: string;
}

const ZAPIER_RETRY_ATTEMPTS = 3;

export const sendToZapier = async (event: string, data: unknown, context: ZapierContext = {}) => {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) {
    logSafe('info', 'Zapier webhook not configured, event skipped', {
      event,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
    return null;
  }

  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const typedError = Object.assign(
          new Error(`Zapier webhook failed with status ${response.status}`),
          {
            retryable: response.status === 429 || response.status >= 500,
            status: response.status,
          }
        );
        throw typedError;
      }

      return response.json();
    }, {
      attempts: ZAPIER_RETRY_ATTEMPTS,
      context: {
        channel: 'zapier',
        event,
        requestId: context.requestId,
        tenantId: context.tenantId,
      },
    });
  } catch (error) {
    await enqueueDeadLetter({
      channel: 'zapier',
      requestId: context.requestId,
      tenantId: context.tenantId,
      payload: { event, data },
      error,
      retryCount: ZAPIER_RETRY_ATTEMPTS,
    });

    logSafe('warn', 'Zapier webhook call failed, event skipped', {
      event,
      requestId: context.requestId,
      tenantId: context.tenantId,
      error: String(error),
    });
    return null;
  }
};
