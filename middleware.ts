import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'es'
});
 
export const config = {
  // Match all pathnames except for
  // - The Next.js internals and static files
  // - The API routes
  // - Public files (e.g. favicon.ico)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};