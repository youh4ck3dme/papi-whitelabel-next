import twilio from 'twilio';

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const sendSMS = async (to: string, message: string) => {
  if (!client) {
    console.warn('Twilio not configured, skipping SMS');
    return null;
  }
  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    return response.sid;
  } catch (error) {
    console.error('Twilio Error:', error);
    throw new Error('Failed to send SMS');
  }
};
