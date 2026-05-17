import { NextResponse } from 'next/server';
import { ConfigError } from './config';
import { RequestTimeoutError } from './timeout';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_REQUEST'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFIG_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return NextResponse.json(body, { status });
}

export function unknownErrorResponse(error: unknown) {
  if (error instanceof ConfigError) {
    return errorResponse(503, 'CONFIG_ERROR', error.message);
  }

  if (error instanceof RequestTimeoutError) {
    return errorResponse(504, 'REQUEST_TIMEOUT', error.message);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage = isProd
    ? 'Internal server error'
    : error instanceof Error
      ? error.message
      : 'Unexpected error';

  return errorResponse(500, 'INTERNAL_ERROR', safeMessage);
}
