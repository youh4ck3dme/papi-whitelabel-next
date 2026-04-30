import axios from 'axios';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

export const nowPayments = {
  // Vytvorenie platobnej požiadavky
  async createPayment(amount: number, currency: string, orderId: string, tenantId: string) {
    try {
      const response = await axios.post(
        `${NOWPAYMENTS_API_URL}/payment`,
        {
          price_amount: amount,
          price_currency: currency,
          order_id: orderId,
          order_description: `Booking Payment for Tenant ${tenantId}`,
        },
        {
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('NowPayments Error:', error);
      throw new Error('Failed to create payment');
    }
  },

  // Overenie platby
  async verifyPayment(paymentId: string) {
    try {
      const response = await axios.get(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY!,
        },
      });
      return response.data;
    } catch (error) {
      console.error('NowPayments Verification Error:', error);
      throw new Error('Failed to verify payment');
    }
  },
};
