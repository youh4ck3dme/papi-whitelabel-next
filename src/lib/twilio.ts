import twilio from 'twilio';
import { logSafe } from '@/lib/security/logging';

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

interface SMSContext {
  requestId?: string;
  tenantId?: string;
}

export const sendSMS = async (to: string, message: string, context: SMSContext = {}) => {
  if (!client) {
    logSafe('info', 'Twilio not configured, SMS skipped', {
      to,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
    return null;
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return response.sid;
  } catch (error) {
    const status = typeof (error as { status?: number })?.status === 'number'
      ? (error as { status: number }).status
      : undefined;
    const retryable = status === undefined || status === 429 || status >= 500;

    const typedError = Object.assign(new Error('Twilio send failed'), {
      cause: error,
      retryable,
      status,
      code: (error as { code?: string })?.code,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
    throw typedError;
  }
};
