import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/debug(.*)', // Solo para desarrollo
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Rutas de API que deben devolver 401 JSON en lugar de redirigir a /sign-in
const isApiRoute = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Permitir rutas públicas sin autenticación
  if (isPublicRoute(req)) {
    return;
  }

  // Para rutas de API: devolver 401 JSON en lugar de redirigir a /sign-in
  if (isApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return;
  }

  // Para rutas de página: redirigir a /sign-in
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