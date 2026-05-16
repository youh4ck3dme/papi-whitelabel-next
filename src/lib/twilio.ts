import twilio from 'twilio';
import { logSafe } from '@/lib/security/logging';

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const sendSMS = async (to: string, message: string) => {
  if (!client) {
    logSafe('info', 'Twilio not configured, SMS skipped', { to });
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
    // Optional integration: never crash caller flow.
    logSafe('warn', 'Twilio send failed, SMS skipped', { to, error: String(error) });
    return null;
  }
};
