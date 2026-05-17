import axios from 'axios';
import { logSafe } from '@/lib/security/logging';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

interface NowPaymentsContext {
  requestId?: string;
  tenantId?: string;
}

export const nowPayments = {
  // Vytvorenie platobnej požiadavky
  async createPayment(
    amount: number,
    currency: string,
    orderId: string,
    tenantId: string,
    context: NowPaymentsContext = {}
  ) {
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
      logSafe('error', 'NowPayments create payment failed', {
        requestId: context.requestId,
        tenantId: context.tenantId ?? tenantId,
        orderId,
        error: String(error),
      });
      throw new Error('Failed to create payment');
    }
  },

  // Overenie platby
  async verifyPayment(paymentId: string, context: NowPaymentsContext = {}) {
    try {
      const response = await axios.get(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY!,
        },
      });
      return response.data;
    } catch (error) {
      logSafe('error', 'NowPayments verification failed', {
        requestId: context.requestId,
        tenantId: context.tenantId,
        paymentId,
        error: String(error),
      });
      throw new Error('Failed to verify payment');
    }
  },
};
