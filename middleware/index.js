export { authenticate, requireTier, requireAdmin } from './auth';

import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  localeDetection: true
});

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Auto-detect language for root
  if (pathname === '/') {
    const acceptLanguage = request.headers.get('accept-language') || '';
    
    // Check if browser prefers French
    let defaultLocale = 'en';
    if (acceptLanguage.includes('fr')) {
      defaultLocale = 'fr';
    }
    
    // Redirect to detected language
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};