import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
]);

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/tickets(.*)',
  '/message-builder(.*)',
  '/screenshot-editor(.*)',
  '/nexus(.*)',
  '/audit(.*)',
  '/vault(.*)',
  '/users(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Permitir rutas públicas
  if (isPublicRoute(req)) {
    return;
  }

  // Proteger rutas que requieren autenticación
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!x)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};