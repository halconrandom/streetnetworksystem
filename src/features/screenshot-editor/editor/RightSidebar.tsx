import React from 'react';
import {
    Layers,
    Palette,
    MessageSquare,
    Clock,
    Trash2,
    Copy,
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
    onRenameCache: (id: string, name: string) => void;
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
    embedded?: boolean;
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
    onRenameCache,
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
    embedded = false,
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        layers: true,
        colors: true,
        logs: false,
        history: false
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const SectionHeader = ({ id, label, icon: Icon, extra }: { id: string, label: string, icon?: any, extra?: React.ReactNode }) => (
        <div
            className="flex items-center justify-between cursor-pointer group/header select-none border-b-2 border-black pb-2"
            onClick={() => toggleSection(id)}
        >
            <div className="flex items-center gap-2">
                <h3 className="text-[10px] uppercase font-black tracking-widest text-black flex items-center gap-2">
                    {Icon && <Icon size={12} className="text-slate-600" />}
                    {label}
                </h3>
            </div>
            <div className="flex items-center gap-3">
                {extra}
                <div className={`text-black transition-all transform ${expandedSections[id] ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>
    );

    const content = (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                {/* LAYERS & DEPTH */}
                <section className="space-y-4">
                    <SectionHeader id="layers" label="Image Layers" icon={Layers} />
                    {expandedSections.layers && (
                        <div className="bg-[#f4f1ea] border-2 border-black p-2 animate-fade-in">
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

                {/* COLOR PALETTE */}
                <section className="space-y-4">
                    <SectionHeader id="colors" label="Color Settings" icon={Palette} />
                    {expandedSections.colors && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <input
                                        type="color"
                                        value={colorPicker}
                                        onChange={(e) => onColorPickerChange(e.target.value)}
                                        className="w-14 h-14 bg-white border-2 border-black cursor-pointer p-1"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="text-[9px] uppercase font-bold tracking-widest text-slate-600 ml-1">Global Opacity</div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={colorAlpha}
                                        onChange={(e) => onColorAlphaChange(Number(e.target.value))}
                                        className="w-full accent-violet-500 h-1.5"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={colorPicker}
                                    onChange={(e) => onColorPickerChange(normalizeHexInput(e.target.value))}
                                    className="flex-1 border-2 border-black bg-white px-3 py-2 text-[12px] text-black font-mono outline-none focus:border-violet-500"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`(${colorPicker})`); }}
                                    className="p-2.5 border-2 border-black bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 text-black"
                                    title="Copy Tag (#HEX)"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApplyColor(colorPicker);
                                    }}
                                    className="flex-1 py-2 bg-violet-500 border-2 border-black shadow-[2px_2px_0px_#000] text-white text-[9px] font-black uppercase tracking-widest hover:bg-violet-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2"
                                    title="Apply color to selected text in active unit"
                                >
                                    <Palette size={12} />
                                    Apply
                                </button>
                            </div>

                            <div className="pt-2">
                                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-600 mb-3 ml-1">Quick Presets</div>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onColorPickerChange(item.val);
                                                navigator.clipboard.writeText(`(${item.val})`);
                                            }}
                                            className="flex items-center gap-2 p-2 bg-[#fdfbf7] border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                                            title={`Select & Copy (${item.val})`}
                                        >
                                            <div className="w-2 h-2" style={{ backgroundColor: item.val }} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-black">{item.label}</span>
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
                        label="Chat Logs"
                        icon={MessageSquare}
                        extra={
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemoveTimestamps(); }}
                                className="px-2 py-1 bg-white/[0.05] text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/10 rounded-md transition-all border border-white/5"
                            >
                                Remove Time
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
                                className="w-full border-2 border-black bg-white px-3 py-2 text-[11px] text-black font-mono leading-relaxed outline-none focus:border-violet-500 transition-all custom-scrollbar resize-none"
                            />
                            <button
                                onClick={onApplyChatLines}
                                className="w-full py-3.5 bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-violet-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                            >
                                Import Text to Workspace
                            </button>

                            {/* PROCESSED STREAM (Inline) */}
                            {lines.length > 0 && (
                                <div className="pt-4 space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Prepared Text Lines</span>
                                        <span className="text-[9px] font-mono text-violet-500 font-bold">{lines.length} Lines</span>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {lines.map((line) => (
                                            <div key={line.id} className="flex items-start gap-3 p-2 bg-[#f4f1ea] border-2 border-black group transition-all hover:bg-[#e8e4db]">
                                                <input
                                                    type="checkbox"
                                                    checked={line.enabled}
                                                    onChange={(e) => onUpdateLine(line.id, { enabled: e.target.checked })}
                                                    className="mt-1 accent-violet-500 h-3.5 w-3.5"
                                                />
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <textarea
                                                        value={line.text}
                                                        onChange={(e) => onUpdateLine(line.id, { text: e.target.value })}
                                                        rows={1}
                                                        className="w-full bg-transparent text-[11px] text-black font-mono leading-relaxed outline-none border-none resize-none custom-scrollbar"
                                                    />
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <div className="w-2.5 h-2.5" style={{ backgroundColor: line.color }} />
                                                            <input
                                                                value={line.color}
                                                                onChange={(e) => onUpdateLine(line.id, { color: e.target.value })}
                                                                className="bg-transparent border-none p-0 text-[10px] font-mono text-slate-400 focus:text-black outline-none w-full"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveLine(line.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
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

                {/* HISTORY & CACHE */}
                <section className="space-y-4">
                    <SectionHeader id="history" label="Saved Drafts" icon={Clock} />
                    {expandedSections.history && (
                        <div className="space-y-3 animate-fade-in">
                            {cacheItems.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                                    <Clock size={24} className="mx-auto text-white/5 mb-2" />
                                    <span className="text-[10px] text-white/15 uppercase font-bold tracking-widest">No Saved Drafts</span>
                                </div>
                            ) : (
                                cacheItems.map((item) => (
                                    <div key={item.id} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                                        <div className="min-w-0 pr-4 flex-1">
                                            <input
                                                value={item.name}
                                                onChange={(e) => onRenameCache(item.id, e.target.value)}
                                                className="w-full bg-transparent border-none text-[11px] font-bold text-white/70 truncate focus:text-white transition-colors outline-none cursor-text p-0"
                                                placeholder="Punto de guardado..."
                                            />
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
    );

    if (embedded) {
        return <div className="h-full min-h-0 flex flex-col bg-transparent animate-fade-in">{content}</div>;
    }

    return (
        <div className="w-[340px] h-full flex flex-col bg-[#fdfbf7] border-l-2 border-black overflow-hidden animate-fade-in">
            {content}
        </div>
    );
};
