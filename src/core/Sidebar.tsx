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
  Code,
  Image as ImageIcon,
  Database,
  Search,
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
  const [memUsage, setMemUsage] = useState(42);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const interval = setInterval(() => {
      setMemUsage(prev => {
        const delta = Math.random() * 2 - 1;
        return Math.min(Math.max(prev + delta, 35), 60);
      });
    }, 3000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { id: 'home', label: 'CONTROL CENTER', icon: LayoutDashboard, path: '/', flag: 'dashboard' },
    { id: 'nexus', label: 'THE NEXUS', icon: Database, path: '/nexus', flag: 'nexus' },
    { id: 'dashboard', label: 'ORBITAL VIEW', icon: Activity, path: '/dashboard', flag: 'dashboard' },
    { id: 'tickets', label: 'SYSTEM MATRIX', icon: MessageSquare, path: '/tickets', flag: 'transcripts' },
    { id: 'vault', label: 'SECURE VAULT', icon: Shield, path: '/vault', flag: 'vault' },
    { id: 'message_builder', label: 'MSG BUILDER', icon: Code, path: '/message-builder', flag: 'message_builder' },
    { id: 'screenshot_editor', label: 'IMAGE EDITOR', icon: ImageIcon, path: '/screenshot-editor', flag: 'screenshot_editor' },
    { id: 'users', label: 'NODE USERS', icon: Users, path: '/users', flag: 'users' },
  ];

  const filteredItems = menuItems.filter((item) => flags.includes(item.flag));

  const isActive = (itemId: string, path: string) => {
    if (currentView === itemId) return true;
    if (itemId === 'tickets' && currentPath.startsWith('/tickets')) return true;
    if (itemId === 'message_builder' && currentPath.startsWith('/message-builder')) return true;
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
    <aside className="w-64 bg-[#050505] border-r border-white/5 flex flex-col hidden md:flex h-full select-none">
      {/* Header */}
      <div className="h-24 flex items-center px-6 border-b border-white/5">
        <div className="w-10 h-10 rounded bg-[#111] border border-white/10 flex items-center justify-center mr-3 relative group">
           <div className="absolute inset-0 bg-terminal-accent/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="w-6 h-6 border-2 border-terminal-accent rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-terminal-accent rounded-full"></div>
           </div>
        </div>
        <div>
          <h1 className="font-bold text-white tracking-[0.15em] text-sm font-mono">HALCON.DEV</h1>
          <p className="text-[9px] text-terminal-muted/60 uppercase tracking-[0.2em] font-mono">SYSADMIN NODE</p>
        </div>
      </div>

      {/* Refuel Energy (Buy me a coffee) */}
      <div className="p-4">
        <a 
          href="https://www.buymeacoffee.com/halconrandom"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 bg-terminal-accent/5 border border-terminal-accent/20 rounded-lg group hover:bg-terminal-accent/10 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-terminal-accent group-hover:animate-bounce">☕</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Refuel Energy</span>
          </div>
          <div className="bg-terminal-accent/20 px-2 py-0.5 rounded text-[8px] font-bold text-terminal-accent border border-terminal-accent/30 flex items-center gap-1">
            <span>♥</span>
            <span>8</span>
          </div>
        </a>
      </div>

      <div className="px-6 py-2">
         <h3 className="text-[9px] font-mono text-terminal-muted/40 uppercase tracking-[0.3em]">Active Modules</h3>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pt-2">
        {filteredItems.map((item) => {
          const active = isActive(item.id, item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-[11px] font-bold transition-all duration-200 group relative
                ${active
                  ? 'bg-white/5 text-white'
                  : 'text-terminal-muted hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-terminal-accent shadow-[0_0_8px_#ff003c]"></div>
              )}
              
              <div className="flex items-center gap-4">
                <item.icon size={14} className={`${active ? 'text-terminal-accent' : 'text-terminal-muted group-hover:text-white'} transition-colors`} />
                <span className="tracking-[0.1em]">{item.label}</span>
              </div>

              {active && <div className="text-terminal-accent/30 text-[10px]">›</div>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Stats */}
      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8px] font-mono text-terminal-muted uppercase tracking-widest">
            <div className="flex items-center gap-1">
               <Activity size={10} className="text-terminal-muted" />
               MEM
            </div>
            <span>{Math.round(memUsage)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-terminal-muted/40 transition-all duration-1000" 
               style={{ width: `${memUsage}%` }}
             ></div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[8px] font-mono text-terminal-muted uppercase tracking-widest">
            <div className="flex items-center gap-1">
               <span>NET</span>
            </div>
            <span className="text-emerald-500 font-bold">STABLE</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500/60 w-[85%]"></div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-4 w-full text-[10px] font-bold text-terminal-muted hover:text-white transition-all group pt-6"
        >
          <LogOut size={14} className="group-hover:text-terminal-accent transition-colors rotate-180" />
          <span className="tracking-[0.2em] uppercase">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
};
