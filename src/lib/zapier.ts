import { logSafe } from '@/lib/security/logging';

export const sendToZapier = async (event: string, data: unknown) => {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) {
    logSafe('info', 'Zapier webhook not configured, event skipped', { event });
    return null;
  }

  try {
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
      logSafe('warn', 'Zapier webhook failed with non-OK status', {
        event,
        status: response.status,
      });
      return null;
    }

    return response.json();
  } catch (error) {
    // Optional integration: do not break the main booking flow.
    logSafe('warn', 'Zapier webhook call failed, event skipped', {
      event,
      error: String(error),
    });
    return null;
  }
};
