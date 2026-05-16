export function getRequestId(request: Request) {
  const headerRequestId =
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    request.headers.get('x-vercel-id');

  return headerRequestId?.trim() || crypto.randomUUID();
}

export function getCorrelationId(request: Request) {
  return getRequestId(request);
}
