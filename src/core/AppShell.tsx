import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useUser } from '@clerk/nextjs';
import { Sidebar } from '@app/Sidebar';
import { Menu } from '@shared/icons';
import { Toaster } from 'sonner';

type AppShellProps = {
  currentView: string;
  title?: string;
  children: React.ReactNode | ((props: { flags: string[], role: string }) => React.ReactNode);
};

function AppShell({ currentView, title, children }: AppShellProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Obtener flags y role desde publicMetadata del usuario
  const userFlags = (user?.publicMetadata?.flags as string[]) || [];
  const userRole = (user?.publicMetadata?.role as string) || 'user';

  // Verificar acceso basado en flags
  useEffect(() => {
    if (!isLoaded) return;

    // Si no está autenticado, Clerk middleware ya redirige a /sign-in
    if (!isSignedIn) return;

    // Mapa de rutas a flags requeridos
    const routeFlagMap: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/tickets': 'transcripts',
      '/message-builder': 'message_builder',
      '/screenshot-editor': 'screenshot_editor',
      '/nexus': 'nexus',
      '/users': 'users',
      '/audit': 'audit_logs',
      '/vault': 'vault',
    };

    const currentPath = router.pathname;
    const requiredFlag = routeFlagMap[currentPath];

    // Si la ruta requiere un flag y el usuario no lo tiene
    if (requiredFlag && !userFlags.includes(requiredFlag)) {
      console.warn(`[AUTH] Unauthorized route access: ${currentPath}. Required flag: ${requiredFlag}`);
      
      // Buscar la primera ruta disponible para el usuario
      const firstAvailable = Object.entries(routeFlagMap).find(([_, flag]) => userFlags.includes(flag));
      if (firstAvailable) {
        router.replace(firstAvailable[0]);
      } else {
        // Si no tiene flags, redirigir a home
        router.replace('/');
      }
    }
  }, [isLoaded, isSignedIn, router, userFlags]);

  // Mostrar loading mientras Clerk carga
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-terminal-dark text-terminal-muted">
        Verificando acceso...
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (middleware redirige)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex h-screen bg-terminal-dark text-terminal-text font-sans overflow-hidden">
      <Sidebar currentView={currentView} flags={userFlags} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-terminal-panel/50 backdrop-blur-sm border-b border-terminal-border flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-terminal-muted hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-medium text-white capitalize hidden sm:block">
              System / {title ?? currentView.replace('_', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* User info */}
            {user && (
              <div className="flex items-center gap-2">
                {user.imageUrl && (
                  <img 
                    src={user.imageUrl} 
                    alt={user.username || 'User'} 
                    className="w-8 h-8 rounded-full border border-terminal-border"
                  />
                )}
                <span className="text-xs text-terminal-muted hidden sm:block">
                  {user.username || user.firstName || 'User'}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          {typeof children === 'function' ? children({ flags: userFlags, role: userRole }) : children}
        </main>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-terminal-panel via-terminal-dark to-terminal-dark opacity-40"></div>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontFamily: 'inherit'
          }
        }}
      />
    </div>
  );
}

export default AppShell;
