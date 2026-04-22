import React, { useRef } from 'react';
import type { AdvancedLayer, BlendMode } from '../types';

type Props = {
  layers: AdvancedLayer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onRemoveLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpdateLayer: (id: string, update: Partial<Omit<AdvancedLayer, 'id' | 'type' | 'data'>>) => void;
  onCreateDrawLayer: () => void;
  onCreateImageLayer: (dataUrl: string, name: string, w: number, h: number) => void;
};

const BLEND_MODES: BlendMode[] = [
  'source-over', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion',
];

const BLEND_LABELS: Record<BlendMode, string> = {
  'source-over': 'Normal', 'multiply': 'Multiply', 'screen': 'Screen',
  'overlay': 'Overlay', 'darken': 'Darken', 'lighten': 'Lighten',
  'color-dodge': 'Color Dodge', 'color-burn': 'Color Burn',
  'hard-light': 'Hard Light', 'soft-light': 'Soft Light',
  'difference': 'Difference', 'exclusion': 'Exclusion',
};

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  draw:  { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/20', label: 'Draw' },
  image: { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/20',       label: 'Img' },
  text:  { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20', label: 'Txt' },
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
    )}
  </svg>
);

export const RightPanel: React.FC<Props> = ({
  layers, activeLayerId,
  onSelectLayer, onRemoveLayer, onDuplicateLayer,
  onToggleVisible, onToggleLocked,
  onMoveUp, onMoveDown, onUpdateLayer,
  onCreateDrawLayer, onCreateImageLayer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeLayer = layers.find(l => l.id === activeLayerId) ?? null;
  const displayLayers = [...layers].reverse();

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => onCreateImageLayer(dataUrl, file.name.replace(/\.[^.]+$/, ''), img.width, img.height);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="w-72 bg-[#0d0d0d] border-l border-white/5 flex flex-col shrink-0 overflow-hidden">

      {/* New Layer buttons */}
      <div className="px-3 pt-3 pb-2 border-b border-white/5 space-y-1.5">
        <p className="text-[9px] font-mono text-terminal-muted/30 uppercase tracking-[0.3em] mb-2">New Layer</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onCreateDrawLayer}
            className="flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            Draw Layer
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            Image Layer
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>

      {/* Layers list */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <p className="text-[9px] font-mono text-terminal-muted/30 uppercase tracking-[0.3em]">
          Layers ({layers.length})
        </p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {displayLayers.length === 0 && (
          <div className="text-[11px] text-terminal-muted/20 text-center p-6 font-mono leading-relaxed">
            No layers yet.<br />Create one above.
          </div>
        )}
        {displayLayers.map(layer => {
          const badge = TYPE_BADGE[layer.type] ?? TYPE_BADGE.draw;
          const isActive = activeLayerId === layer.id;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer group transition-all border-b border-white/[0.03] ${
                isActive
                  ? 'bg-terminal-accent/8 border-l-2 border-l-terminal-accent'
                  : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
              }`}
            >
              {/* Type badge */}
              <span className={`text-[8px] font-bold uppercase rounded px-1 py-0.5 border shrink-0 ${badge.bg}`}>
                {badge.label}
              </span>

              {/* Name */}
              <span className={`flex-1 text-[11px] truncate font-mono ${isActive ? 'text-white' : 'text-terminal-muted'}`}>
                {layer.name}
              </span>

              {/* Actions (visible on hover or when active) */}
              <div className={`flex items-center gap-0.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button
                  title="Toggle visibility"
                  onClick={e => { e.stopPropagation(); onToggleVisible(layer.id); }}
                  className={`p-1 rounded transition-colors ${layer.visible ? 'text-terminal-muted hover:text-white' : 'text-terminal-muted/30 hover:text-terminal-muted'}`}
                >
                  <EyeIcon open={layer.visible} />
                </button>
                <button
                  title="Duplicate layer"
                  onClick={e => { e.stopPropagation(); onDuplicateLayer(layer.id); }}
                  className="p-1 rounded text-terminal-muted/50 hover:text-white transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button
                  title="Delete layer"
                  onClick={e => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                  className="p-1 rounded text-terminal-muted/30 hover:text-red-400 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reorder */}
      {activeLayer && (
        <div className="flex gap-1 px-3 py-2 border-t border-white/5">
          <button onClick={() => onMoveUp(activeLayer.id)} className="flex-1 py-1 text-[10px] font-mono text-terminal-muted hover:text-white border border-white/10 rounded hover:border-white/20 transition-all">↑ Up</button>
          <button onClick={() => onMoveDown(activeLayer.id)} className="flex-1 py-1 text-[10px] font-mono text-terminal-muted hover:text-white border border-white/10 rounded hover:border-white/20 transition-all">↓ Down</button>
        </div>
      )}

      {/* Properties */}
      {activeLayer && (
        <div className="border-t border-white/5 p-3 space-y-3 shrink-0">
          <p className="text-[9px] font-mono text-terminal-muted/30 uppercase tracking-[0.3em]">Properties — {activeLayer.name}</p>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-terminal-muted/70">Opacity</span>
              <span className="text-[10px] font-mono text-white/40">{Math.round(activeLayer.opacity * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={Math.round(activeLayer.opacity * 100)}
              onChange={e => onUpdateLayer(activeLayer.id, { opacity: Number(e.target.value) / 100 })}
              className="w-full accent-terminal-accent h-1"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-terminal-muted/70">Blend Mode</span>
            <select
              value={activeLayer.blendMode}
              onChange={e => onUpdateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white font-mono mt-1"
            >
              {BLEND_MODES.map(m => <option key={m} value={m}>{BLEND_LABELS[m]}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
