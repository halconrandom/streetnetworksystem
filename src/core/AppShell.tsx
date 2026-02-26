import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sidebar } from '@app/Sidebar';
import { Menu, Bell, User } from '@shared/icons';

type AppShellProps = {
  currentView: string;
  title?: string;
  children: React.ReactNode | ((props: { flags: string[] }) => React.ReactNode);
};

function AppShell({ currentView, title, children }: AppShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userFlags, setUserFlags] = useState<string[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';

  useEffect(() => {
    if (!apiBase) {
      setCheckingAccess(false);
      return;
    }
    let isMounted = true;
    const checkAccess = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/me`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const payload = await res.json().catch(() => ({}));
        if (!payload?.isVerified) {
          router.replace('/verify');
          return;
        }

        if (isMounted) {
          setUserFlags(payload.flags || []);
          setCheckingAccess(false);
        }
      } catch {
        router.replace('/login');
      }
    };
    checkAccess();
    return () => {
      isMounted = false;
    };
  }, [apiBase, router]);

  useEffect(() => {
    if (checkingAccess || !userFlags.length) return;

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

    if (requiredFlag && !userFlags.includes(requiredFlag)) {
      console.warn(`[AUTH] Unauthorized route access: ${currentPath}. Required flag: ${requiredFlag}`);
      const firstAvailable = Object.entries(routeFlagMap).find(([_, flag]) => userFlags.includes(flag));
      if (firstAvailable) {
        router.replace(firstAvailable[0]);
      } else {
        router.replace('/verify');
      }
    }
  }, [router.pathname, userFlags, checkingAccess]);

  if (checkingAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-terminal-dark text-terminal-muted">
        Verificando acceso...
      </div>
    );
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
            {/* Action items removed as per request */}
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          {typeof children === 'function' ? children({ flags: userFlags }) : children}
        </main>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-terminal-panel via-terminal-dark to-terminal-dark opacity-40"></div>
    </div>
  );
}

export default AppShell;
