import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useUser, RedirectToSignIn } from '@clerk/nextjs';
import { Sidebar } from '@app/Sidebar';
import { Menu, Settings } from '@shared/icons';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';

type AppShellProps = {
  currentView: string;
  title?: string;
  children: React.ReactNode | ((props: { flags: string[], role: string }) => React.ReactNode);
};

// Mapa de rutas a flags requeridos
const ROUTE_FLAG_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/tickets': 'transcripts',
  '/message-builder': 'message_builder',
  '/screenshot-editor': 'screenshot_editor',
  '/nexus': 'nexus',
  '/users': 'users',
  '/audit': 'audit_logs',
  '/vault': 'vault',
};

interface DBUserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  avatarUrl: string | null;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  flags: string[];
}

function AppShell({ currentView, title, children }: AppShellProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // DB-sourced user profile (flags + role come from sn_users / sn_user_flags)
  const [dbUser, setDbUser] = useState<DBUserProfile | null>(null);
  const [dbUserLoading, setDbUserLoading] = useState(false);
  const [dbUserError, setDbUserError] = useState(false);

  // Fetch DB user profile from /api/auth/me (source of truth for flags & role)
  const fetchDbUser = useCallback(async () => {
    setDbUserLoading(true);
    setDbUserError(false);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        console.error('[AppShell] /api/auth/me returned', res.status);
        setDbUserError(true);
        return;
      }
      const data: DBUserProfile = await res.json();
      setDbUser(data);
    } catch (err) {
      console.error('[AppShell] Failed to fetch DB user:', err);
      setDbUserError(true);
    } finally {
      setDbUserLoading(false);
    }
  }, []);

  // Fetch DB user once Clerk session is ready
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDbUser();
    }
  }, [isLoaded, isSignedIn, fetchDbUser]);

  // Listen for avatar updates from settings
  useEffect(() => {
    const handleAvatarUpdate = () => {
      fetchDbUser();
    };

    window.addEventListener('user-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('user-avatar-updated', handleAvatarUpdate);
  }, [fetchDbUser]);

  // Flags and role come exclusively from the DB — never from Clerk publicMetadata
  const userFlags: string[] = dbUser?.flags ?? [];
  const userRole: string = dbUser?.role ?? 'user';

  // Route protection based on DB flags
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // Wait until DB user is loaded before enforcing route protection
    if (dbUserLoading || !dbUser) return;

    const currentPath = router.pathname;
    const requiredFlag = ROUTE_FLAG_MAP[currentPath];

    if (requiredFlag && !userFlags.includes(requiredFlag)) {
      console.warn(`[AUTH] Unauthorized route: ${currentPath}. Required flag: ${requiredFlag}. User flags: [${userFlags.join(', ')}]`);

      // Redirect to first available route, or home
      const firstAvailable = Object.entries(ROUTE_FLAG_MAP).find(([, flag]) => userFlags.includes(flag));
      router.replace(firstAvailable ? firstAvailable[0] : '/');
    }
  }, [isLoaded, isSignedIn, dbUser, dbUserLoading, router, userFlags]);

  // ── Loading states ──────────────────────────────────────────────────────────

  // Clerk not yet initialized
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-terminal-dark text-terminal-muted">
        <span className="animate-pulse font-mono text-xs uppercase tracking-widest">Verificando acceso...</span>
      </div>
    );
  }

  // Not authenticated → Clerk middleware handles redirect, but guard here too
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // DB user still loading
  if (dbUserLoading || !dbUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-terminal-dark text-terminal-muted">
        <span className="animate-pulse font-mono text-xs uppercase tracking-widest">Cargando perfil...</span>
      </div>
    );
  }

  // DB user inactive
  if (!dbUser.is_active) {
    return (
      <div className="flex h-screen items-center justify-center bg-terminal-dark">
        <div className="text-center space-y-3 max-w-sm px-6">
          <p className="text-red-400 font-mono text-sm uppercase tracking-widest">Cuenta desactivada</p>
          <p className="text-terminal-muted text-xs">Tu cuenta ha sido desactivada. Contacta a un administrador.</p>
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────

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
            {/* User avatar — link to settings */}
            <motion.button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 group relative"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar */}
              <div className="relative">
                {(dbUser.avatarUrl || dbUser.discordAvatar || user?.imageUrl) && (
                  <img
                    src={dbUser.avatarUrl || dbUser.discordAvatar || user?.imageUrl || ''}
                    alt={dbUser.discordUsername || dbUser.name || user?.username || 'User'}
                    className="w-8 h-8 rounded-full border border-terminal-border group-hover:border-terminal-accent/50 transition-colors object-cover"
                  />
                )}
                {/* Custom avatar indicator */}
                {dbUser.avatarUrl && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-terminal-accent rounded-full border border-terminal-dark" />
                )}
              </div>
              
              {/* Username */}
              <span className="text-xs text-terminal-muted group-hover:text-white transition-colors hidden sm:block">
                {dbUser.discordUsername || dbUser.name || user?.username || 'User'}
              </span>

              {/* Settings tooltip on hover */}
              <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-terminal-panel border border-terminal-border rounded-md shadow-lg">
                  <Settings size={12} className="text-terminal-accent" />
                  <span className="text-[10px] font-medium text-white uppercase tracking-wider">Settings</span>
                </div>
              </div>
            </motion.button>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          {typeof children === 'function' ? children({ flags: userFlags, role: userRole }) : children}
        </main>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-terminal-panel via-terminal-dark to-terminal-dark opacity-40" />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f1f1f',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            fontFamily: 'inherit',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          },
        }}
      />
    </div>
  );
}

export default AppShell;
