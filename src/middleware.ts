import { NextResponse, NextRequest } from 'next/server';

// Zoznam povolených domén
const ALLOWED_DOMAINS = [
  'localhost:3000',
  'whitelabeldesign.com',
  '*.whitelabeldesign.com',
];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const path = request.nextUrl.pathname;
  const correlationId =
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    request.headers.get('x-vercel-id') ||
    crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', correlationId);
  requestHeaders.set('x-correlation-id', correlationId);

  const withCorrelationHeaders = (response: NextResponse) => {
    response.headers.set('x-request-id', correlationId);
    response.headers.set('x-correlation-id', correlationId);
    return response;
  };

  // Preskoč API a statické súbory
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/icons/')
  ) {
    return withCorrelationHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  // Localhost development
  if (hostname?.includes('localhost')) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set('tenantId', 'default-tenant-id');
    return withCorrelationHeaders(response);
  }

  // Over, či je doména povolená
  const isAllowedDomain = ALLOWED_DOMAINS.some(domain =>
    hostname?.endsWith(domain) || hostname === domain
  );

  if (!isAllowedDomain) {
    return withCorrelationHeaders(
      NextResponse.redirect(new URL('https://whitelabeldesign.com/404', request.url))
    );
  }

  // Subdoména (napr. client.whitelabeldesign.com)
  if (hostname?.includes('.whitelabeldesign.com')) {
    const subdomain = hostname.split('.')[0];
    
    // POZNÁMKA: V Edge Runtime nemôžeme priamo volať Prisma (pokiaľ nepoužívaš Accelerate).
    // Tu zatiaľ nastavujeme subdoménu do cookies, aby ju vedeli prečítať Server Components.
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set('tenantSubdomain', subdomain);
    return withCorrelationHeaders(response);
  }

  // Custom domain (napr. booking.theirdomain.com)
  if (hostname && !hostname.includes('whitelabeldesign.com')) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set('tenantCustomDomain', hostname);
    return withCorrelationHeaders(response);
  }

  return withCorrelationHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
};
