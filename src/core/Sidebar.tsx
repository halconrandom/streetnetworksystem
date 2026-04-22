import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useClerk } from '@clerk/nextjs';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Activity,
  LogOut,
  Shield,
  PenTool,
  Image,
  Code,
} from '@shared/icons';

interface SidebarProps {
  currentView: string;
  flags: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, flags }) => {
  const router = useRouter();
  const { signOut } = useClerk();
  const currentPath = router.asPath;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Control Center', icon: LayoutDashboard, path: '/', flag: 'dashboard' },
    { id: 'dashboard', label: 'System Dashboard', icon: Activity, path: '/dashboard', flag: 'dashboard' },
    { id: 'tickets', label: 'Transcripts', icon: MessageSquare, path: '/tickets', flag: 'transcripts' },
    { id: 'message_builder', label: 'Message Builder', icon: Code, path: '/message-builder', flag: 'message_builder' },
    { id: 'screenshot_editor', label: 'Screenshot Editor', icon: Image, path: '/screenshot-editor', flag: 'screenshot_editor' },
    { id: 'nexus', label: 'The Nexus', icon: Activity, path: '/nexus', flag: 'nexus' },
    { id: 'audit', label: 'Audit Logs', icon: Activity, path: '/audit', flag: 'audit_logs' },
    { id: 'vault', label: 'The Vault', icon: Shield, path: '/vault', flag: 'vault' },
    { id: 'users', label: 'Users', icon: Users, path: '/users', flag: 'users' },
  ];

  const filteredItems = menuItems.filter((item) => flags.includes(item.flag));

  const isActive = (itemId: string, path: string) => {
    if (currentView === itemId) return true;
    if (itemId === 'tickets' && currentPath.startsWith('/tickets')) return true;
    if (itemId === 'v2_builder' && currentPath.startsWith('/message-builder')) return true;
    if (itemId === 'screenshot_editor' && currentPath.startsWith('/screenshot-editor')) return true;
    return currentPath === path;
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: '/sign-in' });
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (isFullscreen) return null;

  return (
    <aside className="w-64 bg-terminal-panel border-r border-terminal-border flex flex-col hidden md:flex">
      <div className="h-24 flex items-center px-6 border-b border-terminal-border">
        <div className="w-14 h-14 rounded-2xl bg-terminal-panel border border-terminal-border flex items-center justify-center mr-4 overflow-hidden shadow-md">
          <img src="https://i.imgur.com/WznCLue.png" alt="halcon.dev Logo" className="w-12 h-12 object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wider text-sm">HALCON.DEV</h1>
          <p className="text-[10px] text-terminal-muted uppercase tracking-widest">Command Center</p>
        </div>
      </div>

      {/* Buy me a coffee */}
      <div className="px-4 py-3 border-b border-terminal-border">
        <a
          href="https://www.buymeacoffee.com/halconrandom"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img
            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=halconrandom&button_colour=FF5F5F&font_colour=ffffff&font_family=Comic&outline_colour=000000&coffee_colour=FFDD00"
            alt="Buy me a coffee"
            className="w-full rounded-lg"
          />
        </a>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {filteredItems.map((item) => {
          const active = isActive(item.id, item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${active
                  ? 'bg-terminal-accent/10 text-terminal-accent shadow-sm border border-terminal-accent/20'
                  : 'text-terminal-muted hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              <item.icon size={18} className={active ? 'text-terminal-accent' : 'text-terminal-muted group-hover:text-white'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-terminal-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-terminal-muted hover:text-red-400 transition-colors transition-all active:scale-95"
        >
          <LogOut size={18} />
          <span>Logout System</span>
        </button>
      </div>
    </aside>
  );
};
