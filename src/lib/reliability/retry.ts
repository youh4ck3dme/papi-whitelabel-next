import { logSafe } from '@/lib/security/logging';

const TRANSIENT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

interface RetryableShape {
  retryable?: boolean;
  code?: string;
  status?: number;
  statusCode?: number;
  message?: string;
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  context?: Record<string, unknown>;
}

function readStatus(error: RetryableShape) {
  if (typeof error.status === 'number') return error.status;
  if (typeof error.statusCode === 'number') return error.statusCode;
  return undefined;
}

function readMessage(error: RetryableShape) {
  if (typeof error.message === 'string') {
    return error.message.toLowerCase();
  }
  return '';
}

function asRetryableShape(error: unknown): RetryableShape {
  if (!error || typeof error !== 'object') {
    return {};
  }
  return error as RetryableShape;
}

export function isTransientError(error: unknown) {
  const shaped = asRetryableShape(error);

  if (shaped.retryable === true) return true;
  if (shaped.retryable === false) return false;

  const status = readStatus(shaped);
  if (status === 429 || (typeof status === 'number' && status >= 500)) {
    return true;
  }

  const code = shaped.code;
  if (typeof code === 'string' && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }

  const message = readMessage(shaped);
  if (
    message.includes('timeout') ||
    message.includes('temporar') ||
    message.includes('rate limit') ||
    message.includes('socket hang up')
  ) {
    return true;
  }

  return false;
}

function delayMsForAttempt(attempt: number, baseDelayMs: number, maxDelayMs: number, jitterRatio: number) {
  const expo = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
  const jitter = Math.floor(expo * jitterRatio * Math.random());
  return expo + jitter;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = Math.max(1, options.baseDelayMs ?? 200);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 2_000);
  const jitterRatio = Math.max(0, Math.min(1, options.jitterRatio ?? 0.2));

  let currentAttempt = 1;
  while (currentAttempt <= attempts) {
    try {
      return await operation();
    } catch (error) {
      const shouldRetry = options.shouldRetry?.(error, currentAttempt) ?? isTransientError(error);
      const hasNextAttempt = currentAttempt < attempts;

      if (!shouldRetry || !hasNextAttempt) {
        throw error;
      }

      const retryDelayMs = delayMsForAttempt(currentAttempt, baseDelayMs, maxDelayMs, jitterRatio);
      logSafe('warn', 'Transient failure, retrying operation', {
        ...options.context,
        attempt: currentAttempt,
        maxAttempts: attempts,
        retryDelayMs,
        error: String(error),
      });

      await wait(retryDelayMs);
      currentAttempt += 1;
    }
  }

  throw new Error('Retry loop exhausted unexpectedly');
}
