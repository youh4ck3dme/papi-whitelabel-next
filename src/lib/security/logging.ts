const EMAIL_RE = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const PHONE_RE = /\+?[0-9][0-9\-\s()]{6,}[0-9]/g;

function redactText(input: string) {
  return input
    .replace(EMAIL_RE, (_m, first, domain) => `${first}***${domain}`)
    .replace(PHONE_RE, '[REDACTED_PHONE]');
}

export function sanitizeForLog(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item));
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, current] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')
      ) {
        result[key] = '[REDACTED_SECRET]';
      } else if (
        lowerKey.includes('email') ||
        lowerKey.includes('phone') ||
        lowerKey.includes('message')
      ) {
        result[key] = typeof current === 'string' ? redactText(current) : '[REDACTED_PII]';
      } else {
        result[key] = sanitizeForLog(current);
      }
    }
    return result;
  }

  return value;
}

export function logSafe(level: 'info' | 'warn' | 'error', message: string, meta?: unknown) {
  const safeMeta = meta === undefined ? undefined : sanitizeForLog(meta);
  const payload = {
    level,
    message,
    ...(safeMeta !== undefined ? { meta: safeMeta } : {}),
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}
