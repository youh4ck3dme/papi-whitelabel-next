export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(`${name} is required but was not provided`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new ConfigError(`${name} is required but is empty`);
  }

  return trimmed;
}

export function requireEnvVar(name: string) {
  return readEnv(name);
}

export function requireStripeSecretKey() {
  return readEnv('STRIPE_SECRET_KEY');
}

export function requireStripeWebhookSecret() {
  return readEnv('STRIPE_WEBHOOK_SECRET');
}

export function requireCronSecret() {
  return readEnv('CRON_SECRET');
}

export function requireNextAuthUrl() {
  return readEnv('NEXTAUTH_URL');
}

export function requireStripePriceId(plan: 'STARTER' | 'PRO' | 'ENTERPRISE') {
  const map = {
    STARTER: 'STRIPE_STARTER_PRICE_ID',
    PRO: 'STRIPE_PRO_PRICE_ID',
    ENTERPRISE: 'STRIPE_ENTERPRISE_PRICE_ID',
  } as const;

  return readEnv(map[plan]);
}
