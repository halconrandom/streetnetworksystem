import React from 'react';
import { Copy, Trash2, Layers } from '../../components/Icons';
import type { CacheItem, ChatLine, EditorSettings, FitMode, OverlayImage, TextBlock } from './types';
import { colorWithAlpha, getReadableTextColor, normalizeHexInput } from './utils';
import { LayersPanel } from './LayersPanel';

type RightColumnProps = {
  settings: EditorSettings;
  onSettingsChange: (update: Partial<EditorSettings>) => void;
  colorPicker: string;
  onColorPickerChange: (value: string) => void;
  colorAlpha: number;
  onColorAlphaChange: (value: number) => void;
  selectedTemplateColor: string | null;
  onSelectTemplateColor: (value: string) => void;
  rawTextFile: string;
  onRawTextChange: (value: string) => void;
  onRemoveTimestamps: () => void;
  onApplyChatLines: () => void;
  lines: ChatLine[];
  onUpdateLine: (id: string, update: Partial<ChatLine>) => void;
  onRemoveLine: (id: string) => void;
  cacheItems: CacheItem[];
  onLoadCache: (item: CacheItem) => void;
  onRemoveCache: (id: string) => void;
  textBlocks: TextBlock[];
  overlays: OverlayImage[];
  layerOrder: string[];
  activeBlockId: string | null;
  onSelectLayer: (id: string, type: 'text' | 'overlay') => void;
  onMoveLayer: (dragIndex: number, hoverIndex: number) => void;
  onToggleVisible: (id: string, type: 'text' | 'overlay') => void;
  onToggleLock: (id: string, type: 'text' | 'overlay') => void;
};

export const RightColumn: React.FC<RightColumnProps> = ({
  settings,
  onSettingsChange,
  colorPicker,
  onColorPickerChange,
  colorAlpha,
  onColorAlphaChange,
  selectedTemplateColor,
  onSelectTemplateColor,
  rawTextFile,
  onRawTextChange,
  onRemoveTimestamps,
  onApplyChatLines,
  lines,
  onUpdateLine,
  onRemoveLine,
  cacheItems,
  onLoadCache,
  onRemoveCache,
  textBlocks,
  overlays,
  layerOrder,
  activeBlockId,
  onSelectLayer,
  onMoveLayer,
  onToggleVisible,
  onToggleLock,
}) => {
  return (
    <div className="space-y-6 min-h-0">
      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-4">
        <div className="text-white font-semibold flex items-center gap-2">
          <Layers size={18} className="text-terminal-accent" />
          Layers
        </div>
        <LayersPanel
          textBlocks={textBlocks}
          overlays={overlays}
          layerOrder={layerOrder || []}
          activeBlockId={activeBlockId}
          onSelectLayer={onSelectLayer}
          onMoveLayer={onMoveLayer}
          onToggleVisible={onToggleVisible}
          onToggleLock={onToggleLock}
        />
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-4">
        <div className="text-white font-semibold">Output Settings</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2">
            Width
            <input
              type="number"
              value={settings.width}
              min={320}
              max={3840}
              onChange={(event) => onSettingsChange({ width: Number(event.target.value) })}
              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2">
            Height
            <input
              type="number"
              value={settings.height}
              min={320}
              max={2160}
              onChange={(event) => onSettingsChange({ height: Number(event.target.value) })}
              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 col-span-2">
            Fit Mode
            <select
              value={settings.fitMode}
              onChange={(event) => onSettingsChange({ fitMode: event.target.value as FitMode })}
              className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="stretch">Stretch</option>
              <option value="crop">Crop</option>
            </select>
          </label>
          {settings.fitMode === 'crop' && (
            <>
              <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 col-span-2">
                Image Zoom
                <input
                  type="range"
                  min={0.2}
                  max={5}
                  step={0.05}
                  value={settings.imageScale}
                  onChange={(event) => onSettingsChange({ imageScale: Number(event.target.value) })}
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2">
                Image X
                <input
                  type="number"
                  value={settings.imageOffsetX}
                  onChange={(event) => onSettingsChange({ imageOffsetX: Number(event.target.value) })}
                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                />
              </label>
              <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2">
                Image Y
                <input
                  type="number"
                  value={settings.imageOffsetY}
                  onChange={(event) => onSettingsChange({ imageOffsetY: Number(event.target.value) })}
                  className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
                />
              </label>
            </>
          )}
        </div>
        <div className="pt-3 border-t border-terminal-border/70">
          <div className="text-xs uppercase tracking-wide text-terminal-muted mb-2">Presets</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '800 × 600', width: 800, height: 600 },
              { label: '1280 × 720', width: 1280, height: 720 },
              { label: '1920 × 1080', width: 1920, height: 1080 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => onSettingsChange({ width: preset.width, height: preset.height })}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-white rounded-md shadow-[0_0_12px_rgba(0,0,0,0.35)] hover:border-terminal-accent/60 hover:text-terminal-accent transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
        <div className="text-white font-semibold">Color Helper</div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <input
              type="color"
              value={colorPicker}
              onChange={(event) => onColorPickerChange(event.target.value)}
              className="h-12 w-12 rounded bg-transparent border border-terminal-border"
            />
            <input
              value={colorPicker}
              onChange={(event) => onColorPickerChange(normalizeHexInput(event.target.value))}
              placeholder="#ffffff"
              className="w-24 bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs font-mono text-center"
            />
          </div>
          <label className="text-xs uppercase tracking-wide text-terminal-muted flex flex-col gap-2 flex-1">
            Alpha
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={colorAlpha}
              onChange={(event) => onColorAlphaChange(Number(event.target.value))}
            />
          </label>
          <button
            onClick={() => {
              if (!navigator.clipboard) return;
              navigator.clipboard.writeText(`(${colorWithAlpha(colorPicker, colorAlpha)})`);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            <Copy size={14} />
            Copy Color
          </button>
        </div>
        <div className="text-xs text-terminal-muted">
          Copies <span className="text-white">({colorWithAlpha(colorPicker, colorAlpha)})</span> for prefixing a line.
        </div>
        <div className="pt-2 border-t border-terminal-border/70">
          <div className="text-white font-semibold mb-2">Chat Color Template</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Distant/Low Text', value: '#7d7d7d' },
              { label: 'Action - /me', value: '#bd9dd4' },
              { label: 'Scenario - /do', value: '#8fbe2e' },
              { label: 'Thinking', value: '#24b2cf' },
              { label: 'Calls', value: '#b4b401' },
              { label: 'Car Whisper', value: '#a59900' },
            ].map((item) => {
              const foreground = getReadableTextColor(item.value);
              const isActive = selectedTemplateColor === item.value;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (!navigator.clipboard) return;
                    navigator.clipboard.writeText(`(${item.value})`);
                    onSelectTemplateColor(item.value);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold border rounded-md transition-colors ${isActive
                    ? 'border-terminal-accent text-white bg-terminal-dark'
                    : 'border-terminal-border text-terminal-muted bg-terminal-dark/70 hover:text-white'
                    }`}
                  style={{
                    borderLeftColor: item.value,
                    borderLeftWidth: '4px',
                  }}
                >
                  <span className="text-left">{item.label}</span>
                  <span className="font-mono text-[11px] opacity-80" style={{ color: foreground }}>
                    {item.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold">Text File Preview</div>
          <button
            onClick={onRemoveTimestamps}
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            Remove Timestamps
          </button>
        </div>
        <textarea
          value={rawTextFile}
          onChange={(event) => onRawTextChange(event.target.value)}
          rows={12}
          className="w-full bg-terminal-dark text-sm text-white border border-terminal-border rounded-md p-3 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onApplyChatLines}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30 rounded-md"
          >
            Apply to Chat Lines
          </button>
        </div>
      </div>

      <details className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
        <summary className="text-white font-semibold cursor-pointer select-none">
          Chat Lines ({lines.length}) - Click to open
        </summary>
        <div className="space-y-3 max-h-80 overflow-auto pr-1 mt-4">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={line.enabled}
                onChange={(event) => onUpdateLine(line.id, { enabled: event.target.checked })}
              />
              <input
                value={line.text}
                onChange={(event) => onUpdateLine(line.id, { text: event.target.value })}
                className="flex-1 bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
              />
              <input
                value={line.color}
                onChange={(event) => onUpdateLine(line.id, { color: event.target.value })}
                className="w-24 bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-white text-xs"
              />
              <button
                onClick={() => onRemoveLine(line.id)}
                className="text-terminal-muted hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </details>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
        <div className="text-white font-semibold">Cache</div>
        {cacheItems.length === 0 ? (
          <div className="text-xs text-terminal-muted">No cached edits yet.</div>
        ) : (
          <div className="space-y-2">
            {cacheItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs text-terminal-muted border border-terminal-border rounded px-2 py-2">
                <div>
                  <div className="text-white">{item.name}</div>
                  <div>{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadCache(item)}
                    className="px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onRemoveCache(item.id)}
                    className="text-terminal-muted hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
