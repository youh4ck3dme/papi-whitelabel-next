import { sendSMS } from './twilio';

type NotificationType = 'sms' | 'email' | 'both';

// Stub pre email service (napr. Resend alebo SendGrid)
export const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`Email sent to ${to}: [${subject}] ${body}`);
  return true;
};

export const sendNotification = async (
  tenantId: string,
  userPhone: string,
  userEmail: string,
  message: string,
  type: NotificationType = 'both'
) => {
  const results = [];

  if (type === 'sms' || type === 'both') {
    if (userPhone) {
      results.push(sendSMS(userPhone, message).catch(e => console.error('SMS Failed', e)));
    }
  }

  if (type === 'email' || type === 'both') {
    if (userEmail) {
      results.push(sendEmail(userEmail, 'Booking Notification', message).catch(e => console.error('Email Failed', e)));
    }
  }

  await Promise.all(results);
};
