import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Permitir rutas públicas sin autenticación
  if (isPublicRoute(req)) {
    return;
  }

  // Proteger todo lo demás (incluyendo /, /dashboard, /tickets, etc.)
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!x)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};