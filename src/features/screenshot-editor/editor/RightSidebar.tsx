import React from 'react';
import {
    Layers,
    Settings as SettingsIcon,
    Palette,
    MessageSquare,
    Clock,
    Trash2,
    Copy,
    Activity,
    Plus,
    GripVertical,
    ChevronDown,
    ChevronRight
} from '@/components/Icons';
import { useState } from 'react';
import type { CacheItem, ChatLine, EditorSettings, FitMode, OverlayImage, TextBlock } from './types';
import { colorWithAlpha, normalizeHexInput } from './utils';
import { LayersPanel } from './LayersPanel';

type RightSidebarProps = {
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
    onApplyColor: (color: string) => void;
    visiblePanels: Record<string, boolean>;
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
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
    onApplyColor,
    visiblePanels,
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        layers: true,
        canvas: true,
        colors: true,
        logs: false,
        filters: false,
        history: false
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const SectionHeader = ({ id, label, icon: Icon, extra }: { id: string, label: string, icon?: any, extra?: React.ReactNode }) => (
        <div
            className="flex items-center justify-between cursor-pointer group/header select-none"
            onClick={() => toggleSection(id)}
        >
            <div className="flex items-center gap-2">
                <div className={`w-1 h-3.5 bg-[#FF3B3B] rounded-full transition-all ${expandedSections[id] ? 'opacity-100' : 'opacity-30'}`} />
                <h3 className="text-[10px] uppercase font-black tracking-widest text-white/50 group-hover/header:text-white transition-colors flex items-center gap-2">
                    {Icon && <Icon size={12} className="text-white/20" />}
                    {label}
                </h3>
            </div>
            <div className="flex items-center gap-3">
                {extra}
                <div className={`text-white/10 group-hover/header:text-white/40 transition-all transform ${expandedSections[id] ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-[340px] h-full flex flex-col bg-[#121316] border-l border-white/5 overflow-hidden animate-fade-in">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                {/* LAYERS & DEPTH */}
                <section className="space-y-4">
                    <SectionHeader id="layers" label="Layers & Depth" icon={Layers} />
                    {expandedSections.layers && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 animate-fade-in">
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
                </section>

                {/* CANVAS CONFIGURATION */}
                <section className="space-y-4">
                    <SectionHeader id="canvas" label="Canvas Setup" icon={SettingsIcon} />
                    {expandedSections.canvas && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 ml-1">Width</label>
                                    <input
                                        type="number"
                                        value={settings.width}
                                        onChange={(e) => onSettingsChange({ width: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[12px] text-white focus:border-[#FF3B3B]/30 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 ml-1">Height</label>
                                    <input
                                        type="number"
                                        value={settings.height}
                                        onChange={(e) => onSettingsChange({ height: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[12px] text-white focus:border-[#FF3B3B]/30 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-white/20 ml-1">Image Fit</label>
                                <div className="relative">
                                    <select
                                        value={settings.fitMode}
                                        onChange={(e) => onSettingsChange({ fitMode: e.target.value as FitMode })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[12px] text-white/70 appearance-none focus:border-[#FF3B3B]/30 outline-none transition-all"
                                    >
                                        <option value="contain">Contain (Keep Ratio)</option>
                                        <option value="cover">Cover (Fill Space)</option>
                                        <option value="stretch">Stretch (Distort)</option>
                                        <option value="crop">Manual Transform</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                </div>
                            </div>

                            {settings.fitMode === 'crop' && (
                                <div className="pt-4 space-y-4 animate-fade-in border-t border-white/5 mt-4">
                                    <div className="text-[9px] uppercase font-bold tracking-widest text-white/20 ml-1">Background Transform</div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] uppercase font-bold text-white/20">Scale</span>
                                                <span className="text-[10px] font-mono text-[#FF3B3B]">{settings.imageScale.toFixed(2)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0.1}
                                                max={5}
                                                step={0.05}
                                                value={settings.imageScale}
                                                onChange={(e) => onSettingsChange({ imageScale: Number(e.target.value) })}
                                                onMouseUp={onCommitHistory}
                                                className="w-full accent-[#FF3B3B] h-1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] uppercase font-bold text-white/20">Rotation</span>
                                                <span className="text-[10px] font-mono text-[#FF3B3B]">{settings.imageRotation}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={-180}
                                                max={180}
                                                step={1}
                                                value={settings.imageRotation}
                                                onChange={(e) => onSettingsChange({ imageRotation: Number(e.target.value) })}
                                                onMouseUp={onCommitHistory}
                                                className="w-full accent-[#FF3B3B] h-1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold tracking-widest text-white/15 ml-1">Offset X</label>
                                                <input
                                                    type="number"
                                                    value={settings.imageOffsetX}
                                                    onChange={(e) => onSettingsChange({ imageOffsetX: Number(e.target.value) })}
                                                    onBlur={onCommitHistory}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold tracking-widest text-white/15 ml-1">Offset Y</label>
                                                <input
                                                    type="number"
                                                    value={settings.imageOffsetY}
                                                    onChange={(e) => onSettingsChange({ imageOffsetY: Number(e.target.value) })}
                                                    onBlur={onCommitHistory}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <div className="text-[9px] uppercase font-bold tracking-widest text-white/15 mb-2 ml-1">Popular Presets</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'SD', w: 800, h: 600, tip: '800x600' },
                                        { label: 'HD', w: 1280, h: 720, tip: '720p' },
                                        { label: 'FHD', w: 1920, h: 1080, tip: '1080p' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={(e) => { e.stopPropagation(); onSettingsChange({ width: preset.w, height: preset.h }); }}
                                            className="flex flex-col items-center gap-0.5 py-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                                        >
                                            <span className="text-[9px] font-black text-white/40 group-hover:text-white transition-colors">{preset.label}</span>
                                            <span className="text-[7px] font-mono text-white/10">({preset.w}×{preset.h})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* COLOR PALETTE */}
                <section className="space-y-4">
                    <SectionHeader id="colors" label="Vibe & Palette" icon={Palette} />
                    {expandedSections.colors && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <input
                                        type="color"
                                        value={colorPicker}
                                        onChange={(e) => onColorPickerChange(e.target.value)}
                                        className="w-14 h-14 bg-black border border-white/10 rounded-2xl cursor-pointer p-1"
                                    />
                                    <div className="absolute inset-0 rounded-2xl border-2 border-white/5 pointer-events-none" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="text-[9px] uppercase font-bold tracking-widest text-white/20 ml-1">Global Opacity</div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={colorAlpha}
                                        onChange={(e) => onColorAlphaChange(Number(e.target.value))}
                                        className="w-full accent-[#FF3B3B] h-1.5"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={colorPicker}
                                    onChange={(e) => onColorPickerChange(normalizeHexInput(e.target.value))}
                                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[12px] text-white font-mono focus:border-[#FF3B3B]/30 outline-none"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(colorPicker); }}
                                    className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                                    title="Copy HEX"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApplyColor(colorPicker);
                                    }}
                                    className="flex-1 py-2 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-xl text-[#FF3B3B] text-[9px] font-black uppercase tracking-widest hover:bg-[#FF3B3B] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                    title="Apply color to selected text in active unit"
                                >
                                    <Palette size={12} />
                                    Apply
                                </button>
                            </div>

                            <div className="pt-2">
                                <div className="text-[9px] uppercase font-bold tracking-widest text-white/15 mb-3 ml-1">Quick Presets</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Distant', val: '#7d7d7d' },
                                        { label: 'Action', val: '#bd9dd4' },
                                        { label: 'Scenario', val: '#8fbe2e' },
                                        { label: 'Thinking', val: '#24b2cf' },
                                        { label: 'Calls', val: '#b4b401' },
                                        { label: 'Whisper', val: '#a59900' },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={(e) => { e.stopPropagation(); onColorPickerChange(item.val); }}
                                            className="flex items-center gap-2 p-2 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group"
                                        >
                                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.val, color: item.val }} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 group-hover:text-white/60 transition-colors">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* LOG ANALYSIS */}
                <section className="space-y-4">
                    <SectionHeader
                        id="logs"
                        label="Log Analysis"
                        icon={MessageSquare}
                        extra={
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemoveTimestamps(); }}
                                className="px-2 py-1 bg-white/[0.05] text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/10 rounded-md transition-all border border-white/5"
                            >
                                Strip Times
                            </button>
                        }
                    />
                    {expandedSections.logs && (
                        <div className="space-y-4 animate-fade-in">
                            <textarea
                                value={rawTextFile}
                                onChange={(e) => onRawTextChange(e.target.value)}
                                placeholder="Paste your raw logs here..."
                                rows={6}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-white/50 font-mono leading-relaxed outline-none focus:border-[#FF3B3B]/20 transition-all custom-scrollbar resize-none"
                            />
                            <button
                                onClick={onApplyChatLines}
                                className="w-full py-3.5 bg-[#FF3B3B] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                            >
                                Extract Lines from Log
                            </button>

                            {/* PROCESSED STREAM (Inline) */}
                            {lines.length > 0 && (
                                <div className="pt-4 space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/15">Processed Stream</span>
                                        <span className="text-[9px] font-mono text-[#FF3B3B] font-bold">{lines.length} Lines</span>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {lines.map((line) => (
                                            <div key={line.id} className="flex items-start gap-3 p-2 bg-white/[0.01] border border-white/5 rounded-xl group transition-all hover:bg-white/[0.02]">
                                                <input
                                                    type="checkbox"
                                                    checked={line.enabled}
                                                    onChange={(e) => onUpdateLine(line.id, { enabled: e.target.checked })}
                                                    className="mt-1 accent-[#FF3B3B] h-3.5 w-3.5 rounded border-white/10"
                                                />
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <textarea
                                                        value={line.text}
                                                        onChange={(e) => onUpdateLine(line.id, { text: e.target.value })}
                                                        rows={1}
                                                        className="w-full bg-transparent text-[11px] text-white/70 font-mono leading-relaxed outline-none border-none resize-none custom-scrollbar"
                                                    />
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                                                            <input
                                                                value={line.color}
                                                                onChange={(e) => onUpdateLine(line.id, { color: e.target.value })}
                                                                className="bg-transparent border-none p-0 text-[10px] font-mono text-white/15 focus:text-white/40 outline-none w-full"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveLine(line.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-white/10 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* IMAGE FILTERS */}
                <section className="space-y-4">
                    <SectionHeader id="filters" label="Post-Processing" icon={Activity} />
                    {expandedSections.filters && (
                        <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5 animate-fade-in">
                            {[
                                { label: 'Brightness', key: 'brightness', min: 0, max: 200, unit: '%' },
                                { label: 'Contrast', key: 'contrast', min: 0, max: 200, unit: '%' },
                                { label: 'Saturation', key: 'saturate', min: 0, max: 200, unit: '%' },
                                { label: 'Sepia', key: 'sepia', min: 0, max: 100, unit: '%' },
                                { label: 'Vignette', key: 'vignette', min: 0, max: 1, step: 0.05, unit: '' },
                            ].map((filter) => (
                                <div key={filter.key} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] uppercase font-bold text-white/20 tracking-wider">{filter.label}</span>
                                        <span className="text-[10px] font-mono text-[#FF3B3B]">
                                            {(settings.filters as any)[filter.key]}{filter.unit}
                                        </span>
                                    </div>
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
                                        className="w-full accent-[#FF3B3B] h-1"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSettingsChange({
                                        filters: { brightness: 100, contrast: 100, saturate: 100, sepia: 0, vignette: 0 }
                                    });
                                    onCommitHistory();
                                }}
                                className="w-full py-2.5 mt-2 bg-white/5 text-white/20 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                            >
                                Reset Defaults
                            </button>
                        </div>
                    )}
                </section>

                {/* HISTORY & CACHE */}
                <section className="space-y-4">
                    <SectionHeader id="history" label="Save Points" icon={Clock} />
                    {expandedSections.history && (
                        <div className="space-y-3 animate-fade-in">
                            {cacheItems.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                                    <Clock size={24} className="mx-auto text-white/5 mb-2" />
                                    <span className="text-[10px] text-white/15 uppercase font-bold tracking-widest">No Save Points</span>
                                </div>
                            ) : (
                                cacheItems.map((item) => (
                                    <div key={item.id} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                                        <div className="min-w-0 pr-4">
                                            <div className="text-[11px] font-bold text-white/70 truncate group-hover:text-white transition-colors">{item.name}</div>
                                            <div className="text-[8px] text-white/15 mt-1 font-mono uppercase tracking-tighter">{new Date(item.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onLoadCache(item); }}
                                                className="px-3 py-1.5 bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#FF3B3B] hover:text-white transition-all"
                                            >
                                                Load
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveCache(item.id); }}
                                                className="p-2 text-white/10 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
};
