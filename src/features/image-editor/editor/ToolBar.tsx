import React from 'react';
import type { ToolType } from '../types';

type Props = {
  activeTool: ToolType;
  onSetTool: (t: ToolType) => void;
};

type ToolDef = { id: ToolType; label: string; icon: React.ReactNode };

const SelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-7 1-4 7z" />
  </svg>
);

const BrushIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.5h7c.98-1.5-.5-2.5-.5-2.5" />
  </svg>
);

const ShapeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const MarqueeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2">
    <rect x="3" y="3" width="18" height="18" />
  </svg>
);

const TextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const tools: ToolDef[] = [
  { id: 'select', label: 'Select / Move', icon: <SelectIcon /> },
  { id: 'brush', label: 'Brush', icon: <BrushIcon /> },
  { id: 'shape', label: 'Shape', icon: <ShapeIcon /> },
  { id: 'marquee', label: 'Marquee Select', icon: <MarqueeIcon /> },
  { id: 'text', label: 'Text', icon: <TextIcon /> },
];

export const ToolBar: React.FC<Props> = ({ activeTool, onSetTool }) => (
  <div className="w-12 bg-[#0d0d0d] border-r border-white/5 flex flex-col items-center py-3 gap-1 shrink-0">
    {tools.map(t => (
      <button
        key={t.id}
        title={t.label}
        onClick={() => onSetTool(t.id)}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
          activeTool === t.id
            ? 'bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/40'
            : 'text-terminal-muted hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        {t.icon}
      </button>
    ))}
    <div className="flex-1" />
    <div className="text-[8px] text-terminal-muted/40 font-mono uppercase tracking-widest pb-1 rotate-90 whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
      Tools
    </div>
  </div>
);
