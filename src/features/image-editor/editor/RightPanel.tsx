import React from 'react';
import type { AdvancedLayer, BlendMode } from '../types';

type Props = {
  layers: AdvancedLayer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onRemoveLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpdateLayer: (id: string, update: Partial<Omit<AdvancedLayer, 'id' | 'type' | 'data'>>) => void;
};

const BLEND_MODES: BlendMode[] = [
  'source-over', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion',
];

const BLEND_LABELS: Record<BlendMode, string> = {
  'source-over': 'Normal',
  'multiply': 'Multiply',
  'screen': 'Screen',
  'overlay': 'Overlay',
  'darken': 'Darken',
  'lighten': 'Lighten',
  'color-dodge': 'Color Dodge',
  'color-burn': 'Color Burn',
  'hard-light': 'Hard Light',
  'soft-light': 'Soft Light',
  'difference': 'Difference',
  'exclusion': 'Exclusion',
};

const TYPE_COLOR: Record<string, string> = {
  image: 'bg-blue-500/20 text-blue-400',
  brush: 'bg-purple-500/20 text-purple-400',
  shape: 'bg-green-500/20 text-green-400',
  text: 'bg-yellow-500/20 text-yellow-400',
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {locked ? (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ) : (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    )}
  </svg>
);

export const RightPanel: React.FC<Props> = ({
  layers, activeLayerId,
  onSelectLayer, onRemoveLayer, onToggleVisible, onToggleLocked,
  onMoveUp, onMoveDown, onUpdateLayer,
}) => {
  const activeLayer = layers.find(l => l.id === activeLayerId) ?? null;
  const displayLayers = [...layers].reverse();

  return (
    <div className="w-56 bg-[#0d0d0d] border-l border-white/5 flex flex-col shrink-0 overflow-hidden">
      {/* Layers */}
      <div className="px-3 py-2 border-b border-white/5">
        <h3 className="text-[9px] font-mono text-terminal-muted/40 uppercase tracking-[0.3em]">Layers</h3>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {displayLayers.length === 0 && (
          <div className="text-[11px] text-terminal-muted/30 text-center p-4 font-mono">No layers</div>
        )}
        {displayLayers.map(layer => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer group transition-all ${
              activeLayerId === layer.id
                ? 'bg-terminal-accent/10 border-l-2 border-terminal-accent'
                : 'hover:bg-white/[0.03] border-l-2 border-transparent'
            }`}
          >
            <span className={`text-[8px] font-bold uppercase rounded px-1 py-0.5 shrink-0 ${TYPE_COLOR[layer.type]}`}>
              {layer.type[0]}
            </span>
            <span className={`flex-1 text-[11px] truncate font-mono ${activeLayerId === layer.id ? 'text-white' : 'text-terminal-muted'}`}>
              {layer.name}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={e => { e.stopPropagation(); onToggleVisible(layer.id); }}
                className={`p-0.5 rounded ${layer.visible ? 'text-terminal-muted hover:text-white' : 'text-terminal-muted/30 hover:text-terminal-muted'}`}
              >
                <EyeIcon open={layer.visible} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onToggleLocked(layer.id); }}
                className={`p-0.5 rounded ${layer.locked ? 'text-terminal-accent' : 'text-terminal-muted hover:text-white'}`}
              >
                <LockIcon locked={layer.locked} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                className="p-0.5 rounded text-terminal-muted/30 hover:text-red-400 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reorder controls */}
      {activeLayer && (
        <div className="flex items-center gap-1 px-3 py-2 border-t border-white/5">
          <button
            onClick={() => onMoveUp(activeLayer.id)}
            className="flex-1 py-1 text-[10px] font-mono text-terminal-muted hover:text-white border border-white/10 rounded hover:border-white/20 transition-all"
            title="Move layer up"
          >
            ↑ Up
          </button>
          <button
            onClick={() => onMoveDown(activeLayer.id)}
            className="flex-1 py-1 text-[10px] font-mono text-terminal-muted hover:text-white border border-white/10 rounded hover:border-white/20 transition-all"
            title="Move layer down"
          >
            ↓ Down
          </button>
        </div>
      )}

      {/* Properties */}
      {activeLayer && (
        <div className="border-t border-white/5 p-3 space-y-3 shrink-0">
          <h3 className="text-[9px] font-mono text-terminal-muted/40 uppercase tracking-[0.3em]">Properties</h3>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-terminal-muted">Opacity</span>
              <span className="text-[10px] font-mono text-white/50">{Math.round(activeLayer.opacity * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={Math.round(activeLayer.opacity * 100)}
              onChange={e => onUpdateLayer(activeLayer.id, { opacity: Number(e.target.value) / 100 })}
              className="w-full accent-terminal-accent"
            />
          </div>

          {/* Blend Mode */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-terminal-muted">Blend Mode</span>
            <select
              value={activeLayer.blendMode}
              onChange={e => onUpdateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono"
            >
              {BLEND_MODES.map(m => (
                <option key={m} value={m}>{BLEND_LABELS[m]}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
