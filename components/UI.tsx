import React, { useState } from 'react';
import { TicketStatus, UserRole } from '../types';
import { Copy, Check, AlertCircle, Clock } from './Icons';

// --- STATUS BADGE ---
export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case TicketStatus.CLAIMED:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]';
      case TicketStatus.CLOSED:
        return 'bg-terminal-accent/10 text-terminal-accent border-terminal-accent/20 shadow-[0_0_10px_rgba(255,59,59,0.1)]';
      case TicketStatus.OPEN:
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]';
    }
  };

  const getIcon = () => {
    switch (status) {
        case TicketStatus.CLAIMED: return <Clock size={12} className="mr-1.5" />;
        case TicketStatus.CLOSED: return <AlertCircle size={12} className="mr-1.5" />;
        default: return <AlertCircle size={12} className="mr-1.5" />;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getStyles()}`}>
      {getIcon()}
      {status}
    </span>
  );
};

// --- COPY BUTTON ---
export const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="group flex items-center gap-1.5 text-xs text-terminal-muted hover:text-terminal-accent transition-colors"
      title="Copy ID"
    >
      {label && <span>{label}</span>}
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
};

// --- ROLE BADGE ---
export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    if (role === UserRole.USER) return null;
    
    // Discord typical roles: Admin/Staff usually highlighted
    const colorClass = role === UserRole.ADMIN 
        ? 'bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/30' 
        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    
    return (
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 flex items-center gap-1 ${colorClass}`}>
            {role === UserRole.ADMIN && <span className="w-1 h-1 rounded-full bg-terminal-accent animate-pulse"></span>}
            {role}
        </span>
    )
}
