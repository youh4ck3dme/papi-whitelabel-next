import { createHash, randomUUID } from 'crypto';
import { appendFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { logSafe } from '@/lib/security/logging';

export interface DeadLetterInput {
  channel: 'sms' | 'email' | 'zapier' | 'notification';
  requestId?: string;
  tenantId?: string;
  payload?: unknown;
  error: unknown;
  retryCount: number;
}

interface DeadLetterRecord {
  id: string;
  createdAt: string;
  channel: DeadLetterInput['channel'];
  requestId?: string;
  tenantId?: string;
  retryCount: number;
  payloadDigest: string;
  errorClass: string;
  errorMessage: string;
}

function getDeadLetterPath() {
  return process.env.DEAD_LETTER_FILE_PATH || join(process.cwd(), '.runtime', 'dead-letter-events.jsonl');
}

function getPayloadDigest(payload: unknown) {
  const serialized = JSON.stringify(payload ?? null);
  return createHash('sha256').update(serialized).digest('hex').slice(0, 24);
}

function toErrorMeta(error: unknown) {
  if (error instanceof Error) {
    return {
      errorClass: error.name || 'Error',
      errorMessage: error.message || 'Unknown error',
    };
  }

  return {
    errorClass: 'UnknownError',
    errorMessage: String(error),
  };
}

export async function enqueueDeadLetter(input: DeadLetterInput) {
  const path = getDeadLetterPath();
  const errorMeta = toErrorMeta(input.error);
  const record: DeadLetterRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    channel: input.channel,
    requestId: input.requestId,
    tenantId: input.tenantId,
    retryCount: input.retryCount,
    payloadDigest: getPayloadDigest(input.payload),
    errorClass: errorMeta.errorClass,
    errorMessage: errorMeta.errorMessage,
  };

  try {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, `${JSON.stringify(record)}\n`, { encoding: 'utf8' });
    logSafe('warn', 'Dead letter event stored', {
      channel: record.channel,
      requestId: record.requestId,
      tenantId: record.tenantId,
      retryCount: record.retryCount,
      payloadDigest: record.payloadDigest,
      deadLetterPath: path,
    });
  } catch (persistError) {
    logSafe('error', 'Failed to persist dead letter event', {
      channel: record.channel,
      requestId: record.requestId,
      tenantId: record.tenantId,
      retryCount: record.retryCount,
      error: String(persistError),
    });
  }
}
