import { errorResponse } from './http';

type BucketState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, BucketState>();

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (!xForwardedFor) return 'unknown';

  return xForwardedFor.split(',')[0]?.trim() || 'unknown';
}

export function enforceRateLimit(options: {
  request: Request;
  bucket: string;
  identity?: string;
  limit: number;
  windowMs: number;
}) {
  const { request, bucket, identity = 'anonymous', limit, windowMs } = options;

  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${bucket}:${identity}:${ip}`;
  const current = buckets.get(key);

  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      ok: false as const,
      response: errorResponse(429, 'RATE_LIMITED', 'Too many requests', {
        retryAfterSeconds,
        bucket,
      }),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true as const };
}
