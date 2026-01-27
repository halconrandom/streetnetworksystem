import React from 'react';
import { Copy, Trash2, Layers, Palette, MessageSquare, Settings as SettingsIcon, Clock, Plus } from '../../components/Icons';
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
  onCommitHistory: () => void;
  visiblePanels: Record<string, boolean>;
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
  onCommitHistory,
  visiblePanels,
}) => {
  return (
    <div className="space-y-6 min-h-0 pr-1 pb-10">
      {/* Layers Panel Module */}
      {visiblePanels.layers && (
        <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl animate-fade-in-up">
          <div className="text-white font-semibold flex items-center gap-2">
            <Layers size={18} className="text-terminal-accent" />
            Layers & Depth
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
      )}

      {/* Canvas Configuration Module */}
      {visiblePanels.canvas && (
        <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl animate-fade-in-up">
          <div className="text-white font-semibold flex items-center gap-2">
            <SettingsIcon size={18} className="text-terminal-accent" />
            Canvas Configuration
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/20 flex flex-col gap-2">
              Resolution Width
              <input
                type="number"
                value={settings.width}
                min={320}
                max={3840}
                onChange={(event) => onSettingsChange({ width: Number(event.target.value) })}
                className="bg-black/40 border border-white/5 rounded-xl px-2.5 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none transition-all"
              />
            </label>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/20 flex flex-col gap-2">
              Resolution Height
              <input
                type="number"
                value={settings.height}
                min={320}
                max={2160}
                onChange={(event) => onSettingsChange({ height: Number(event.target.value) })}
                className="bg-black/40 border border-white/5 rounded-xl px-2.5 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none transition-all"
              />
            </label>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/20 flex flex-col gap-2 col-span-2">
              Image Fit Strategy
              <select
                value={settings.fitMode}
                onChange={(event) => {
                  onSettingsChange({ fitMode: event.target.value as FitMode });
                }}
                className="bg-black/40 border border-white/5 rounded-xl px-2.5 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none transition-all"
              >
                <option value="contain">Contain (Keep Ratio)</option>
                <option value="cover">Cover (Fill Space)</option>
                <option value="stretch">Stretch (Distort)</option>
                <option value="crop">Manual Crop</option>
              </select>
            </label>

            {settings.fitMode === 'crop' && (
              <div className="col-span-2 space-y-4 pt-3 border-t border-white/5 animate-fade-in">
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/30">Background Transform</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 flex justify-between items-center">
                      Scale
                      <span className="text-[10px] font-mono text-terminal-accent">{settings.imageScale.toFixed(2)}x</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0.1}
                        max={10}
                        step={0.05}
                        value={settings.imageScale}
                        onChange={(e) => onSettingsChange({ imageScale: Number(e.target.value) })}
                        onMouseUp={onCommitHistory}
                        className="flex-1 accent-terminal-accent h-1"
                      />
                      <input
                        type="number"
                        step={0.05}
                        value={settings.imageScale}
                        onChange={(e) => onSettingsChange({ imageScale: Number(e.target.value) })}
                        onBlur={onCommitHistory}
                        className="w-16 bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-white text-[10px] text-center font-mono outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 flex justify-between items-center">
                      Rotation
                      <span className="text-[10px] font-mono text-terminal-accent">{settings.imageRotation}°</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={settings.imageRotation}
                        onChange={(e) => onSettingsChange({ imageRotation: Number(e.target.value) })}
                        onMouseUp={onCommitHistory}
                        className="flex-1 accent-terminal-accent h-1"
                      />
                      <input
                        type="number"
                        value={settings.imageRotation}
                        onChange={(e) => onSettingsChange({ imageRotation: Number(e.target.value) })}
                        onBlur={onCommitHistory}
                        className="w-16 bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-white text-[10px] text-center font-mono outline-none"
                      />
                    </div>
                  </div>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 flex flex-col gap-1.5">
                    Offset X
                    <input
                      type="number"
                      value={settings.imageOffsetX}
                      onChange={(e) => onSettingsChange({ imageOffsetX: Number(e.target.value) })}
                      onBlur={onCommitHistory}
                      className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:border-terminal-accent/30 outline-none font-mono"
                    />
                  </label>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 flex flex-col gap-1.5">
                    Offset Y
                    <input
                      type="number"
                      value={settings.imageOffsetY}
                      onChange={(e) => onSettingsChange({ imageOffsetY: Number(e.target.value) })}
                      onBlur={onCommitHistory}
                      className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:border-terminal-accent/30 outline-none font-mono"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5">
            <div className="text-[9px] uppercase font-bold tracking-widest text-white/20 mb-2">Popular Presets</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'SD (800x600)', width: 800, height: 600 },
                { label: 'HD (720p)', width: 1280, height: 720 },
                { label: 'FHD (1080p)', width: 1920, height: 1080 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onSettingsChange({ width: preset.width, height: preset.height })}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Palette Module */}
      {visiblePanels.colors && (
        <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl animate-fade-in-up">
          <div className="text-white font-semibold flex items-center gap-2">
            <Palette size={18} className="text-terminal-accent" />
            Color Palette Toolkit
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <input
                  type="color"
                  value={colorPicker}
                  onChange={(event) => onColorPickerChange(event.target.value)}
                  className="h-14 w-14 rounded-2xl bg-black border border-white/10 cursor-pointer p-1"
                />
                <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-white/10 group-hover:border-white/20 transition-all shadow-inner" />
              </div>
              <input
                value={colorPicker}
                onChange={(event) => onColorPickerChange(normalizeHexInput(event.target.value))}
                placeholder="#ffffff"
                className="w-24 bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-white text-[11px] font-mono text-center outline-none focus:border-white/20"
              />
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/20 flex flex-col gap-2">
                Global Color Opacity
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={colorAlpha}
                  onChange={(event) => onColorAlphaChange(Number(event.target.value))}
                  className="accent-terminal-accent h-1.5"
                />
              </label>
              <button
                onClick={() => {
                  if (!navigator.clipboard) return;
                  navigator.clipboard.writeText(`(${colorWithAlpha(colorPicker, colorAlpha)})`);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 shadow-lg"
              >
                <Copy size={12} />
                Copy Format
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-3">Color Quick Presets</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Distant', value: '#7d7d7d' },
                { label: 'Action', value: '#bd9dd4' },
                { label: 'Scenario', value: '#8fbe2e' },
                { label: 'Thinking', value: '#24b2cf' },
                { label: 'Calls', value: '#b4b401' },
                { label: 'Whisper', value: '#a59900' },
              ].map((item) => {
                const isActive = selectedTemplateColor === item.value;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (!navigator.clipboard) return;
                      navigator.clipboard.writeText(`(${item.value})`);
                      onSelectTemplateColor(item.value);
                    }}
                    className={`group relative overflow-hidden flex flex-col items-start gap-1 p-3 rounded-xl border transition-all duration-300 transform hover:-translate-y-1 active:scale-95 ${isActive
                      ? 'border-terminal-accent/50 bg-terminal-dark/80 shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)]'
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10'
                      }`}
                    style={{
                      boxShadow: isActive ? `0 0 20px ${item.value}40` : 'none'
                    } as React.CSSProperties}
                  >
                    <div
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${item.value} 0%, transparent 100%)` }}
                    />
                    <div
                      className="h-1 w-8 rounded-full mb-1 transition-all group-hover:w-12"
                      style={{
                        background: `linear-gradient(90deg, ${item.value}, ${item.value}cc)`,
                        boxShadow: `0 0 10px ${item.value}aa`
                      }}
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-terminal-muted group-hover:text-white/80'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content module (Raw Text & Lines List) */}
      {visiblePanels.content && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold flex items-center gap-2 text-sm">
                <MessageSquare size={18} className="text-terminal-accent" />
                Log Analysis
              </div>
              <button
                onClick={onRemoveTimestamps}
                className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white rounded-lg transition-all"
              >
                Strip Times
              </button>
            </div>
            <textarea
              value={rawTextFile}
              onChange={(event) => onRawTextChange(event.target.value)}
              rows={8}
              className="w-full bg-black/40 text-[11px] text-white/80 border border-white/5 rounded-xl p-3 focus:border-terminal-accent/30 outline-none custom-scrollbar font-mono leading-relaxed"
              placeholder="Paste your raw logs here..."
            />
            <button
              onClick={onApplyChatLines}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-terminal-accent text-black text-[10px] font-extrabold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] active:scale-95"
            >
              Extract Lines from Log
            </button>
          </div>

          {/* List of processed chat lines */}
          <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 shadow-xl">
            <div className="text-white font-semibold mb-4 text-[10px] uppercase tracking-widest flex justify-between items-center opacity-40">
              Processed Stream
              <span className="px-2 py-0.5 rounded-full bg-terminal-accent/20 text-terminal-accent text-[9px] font-bold">
                {lines.length} LINES
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-auto pr-1 custom-scrollbar">
              {lines.map((line) => (
                <div key={line.id} className="flex items-start gap-3 group animate-fade-in">
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={(event) => onUpdateLine(line.id, { enabled: event.target.checked })}
                    className="mt-1 accent-terminal-accent h-3.5 w-3.5"
                  />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <textarea
                      value={line.text}
                      rows={1}
                      onChange={(event) => onUpdateLine(line.id, { text: event.target.value })}
                      className="bg-black/20 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:bg-black/40 transition-all outline-none resize-none"
                    />
                    <div className="flex items-center justify-between gap-4 px-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: line.color, color: line.color }} />
                        <input
                          value={line.color}
                          onChange={(event) => onUpdateLine(line.id, { color: event.target.value })}
                          className="bg-transparent border-none p-0 text-[10px] font-mono text-white/20 focus:text-white/60 outline-none w-full"
                        />
                      </div>
                      <button
                        onClick={() => onRemoveLine(line.id)}
                        className="text-white/10 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {lines.length === 0 && (
                <div className="text-center py-6 text-white/10 text-[10px] uppercase tracking-widest italic">
                  No lines processed yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Post-Process Module */}
      {visiblePanels.filters && (
        <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl animate-fade-in-up">
          <div className="text-white font-semibold flex items-center gap-2">
            <SettingsIcon size={18} className="text-terminal-accent" />
            Post-Processing & Filters
          </div>

          <div className="space-y-4">
            {[
              { label: 'Brightness', key: 'brightness', min: 0, max: 200, unit: '%' },
              { label: 'Contrast', key: 'contrast', min: 0, max: 200, unit: '%' },
              { label: 'Saturation', key: 'saturate', min: 0, max: 200, unit: '%' },
              { label: 'Sepia', key: 'sepia', min: 0, max: 100, unit: '%' },
              { label: 'Vignette', key: 'vignette', min: 0, max: 1, step: 0.05, unit: 'p' },
            ].map((filter) => (
              <div key={filter.key} className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 flex justify-between items-center">
                  {filter.label}
                  <span className="text-[10px] font-mono text-terminal-accent">
                    {(settings.filters as any)[filter.key]}{filter.unit === 'p' ? '' : filter.unit}
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    step={(filter as any).step || 1}
                    value={(settings.filters as any)[filter.key]}
                    onChange={(e) => onSettingsChange({
                      filters: { ...settings.filters, [filter.key]: Number(e.target.value) }
                    })}
                    onMouseUp={onCommitHistory}
                    className="flex-1 accent-terminal-accent h-1"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                onSettingsChange({
                  filters: {
                    brightness: 100,
                    contrast: 100,
                    saturate: 100,
                    sepia: 0,
                    vignette: 0
                  }
                });
                onCommitHistory();
              }}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Snapshot / History Module */}
      {visiblePanels.history && (
        <div className="bg-terminal-panel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-white font-semibold flex items-center gap-2 text-sm">
            <Clock size={18} className="text-terminal-accent" />
            Save Points & History
          </div>
          {cacheItems.length === 0 ? (
            <div className="text-[10px] text-white/20 italic p-3 text-center border border-dashed border-white/5 rounded-xl">
              Your session history will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {cacheItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-[11px] text-white/40 border border-white/5 bg-black/20 rounded-xl px-3 py-3 group hover:bg-black/40 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="text-white/90 font-bold truncate group-hover:text-terminal-accent transition-colors">{item.name}</div>
                    <div className="text-[9px] opacity-30 mt-0.5">{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLoadCache(item)}
                      className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-terminal-accent hover:text-black hover:border-terminal-accent rounded-lg transition-all"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onRemoveCache(item.id)}
                      className="text-white/10 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
