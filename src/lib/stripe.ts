import Stripe from 'stripe';
import { requireStripeSecretKey } from '@/lib/security/config';

let cachedStripeClient: Stripe | null = null;
let cachedStripeSecret: string | null = null;

export function getStripeClient() {
  const stripeSecretKey = requireStripeSecretKey();

  if (!cachedStripeClient || cachedStripeSecret !== stripeSecretKey) {
    cachedStripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2026-04-22.dahlia' as any,
    });
    cachedStripeSecret = stripeSecretKey;
  }

  return cachedStripeClient;
}
