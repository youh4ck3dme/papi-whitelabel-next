import { errorResponse } from './http';

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: ReturnType<typeof errorResponse> };

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function parseJsonBody(request: Request): Promise<ValidationResult<JsonObject>> {
  try {
    const parsed = await request.json();
    if (!isObject(parsed)) {
      return {
        ok: false,
        response: errorResponse(400, 'INVALID_REQUEST', 'Request body must be a JSON object'),
      };
    }

    return { ok: true, data: parsed };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', 'Invalid JSON body'),
    };
  }
}

export function requireString(
  value: unknown,
  field: string,
  options?: { minLength?: number; maxLength?: number; pattern?: RegExp }
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be a string`),
    };
  }

  const trimmed = value.trim();
  const minLength = options?.minLength ?? 1;

  if (trimmed.length < minLength) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be at least ${minLength} characters`),
    };
  }

  if (options?.maxLength && trimmed.length > options.maxLength) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be at most ${options.maxLength} characters`),
    };
  }

  if (options?.pattern && !options.pattern.test(trimmed)) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} has invalid format`),
    };
  }

  return { ok: true, data: trimmed };
}

export function optionalString(value: unknown, field: string): ValidationResult<string | undefined> {
  if (value === undefined || value === null || value === '') {
    return { ok: true, data: undefined };
  }

  const parsed = requireString(value, field);
  if (!parsed.ok) return parsed;
  return { ok: true, data: parsed.data };
}

export function requireNumber(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number }
): ValidationResult<number> {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be a number`),
    };
  }

  if (options?.min !== undefined && value < options.min) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be >= ${options.min}`),
    };
  }

  if (options?.max !== undefined && value > options.max) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be <= ${options.max}`),
    };
  }

  return { ok: true, data: value };
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[]
): ValidationResult<T> {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be one of: ${allowedValues.join(', ')}`),
    };
  }

  return { ok: true, data: value as T };
}

export function requireIsoDate(value: unknown, field: string): ValidationResult<Date> {
  if (typeof value !== 'string') {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be an ISO date string`),
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_REQUEST', `${field} must be a valid date`),
    };
  }

  return { ok: true, data: date };
}
