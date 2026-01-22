import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sidebar } from './components/Sidebar';
import { Menu, Bell, User } from './components/Icons';

type AppShellProps = {
  currentView: string;
  title?: string;
  children: React.ReactNode;
};

function AppShell({ currentView, title, children }: AppShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
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
        if (isMounted) setCheckingAccess(false);
      } catch {
        router.replace('/login');
      }
    };
    checkAccess();
    return () => {
      isMounted = false;
    };
  }, [apiBase, router]);

  if (checkingAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-terminal-dark text-terminal-muted">
        Verificando acceso...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-terminal-dark text-terminal-text font-sans overflow-hidden">
      <Sidebar currentView={currentView} />

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
            <button className="relative text-terminal-muted hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-terminal-accent rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-gray-500 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-terminal-panel via-terminal-dark to-terminal-dark opacity-40"></div>
    </div>
  );
}

export default AppShell;
