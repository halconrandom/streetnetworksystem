import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  Activity, 
  LogOut,
  Shield,
  PenTool,
  Image
} from './Icons';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Transcripts', icon: MessageSquare },
    { id: 'v2_builder', label: 'Message Builder', icon: PenTool },
    { id: 'screenshot_editor', label: 'Screenshot Editor', icon: Image },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-terminal-panel border-r border-terminal-border flex flex-col hidden md:flex">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-terminal-border">
        <div className="w-8 h-8 rounded bg-terminal-accent/20 flex items-center justify-center mr-3">
          <Shield size={18} className="text-terminal-accent" />
        </div>
        <div>
            <h1 className="font-bold text-white tracking-wider text-sm">STREET NETWORK</h1>
            <p className="text-[10px] text-terminal-muted uppercase tracking-widest">System Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.id || (currentView === 'transcript_detail' && item.id === 'tickets');
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-terminal-accent/10 text-terminal-accent shadow-sm border border-terminal-accent/20' 
                  : 'text-terminal-muted hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              <item.icon size={18} className={isActive ? 'text-terminal-accent' : 'text-terminal-muted group-hover:text-white'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-terminal-border">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm text-terminal-muted hover:text-red-400 transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
