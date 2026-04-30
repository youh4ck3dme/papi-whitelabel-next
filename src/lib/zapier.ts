export const sendToZapier = async (event: string, data: any) => {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('Zapier Webhook URL not configured, skipping');
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
      throw new Error('Zapier Webhook Failed');
    }

    return response.json();
  } catch (error) {
    console.error('Zapier Error:', error);
    throw new Error('Failed to send to Zapier');
  }
};
