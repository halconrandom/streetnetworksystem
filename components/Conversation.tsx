import React, { useState, useMemo } from 'react';
import { Ticket, Message, UserRole } from '../types';
import { Search, MessageSquare, AlertCircle } from './Icons';
import { formatRelativeTime, formatFullDateTime } from '../utils/time';
import { RoleBadge } from './UI';

interface ConversationProps {
  ticket: Ticket;
}

export const Conversation: React.FC<ConversationProps> = ({ ticket }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return ticket.messages;
    return ticket.messages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ticket.messages, searchTerm]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-terminal-panel border border-terminal-border rounded-lg shadow-xl overflow-hidden">
      
      {/* Header / Search Bar */}
      <div className="p-4 border-b border-terminal-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-terminal-panel sticky top-0 z-10">
        <div className="flex items-center gap-2 text-white font-semibold">
            <MessageSquare size={18} className="text-terminal-accent" />
            <h3>Transcript History</h3>
            <span className="ml-2 px-2 py-0.5 bg-terminal-border rounded-full text-xs text-terminal-muted">
                {ticket.messages.filter(m => m.type === 'chat').length} messages
            </span>
        </div>
        
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-terminal-border rounded-md pl-9 pr-3 py-1.5 text-sm text-white placeholder-terminal-muted focus:outline-none focus:border-terminal-accent focus:ring-1 focus:ring-terminal-accent transition-all"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted" />
        </div>
      </div>

      {/* Messages List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-terminal-muted">
                <p>No messages found matching "{searchTerm}"</p>
            </div>
        ) : (
            filteredMessages.map((msg, index) => (
            <MessageItem key={msg.id} message={msg} isLast={index === filteredMessages.length - 1} />
            ))
        )}
      </div>
    </div>
  );
};

// --- SINGLE MESSAGE ITEM ---
const MessageItem: React.FC<{ message: Message; isLast: boolean }> = ({ message }) => {
  
  // 1. SYSTEM MESSAGES (Logs)
  if (message.type === 'system' || message.type === 'log') {
    return (
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="h-[1px] bg-terminal-border flex-1"></div>
        <div className="flex items-center gap-2 text-xs text-terminal-muted font-mono">
           <AlertCircle size={12} className="text-terminal-accent" />
           <span className="text-terminal-accent/80 font-bold">SYSTEM:</span>
           <span>{message.content}</span>
           <span 
             className="opacity-50 cursor-help" 
             title={formatFullDateTime(message.timestamp)}
           >
             — {formatRelativeTime(message.timestamp)}
           </span>
        </div>
        <div className="h-[1px] bg-terminal-border flex-1"></div>
      </div>
    );
  }

  // 2. CHAT MESSAGES
  const isStaff = message.user.role === UserRole.STAFF || message.user.role === UserRole.ADMIN;
  
  return (
    <div className={`flex gap-4 group`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <img 
          src={message.user.avatarUrl} 
          alt={message.user.username} 
          className={`w-10 h-10 rounded-full border-2 ${isStaff ? 'border-terminal-accent' : 'border-terminal-border'}`}
        />
      </div>

      {/* Message Content */}
      <div className={`flex flex-col flex-1 min-w-0`}>
        
        {/* Name & Time */}
        <div className="flex items-center gap-2 mb-1.5">
            <span className={`font-semibold text-sm ${isStaff ? 'text-terminal-accent' : 'text-white'}`}>
                {message.user.username}
            </span>
            <RoleBadge role={message.user.role} />
            <span 
                className="text-xs text-terminal-muted cursor-help transition-colors hover:text-white" 
                title={formatFullDateTime(message.timestamp)}
            >
                {formatRelativeTime(message.timestamp)}
            </span>
        </div>

        {/* Content Body - Bubble Style */}
        <div className={`text-sm leading-relaxed text-terminal-text p-3 rounded-lg border relative ${
            isStaff 
                ? 'bg-terminal-accent/5 border-terminal-accent/20 shadow-sm shadow-red-900/5' 
                : 'bg-white/5 border-white/5'
        }`}>
            {isStaff && (
                 <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-terminal-accent/50 rounded-full ml-0.5"></div>
            )}
            
            {/* Mention Highlighting */}
            <p className={`whitespace-pre-wrap ${isStaff ? 'pl-2' : ''}`}>
                {message.content.split(/(\s+)/).map((word, i) => {
                    if (word.startsWith('@')) {
                        return <span key={i} className="bg-indigo-500/20 text-indigo-300 px-1 rounded cursor-pointer hover:bg-indigo-500/30 transition-colors font-medium">{word}</span>
                    }
                    if (word.startsWith('http')) {
                         return <a key={i} href={word} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline transition-colors">{word}</a>
                    }
                    return word;
                })}
            </p>
        </div>
      </div>
    </div>
  );
};