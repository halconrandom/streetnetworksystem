import React from 'react';
import { Download, RotateCcw, Trash2 } from './Icons';

export const ActionToolbar: React.FC = () => {
  return (
    <div className="h-14 border-b border-terminal-border bg-terminal-dark/95 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      
      {/* Context info instead of Logo */}
      <div className="flex items-center gap-3">
         <span className="text-xs font-mono text-terminal-muted uppercase tracking-wider">
             Action Menu
         </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-terminal-border hover:bg-terminal-border/80 text-white rounded transition-colors border border-white/5">
            <Download size={14} />
            Export
        </button>
        
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-colors">
            <Trash2 size={14} />
            Delete
        </button>
      </div>
    </div>
  );
};