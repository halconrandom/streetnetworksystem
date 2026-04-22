import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronLeft,
  Menu as MenuIcon,
  TrendingUp,
} from '@shared/icons';

interface SidebarProps {
  currentView: string;
  flags: string[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, flags, isCollapsed, onToggle }) => {
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
    { id: 'home', label: 'DASHBOARD', icon: LayoutDashboard, path: '/', flag: 'dashboard' },
    { id: 'finance', label: 'FINANCE', icon: TrendingUp, path: '/finance', flag: 'finance' },
    { id: 'nexus', label: 'NEXUS', icon: Database, path: '/nexus', flag: 'nexus' },
    { id: 'tickets', label: 'DISCORD TICKETS', icon: MessageSquare, path: '/tickets', flag: 'transcripts' },
    { id: 'vault', label: 'VAULT', icon: Shield, path: '/vault', flag: 'vault' },
    { id: 'message_builder', label: 'MESSAGE BUILDER', icon: Code, path: '/message-builder', flag: 'message_builder' },
    { id: 'screenshot_editor', label: 'IMAGE EDITOR', icon: ImageIcon, path: '/screenshot-editor', flag: 'screenshot_editor' },
    { id: 'users', label: 'USERS', icon: Users, path: '/users', flag: 'users' },
  ];

  const filteredItems = menuItems.filter((item) => flags.includes(item.flag));

  const isActive = (itemId: string, path: string) => {
    if (currentView === itemId) return true;
    if (itemId === 'tickets' && currentPath.startsWith('/tickets')) return true;
    if (itemId === 'message_builder' && currentPath.startsWith('/message-builder')) return true;
    if (itemId === 'screenshot_editor' && currentPath.startsWith('/screenshot-editor')) return true;
    if (itemId === 'finance' && currentPath.startsWith('/finance')) return true;
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
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-[#050505] border-r border-white/5 flex flex-col hidden md:flex h-full select-none overflow-hidden"
    >
      {/* Header */}
      <div className={`flex items-center border-b border-white/5 overflow-hidden ${isCollapsed ? 'h-20 justify-center px-0' : 'h-28 px-6'}`}>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="w-14 h-14 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center mr-4 relative group overflow-hidden">
               <img src="https://i.imgur.com/WznCLue.png" alt="Halcon Logo" className="w-12 h-12 object-contain relative z-10 p-1" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-[0.15em] text-sm font-mono uppercase truncate w-32">HALCON.DEV</h1>
              <p className="text-[9px] text-terminal-muted/60 uppercase tracking-[0.2em] font-mono">SYSADMIN NODE</p>
            </div>
          </motion.div>
        )}
        
        <button 
          onClick={onToggle}
          className={`text-terminal-muted hover:text-terminal-accent transition-colors p-2 rounded-md hover:bg-white/5 ${isCollapsed ? '' : 'ml-auto'}`}
        >
          {isCollapsed ? <MenuIcon size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Refuel Energy */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 overflow-hidden"
          >
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
              <div className="bg-terminal-accent/20 px-2 py-0.5 rounded text-[8px] font-bold text-terminal-accent border border-terminal-accent/30">
                ♥ 8
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {!isCollapsed && (
        <div className="px-6 py-2">
           <h3 className="text-[9px] font-mono text-terminal-muted/40 uppercase tracking-[0.3em]">Active Modules</h3>
        </div>
      )}

      <nav className={`flex-1 space-y-1 overflow-y-auto custom-scrollbar pt-2 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {filteredItems.map((item) => {
          const active = isActive(item.id, item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center rounded-md text-[11px] font-bold transition-all duration-200 group relative
                ${isCollapsed ? 'justify-center h-12 w-12 mx-auto mb-2' : 'px-4 py-2.5 justify-between'}
                ${active
                  ? 'bg-white/5 text-white'
                  : 'text-terminal-muted hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              {active && (
                <div className={`absolute top-1/2 -translate-y-1/2 bg-terminal-accent shadow-[0_0_8px_#ff003c] ${isCollapsed ? 'left-[-8px] w-1 h-6' : 'left-0 w-0.5 h-4'}`}></div>
              )}
              
              <div className="flex items-center gap-4">
                <item.icon size={isCollapsed ? 20 : 14} className={`${active ? 'text-terminal-accent' : 'text-terminal-muted group-hover:text-white'} transition-colors`} />
                {!isCollapsed && <span className="tracking-[0.1em]">{item.label}</span>}
              </div>

              {!isCollapsed && active && <div className="text-terminal-accent/30 text-[10px]">›</div>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/5 ${isCollapsed ? 'p-2 flex justify-center' : 'p-6'}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full text-[10px] font-bold text-terminal-muted hover:text-white transition-all group ${isCollapsed ? 'justify-center p-2' : 'px-3 py-4'}`}
          title={isCollapsed ? 'Terminate Session' : ''}
        >
          <LogOut size={isCollapsed ? 20 : 14} className="group-hover:text-terminal-accent transition-colors rotate-180" />
          {!isCollapsed && <span className="tracking-[0.2em] uppercase">Terminate Session</span>}
        </button>
      </div>
    </motion.aside>
  );
};
