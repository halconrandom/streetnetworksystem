import React from 'react';
import type { Selection, ShapeType, ToolOptions, ToolType } from '../types';

type Props = {
  activeTool: ToolType;
  toolOptions: ToolOptions;
  selection: Selection;
  onUpdateOptions: (opts: Partial<ToolOptions>) => void;
  onCropToSelection: () => void;
  onCopySelection: () => void;
  onClearSelection: () => void;
};

const SHAPE_TYPES: { id: ShapeType; label: string }[] = [
  { id: 'rect', label: 'Rect' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'triangle', label: 'Triangle' },
];

const BLEND_MODES: string[] = [
  'source-over', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion',
];

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">{children}</span>
);

const Divider = () => <div className="w-px h-5 bg-white/10 mx-2" />;

export const OptionsBar: React.FC<Props> = ({
  activeTool, toolOptions, selection,
  onUpdateOptions, onCropToSelection, onCopySelection, onClearSelection,
}) => {
  return (
    <div className="h-10 bg-[#0d0d0d] border-b border-white/5 flex items-center px-4 gap-3 shrink-0 overflow-x-auto">

      {activeTool === 'brush' && (
        <>
          <Label>Color</Label>
          <input
            type="color"
            value={toolOptions.brushColor}
            onChange={e => onUpdateOptions({ brushColor: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-white/10 bg-transparent"
            style={{ padding: '1px' }}
          />
          <Divider />
          <Label>Size</Label>
          <input
            type="range" min={1} max={200} value={toolOptions.brushSize}
            onChange={e => onUpdateOptions({ brushSize: Number(e.target.value) })}
            className="w-24 accent-terminal-accent"
          />
          <span className="text-[11px] text-white/50 font-mono w-8">{toolOptions.brushSize}px</span>
          <Divider />
          <Label>Opacity</Label>
          <input
            type="range" min={1} max={100} value={Math.round(toolOptions.brushOpacity * 100)}
            onChange={e => onUpdateOptions({ brushOpacity: Number(e.target.value) / 100 })}
            className="w-20 accent-terminal-accent"
          />
          <span className="text-[11px] text-white/50 font-mono w-9">{Math.round(toolOptions.brushOpacity * 100)}%</span>
        </>
      )}

      {activeTool === 'shape' && (
        <>
          {SHAPE_TYPES.map(s => (
            <button
              key={s.id}
              onClick={() => onUpdateOptions({ shapeSubType: s.id })}
              className={`px-2 py-1 text-[11px] font-mono rounded border transition-all ${
                toolOptions.shapeSubType === s.id
                  ? 'bg-terminal-accent/20 text-terminal-accent border-terminal-accent/40'
                  : 'text-terminal-muted hover:text-white border-transparent hover:border-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
          <Divider />
          <Label>Fill</Label>
          <input
            type="checkbox"
            checked={toolOptions.shapeFillEnabled}
            onChange={e => onUpdateOptions({ shapeFillEnabled: e.target.checked })}
            className="accent-terminal-accent"
          />
          <input
            type="color"
            value={toolOptions.shapeFill}
            onChange={e => onUpdateOptions({ shapeFill: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-white/10 bg-transparent"
            style={{ padding: '1px' }}
            disabled={!toolOptions.shapeFillEnabled}
          />
          <Divider />
          <Label>Stroke</Label>
          <input
            type="checkbox"
            checked={toolOptions.shapeStrokeEnabled}
            onChange={e => onUpdateOptions({ shapeStrokeEnabled: e.target.checked })}
            className="accent-terminal-accent"
          />
          <input
            type="color"
            value={toolOptions.shapeStroke}
            onChange={e => onUpdateOptions({ shapeStroke: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-white/10 bg-transparent"
            style={{ padding: '1px' }}
            disabled={!toolOptions.shapeStrokeEnabled}
          />
          <input
            type="range" min={1} max={20} value={toolOptions.shapeStrokeWidth}
            onChange={e => onUpdateOptions({ shapeStrokeWidth: Number(e.target.value) })}
            className="w-16 accent-terminal-accent"
            disabled={!toolOptions.shapeStrokeEnabled}
          />
          <span className="text-[11px] text-white/50 font-mono w-6">{toolOptions.shapeStrokeWidth}</span>
        </>
      )}

      {activeTool === 'marquee' && (
        <>
          {selection ? (
            <>
              <span className="text-[11px] text-terminal-muted font-mono">
                {selection.type === 'rect' ? `${Math.round(selection.width)} × ${Math.round(selection.height)}` : 'Lasso'}
              </span>
              <Divider />
              <button
                onClick={onCropToSelection}
                className="px-3 py-1 text-[11px] font-mono bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 rounded hover:bg-terminal-accent/20 transition-all"
              >
                Crop
              </button>
              <button
                onClick={onCopySelection}
                className="px-3 py-1 text-[11px] font-mono bg-white/5 text-white/70 border border-white/10 rounded hover:bg-white/10 transition-all"
              >
                Copy as Layer
              </button>
              <button
                onClick={onClearSelection}
                className="px-3 py-1 text-[11px] font-mono text-terminal-muted border border-transparent rounded hover:text-white hover:border-white/10 transition-all"
              >
                Deselect
              </button>
            </>
          ) : (
            <span className="text-[11px] text-terminal-muted/50 font-mono">Drag to select a region</span>
          )}
        </>
      )}

      {activeTool === 'text' && (
        <>
          <Label>Font</Label>
          <select
            value={toolOptions.textFontFamily}
            onChange={e => onUpdateOptions({ textFontFamily: e.target.value })}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[11px] text-white font-mono"
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Impact, sans-serif">Impact</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
          <Divider />
          <Label>Size</Label>
          <input
            type="number" min={8} max={300} value={toolOptions.textFontSize}
            onChange={e => onUpdateOptions({ textFontSize: Number(e.target.value) })}
            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[11px] text-white font-mono"
          />
          <Divider />
          <Label>Color</Label>
          <input
            type="color"
            value={toolOptions.textColor}
            onChange={e => onUpdateOptions({ textColor: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-white/10 bg-transparent"
            style={{ padding: '1px' }}
          />
        </>
      )}

      {activeTool === 'select' && (
        <span className="text-[11px] text-terminal-muted/40 font-mono">Click a layer to select · Drag to move</span>
      )}
    </div>
  );
};
