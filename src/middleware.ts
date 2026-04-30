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

  // Preskoč API a statické súbory
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/icons/')
  ) {
    return NextResponse.next();
  }

  // Localhost development
  if (hostname?.includes('localhost')) {
    const response = NextResponse.next();
    response.cookies.set('tenantId', 'default-tenant-id');
    return response;
  }

  // Over, či je doména povolená
  const isAllowedDomain = ALLOWED_DOMAINS.some(domain =>
    hostname?.endsWith(domain) || hostname === domain
  );

  if (!isAllowedDomain) {
    return NextResponse.redirect(new URL('https://whitelabeldesign.com/404', request.url));
  }

  // Subdoména (napr. client.whitelabeldesign.com)
  if (hostname?.includes('.whitelabeldesign.com')) {
    const subdomain = hostname.split('.')[0];
    
    // POZNÁMKA: V Edge Runtime nemôžeme priamo volať Prisma (pokiaľ nepoužívaš Accelerate).
    // Tu zatiaľ nastavujeme subdoménu do cookies, aby ju vedeli prečítať Server Components.
    const response = NextResponse.next();
    response.cookies.set('tenantSubdomain', subdomain);
    return response;
  }

  // Custom domain (napr. booking.theirdomain.com)
  if (hostname && !hostname.includes('whitelabeldesign.com')) {
    const response = NextResponse.next();
    response.cookies.set('tenantCustomDomain', hostname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons/).*)'],
};
