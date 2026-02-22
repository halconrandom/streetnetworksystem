import React, { useState } from 'react';
import {
    Image as ImageIcon,
    Type,
    Plus,
    Move,
    Layers,
    Settings,
    Palette,
    Clock,
    Trash2,
    FileText,
    UserPlus,
    Activity,
    ChevronDown,
    ChevronUp,
    Square,
    Shield,
    Filter,
    MousePointer2,
    Copy,
    MessageSquare
} from '@/components/Icons';
import { defaultTextSettings } from './constants';
import type { CacheItem, ChatLine, EditorSettings, FitMode, OverlayImage, TextBlock, TextBlockSettings } from './types';
import { LayersPanel } from './LayersPanel';
import { colorWithAlpha, normalizeHexInput } from './utils';

type UnifiedSidebarProps = {
    // Source
    onImageFile: (file: File) => void;
    onChatFile: (file: File) => void;
    overlays: OverlayImage[];
    onOverlayFile: (file: File) => void;
    onUpdateOverlay: (id: string, update: Partial<OverlayImage>) => void;
    onRemoveOverlay: (id: string) => void;
    // Characters
    nameInputs: { id: string; name: string }[];
    onAddNameInput: () => void;
    onRemoveNameInput: (id: string) => void;
    onUpdateNameInput: (id: string, name: string) => void;
    onAppendToBlock: (text: string) => void;
    // Text blocks
    textBlocks: TextBlock[];
    onUpdateBlock: (id: string, text: string) => void;
    onUpdateBlockSettings: (id: string, update: Partial<TextBlockSettings>) => void;
    onAddBlock: () => void;
    onRemoveBlock: (id: string) => void;
    onToggleBlockSettings: (id: string) => void;
    onToggleBlockCollapsed: (id: string) => void;
    onToggleBlockAdvanced: (id: string) => void;
    onSetActiveBlockId: (id: string) => void;
    activeBlockId: string | null;
    // Global Settings & Canvas
    settings: EditorSettings;
    onSettingsChange: (update: Partial<EditorSettings>) => void;
    // Colors
    colorPicker: string;
    onColorPickerChange: (value: string) => void;
    colorAlpha: number;
    onColorAlphaChange: (value: number) => void;
    selectedTemplateColor: string | null;
    onSelectTemplateColor: (value: string) => void;
    // Log Analysis
    rawTextFile: string;
    onRawTextChange: (value: string) => void;
    onRemoveTimestamps: () => void;
    onApplyChatLines: () => void;
    lines: ChatLine[];
    onUpdateLine: (id: string, update: Partial<ChatLine>) => void;
    onRemoveLine: (id: string) => void;
    // History/Cache
    cacheItems: CacheItem[];
    onLoadCache: (item: CacheItem) => void;
    onRemoveCache: (id: string) => void;
    // Layers Reordering
    layerOrder: string[];
    onSelectLayer: (id: string, type: 'text' | 'overlay') => void;
    onMoveLayer: (dragIndex: number, hoverIndex: number) => void;
    onToggleVisible: (id: string, type: 'text' | 'overlay') => void;
    onToggleLock: (id: string, type: 'text' | 'overlay') => void;
    // Global Actions
    width: number;
    height: number;
    onParseChat: () => void;
    onClearBlocks: () => void;
    onCommitHistory: () => void;
    // Tools/Panels
    activeTool: 'move' | 'redact';
    onSetTool: (tool: 'move' | 'redact') => void;
    visiblePanels: Record<string, boolean>;
    onTogglePanel: (id: string) => void;
    // Crop Tool
    activeCropOverlayId: string | null;
    onSetActiveCropOverlayId: (id: string | null) => void;
};

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
    onImageFile,
    onChatFile,
    overlays,
    onOverlayFile,
    onUpdateOverlay,
    onRemoveOverlay,
    nameInputs,
    onAddNameInput,
    onRemoveNameInput,
    onUpdateNameInput,
    onAppendToBlock,
    textBlocks,
    onUpdateBlock,
    onUpdateBlockSettings,
    onAddBlock,
    onRemoveBlock,
    onToggleBlockSettings,
    onToggleBlockCollapsed,
    onToggleBlockAdvanced,
    onSetActiveBlockId,
    activeBlockId,
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
    layerOrder,
    onSelectLayer,
    onMoveLayer,
    onToggleVisible,
    onToggleLock,
    width,
    height,
    onParseChat,
    onClearBlocks,
    onCommitHistory,
    activeTool,
    onSetTool,
    visiblePanels,
    onTogglePanel,
    activeCropOverlayId,
    onSetActiveCropOverlayId
}) => {
    const [imageFileName, setImageFileName] = useState('');
    const [chatFileName, setChatFileName] = useState('');

    // Local storage for saved names (dropdown list)
    const savedNames: string[] = JSON.parse(localStorage.getItem('streetnetwork_saved_names') || '[]');

    const handleSaveName = (name: string) => {
        if (!name.trim()) return;
        const current = JSON.parse(localStorage.getItem('streetnetwork_saved_names') || '[]');
        if (!current.includes(name.trim())) {
            const updated = [...current, name.trim()];
            localStorage.setItem('streetnetwork_saved_names', JSON.stringify(updated));
        }
    };

    const handleRemoveSavedName = (name: string) => {
        const current = JSON.parse(localStorage.getItem('streetnetwork_saved_names') || '[]');
        const updated = current.filter((n: string) => n !== name);
        localStorage.setItem('streetnetwork_saved_names', JSON.stringify(updated));
    };

    const toolbarItems = [
        { id: 'source', icon: ImageIcon, label: 'Source Material' },
        { id: 'characters', icon: UserPlus, label: 'Character Matrix' },
        { id: 'textEditor', icon: Type, label: 'Content Strategy' },
        { id: 'add', icon: Plus, label: 'Add Block', isAction: true, onClick: onAddBlock },
        { id: 'move', icon: Move, label: 'Move Tool', isTool: true },
        { id: 'redact', icon: Shield, label: 'Redact Tool', isTool: true },
        { id: 'stripBuilder', icon: Layers, label: 'Strip Builder', isAction: true, onClick: () => onTogglePanel('stripBuilder') },
    ];

    const [activeTab, setActiveTab] = useState<'source' | 'characters' | 'textEditor'>('source');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBlocks = textBlocks.filter(b =>
        b.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex bg-[#121316] border border-white/5 rounded-3xl overflow-hidden h-full shadow-2xl animate-fade-in relative">
            {/* TOOLBAR STRIP (Left) */}
            <div className="w-[64px] flex flex-col items-center py-6 gap-2 border-r border-white/5 bg-[#0a0a0c] z-10">
                {toolbarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.isTool
                        ? activeTool === item.id
                        : (item.id === activeTab || (item.id === 'characters' && activeTab === 'characters'));

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.isAction) {
                                    item.onClick?.();
                                } else if (item.isTool) {
                                    onSetTool(item.id as any);
                                } else {
                                    setActiveTab(item.id as any);
                                }
                            }}
                            className={`group relative p-3 rounded-xl transition-all duration-300 ${isActive || (item.id === 'stripBuilder' && visiblePanels.stripBuilder)
                                ? 'bg-[#FF3B3B] text-white shadow-[0_0_20px_rgba(255,59,59,0.3)]'
                                : 'text-white/20 hover:text-white hover:bg-white/5'
                                }`}
                            title={item.label}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && !item.isAction && (
                                <div className="absolute left-[-1px] top-1/4 bottom-1/4 w-1 bg-white rounded-r-full shadow-[0_0_10px_white]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* CONTENT AREA (Right) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#121316] overflow-y-auto custom-scrollbar relative">
                <div className="p-6 space-y-8 pb-32">

                    {/* SOURCE MATERIAL */}
                    {activeTab === 'source' && (
                        <div className="space-y-8 animate-fade-in">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#FF3B3B] rounded-full" />
                                    <h3 className="text-[11px] uppercase font-black tracking-widest text-white/50">Source Material</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.05] hover:border-[#FF3B3B]/50 transition-all group">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImageFileName(file.name); onImageFile(file); } }} />
                                        <div className="p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform"><ImageIcon size={24} className="text-white/40" /></div>
                                        <div className="text-center"><span className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">Screenshot</span>{imageFileName && <span className="block text-[8px] text-white/20 truncate max-w-[80px] mt-1">{imageFileName}</span>}</div>
                                    </label>
                                    <label className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.05] hover:border-[#FF3B3B]/50 transition-all group">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onOverlayFile(file); }} />
                                        <div className="p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform"><Plus size={24} className="text-white/40" /></div>
                                        <div className="text-center"><span className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">Overlays</span></div>
                                    </label>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#FF3B3B] rounded-full" />
                                    <h3 className="text-[11px] uppercase font-black tracking-widest text-white/50">Import Logs</h3>
                                </div>
                                <label className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.06] transition-all group">
                                    <input type="file" accept=".txt" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setChatFileName(file.name); onChatFile(file); } }} />
                                    <div className="p-2 rounded-lg bg-[#FF3B3B]/10 text-[#FF3B3B]"><FileText size={18} /></div>
                                    <span className="flex-1 text-[11px] font-mono text-white/40 truncate italic">{chatFileName || 'import_chat.txt'}</span>
                                </label>
                            </section>

                            {overlays.length > 0 && (
                                <section className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="text-[11px] uppercase font-black tracking-widest text-white/30">Active Overlays</div>
                                    <div className="space-y-3">
                                        {overlays.map(overlay => (
                                            <div key={overlay.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl group space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 border border-white/5 p-1"><img src={overlay.dataUrl} className="w-full h-full object-contain" /></div>
                                                        <div className="min-w-0"><div className="text-[10px] text-white/70 truncate font-bold uppercase tracking-wider">{overlay.name}</div><div className="text-[8px] text-white/20 truncate">ID: {overlay.id.split('-')[0]}</div></div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => onSetActiveCropOverlayId(overlay.id)} className="p-2 text-white/20 hover:text-[#FF3B3B]"><Square size={14} /></button>
                                                        <button onClick={() => onRemoveOverlay(overlay.id)} className="p-2 text-white/20 hover:text-red-500"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Scale</label>
                                                        <input
                                                            type="number"
                                                            value={overlay.scale}
                                                            step={0.05}
                                                            onChange={(e) => onUpdateOverlay(overlay.id, { scale: Number(e.target.value) })}
                                                            onBlur={onCommitHistory}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 text-[10px] text-white/60 font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Rotation</label>
                                                        <input
                                                            type="number"
                                                            value={overlay.rotation}
                                                            onChange={(e) => onUpdateOverlay(overlay.id, { rotation: Number(e.target.value) })}
                                                            onBlur={onCommitHistory}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 text-[10px] text-white/60 font-mono"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1.5">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[8px] uppercase font-black text-white/10 tracking-widest">Opacity</span>
                                                            <span className="text-[9px] font-mono text-white/20">{(overlay.opacity * 100).toFixed(0)}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={1}
                                                            step={0.05}
                                                            value={overlay.opacity}
                                                            onChange={(e) => onUpdateOverlay(overlay.id, { opacity: Number(e.target.value) })}
                                                            onMouseUp={onCommitHistory}
                                                            className="w-full accent-[#FF3B3B] h-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* CHARACTER MATRIX */}
                    {activeTab === 'characters' && (
                        <div className="space-y-8 animate-fade-in">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><div className="w-1 h-4 bg-[#FF3B3B] rounded-full" /><h3 className="text-[11px] uppercase font-black tracking-widest text-white/50">Character Matrix</h3></div>
                                    <button onClick={onAddNameInput} className="px-3 py-1.5 bg-[#FF3B3B] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg">+ Add Row</button>
                                </div>
                                <div className="space-y-4">
                                    {nameInputs.map((input) => (
                                        <div key={input.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    value={input.name}
                                                    onChange={(e) => onUpdateNameInput(input.id, e.target.value)}
                                                    onBlur={(e) => handleSaveName(e.target.value)}
                                                    placeholder="Character Name"
                                                    list="saved-names-unified"
                                                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[12px] text-white focus:border-[#FF3B3B]/50 transition-all outline-none"
                                                />
                                                <datalist id="saved-names-unified">
                                                    {savedNames.map(name => <option key={name} value={name} />)}
                                                </datalist>
                                                <button
                                                    onClick={() => handleRemoveSavedName(input.name)}
                                                    className="p-2 text-white/5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Remove from history"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                {nameInputs.length > 1 && <button onClick={() => onRemoveNameInput(input.id)} className="text-white/10 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['/ME', '/DO', 'CALL', 'DIALOG'].map(lbl => (
                                                    <button key={lbl} onClick={() => onAppendToBlock(lbl === '/ME' ? `(#bd9dd4)* ${input.name || '[Nombre]'} ` : lbl === '/DO' ? `(#8fbe2e)* (( ${input.name || '[Nombre]'} )) ` : lbl === 'CALL' ? `(#b4b401)${input.name || '[Nombre]'} dice (phone): ` : `${input.name || '[Nombre]'} dice: `)} className="py-2.5 text-[9px] font-black uppercase tracking-widest bg-white/[0.03] border border-white/5 text-white/30 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all">{lbl}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* CONTENT STRATEGY */}
                    {activeTab === 'textEditor' && (
                        <div className="space-y-8 animate-fade-in">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><div className="w-1 h-4 bg-[#FF3B3B] rounded-full" /><h3 className="text-[11px] uppercase font-black tracking-widest text-white/50">Content Strategy</h3></div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                            <input
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search blocks..."
                                                className="bg-black/40 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-[10px] text-white/60 focus:border-[#FF3B3B]/30 outline-none w-32 transition-all"
                                            />
                                        </div>
                                        <button onClick={onAddBlock} className="text-white/20 hover:text-white transition-colors"><Plus size={18} /></button>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {filteredBlocks.map((block, index) => {
                                        const actualIndex = textBlocks.findIndex(b => b.id === block.id);
                                        const bSettings = { ...defaultTextSettings, ...(block.settings ?? {}) };
                                        return (
                                            <div key={block.id} className={`bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden transition-all ${block.collapsed ? 'opacity-50' : 'opacity-100 shadow-xl'}`}>
                                                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02]">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-3 py-1 bg-[#FF3B3B] text-white text-[9px] font-black uppercase tracking-widest rounded-lg">UNIT #{actualIndex + 1}</span>
                                                        <span className="text-[9px] font-mono text-white/20">{block.id.split('-')[0]}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => onToggleBlockCollapsed(block.id)} className="text-white/10 hover:text-white transition-colors">{block.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
                                                        <button onClick={() => onToggleBlockSettings(block.id)} className={`transition-colors ${block.settingsOpen ? 'text-[#FF3B3B]' : 'text-white/20 hover:text-white'}`}><Settings size={14} /></button>
                                                        {textBlocks.length > 1 && <button onClick={() => onRemoveBlock(block.id)} className="text-white/5 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>}
                                                    </div>
                                                </div>

                                                {!block.collapsed && (
                                                    <div className="p-0">
                                                        <textarea
                                                            value={block.text}
                                                            onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                                                            onFocus={() => onSetActiveBlockId(block.id)}
                                                            placeholder="Import logs or type narration..."
                                                            rows={6}
                                                            className="w-full bg-transparent p-6 text-[12px] text-white/70 font-mono leading-relaxed outline-none border-none resize-none custom-scrollbar"
                                                        />

                                                        {block.settingsOpen && (
                                                            <div className="p-6 pt-0 space-y-6 animate-fade-in-up border-t border-white/5 bg-black/20">
                                                                <div className="grid grid-cols-2 gap-4 pt-6">
                                                                    <div className="flex flex-col gap-1.5 col-span-2">
                                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Box Width</label>
                                                                        <div className="flex items-center gap-3">
                                                                            <input
                                                                                type="range"
                                                                                min={100}
                                                                                max={width}
                                                                                value={bSettings.textBoxWidth}
                                                                                onChange={(e) => onUpdateBlockSettings(block.id, { textBoxWidth: Number(e.target.value) })}
                                                                                onMouseUp={onCommitHistory}
                                                                                className="flex-1 accent-[#FF3B3B] h-1"
                                                                            />
                                                                            <span className="text-[10px] font-mono text-white/20 w-8">{bSettings.textBoxWidth}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Size</label>
                                                                        <input type="number" value={bSettings.fontSize} onChange={(e) => onUpdateBlockSettings(block.id, { fontSize: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Line Height</label>
                                                                        <input type="number" value={bSettings.lineHeight} onChange={(e) => onUpdateBlockSettings(block.id, { lineHeight: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Align</label>
                                                                        <select value={bSettings.align} onChange={(e) => onUpdateBlockSettings(block.id, { align: e.target.value as any })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/50 outline-none">
                                                                            <option value="left">Left</option>
                                                                            <option value="center">Center</option>
                                                                            <option value="right">Right</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Rotation</label>
                                                                        <input type="number" value={bSettings.textRotation} onChange={(e) => onUpdateBlockSettings(block.id, { textRotation: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <button onClick={() => onUpdateBlockSettings(block.id, { backdropEnabled: !bSettings.backdropEnabled })} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${bSettings.backdropEnabled ? 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 text-[#FF3B3B]' : 'bg-white/5 border-white/5 text-white/20'}`}><span className="text-[9px] font-black uppercase tracking-widest">Backdrop</span>{bSettings.backdropEnabled ? <Square size={16} /> : <Shield size={16} />}</button>
                                                                    <button onClick={() => onUpdateBlockSettings(block.id, { shadowEnabled: !bSettings.shadowEnabled })} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${bSettings.shadowEnabled ? 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 text-[#FF3B3B]' : 'bg-white/5 border-white/5 text-white/20'}`}><span className="text-[9px] font-black uppercase tracking-widest">Shadow</span><Filter size={16} /></button>
                                                                </div>

                                                                {bSettings.backdropEnabled && (
                                                                    <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                                                                        <button
                                                                            onClick={() => onUpdateBlockSettings(block.id, { backdropMode: 'text' })}
                                                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${bSettings.backdropMode === 'text' ? 'bg-[#FF3B3B] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                                                                        >
                                                                            Fitted
                                                                        </button>
                                                                        <button
                                                                            onClick={() => onUpdateBlockSettings(block.id, { backdropMode: 'all' })}
                                                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${bSettings.backdropMode === 'all' ? 'bg-[#FF3B3B] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                                                                        >
                                                                            Full Width
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <button onClick={() => onToggleBlockAdvanced(block.id)} className="w-full py-3 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all">Advanced Visuals</button>

                                                                {block.advancedOpen && (
                                                                    <div className="space-y-4 pt-2 animate-fade-in">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Font</label>
                                                                                <select value={bSettings.fontFamily} onChange={(e) => onUpdateBlockSettings(block.id, { fontFamily: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/50 outline-none">
                                                                                    <option value="Arial, sans-serif">Standard</option>
                                                                                    <option value="Calibri, sans-serif">Modern</option>
                                                                                    <option value="Raleway, sans-serif">Elegant</option>
                                                                                    <option value="'Courier New', monospace">Mono</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Weight</label>
                                                                                <input type="number" step={100} min={100} max={900} value={bSettings.fontWeight} onChange={(e) => onUpdateBlockSettings(block.id, { fontWeight: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Stroke</label>
                                                                                <input type="number" step={0.5} value={bSettings.strokeWidth} onChange={(e) => onUpdateBlockSettings(block.id, { strokeWidth: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Stroke Clr</label>
                                                                                <input value={bSettings.strokeColor} onChange={(e) => onUpdateBlockSettings(block.id, { strokeColor: e.target.value })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Padding X</label>
                                                                                <input type="number" value={bSettings.paddingX} onChange={(e) => onUpdateBlockSettings(block.id, { paddingX: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Shift X</label>
                                                                                <input type="number" value={bSettings.textOffsetX} onChange={(e) => onUpdateBlockSettings(block.id, { textOffsetX: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">Shift Y</label>
                                                                                <input type="number" value={bSettings.textOffsetY} onChange={(e) => onUpdateBlockSettings(block.id, { textOffsetY: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white/70 font-mono" />
                                                                            </div>
                                                                        </div>

                                                                        {bSettings.shadowEnabled && (
                                                                            <div className="grid grid-cols-2 gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
                                                                                <div className="space-y-1.5">
                                                                                    <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">S-Blur</label>
                                                                                    <input type="number" value={bSettings.shadowBlur} onChange={(e) => onUpdateBlockSettings(block.id, { shadowBlur: Number(e.target.value) })} onBlur={onCommitHistory} className="w-full bg-transparent border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 font-mono" />
                                                                                </div>
                                                                                <div className="space-y-1.5">
                                                                                    <label className="text-[8px] uppercase font-black text-white/10 tracking-widest ml-1">S-Color</label>
                                                                                    <input value={bSettings.shadowColor} onChange={(e) => onUpdateBlockSettings(block.id, { shadowColor: e.target.value })} onBlur={onCommitHistory} className="w-full bg-transparent border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white/50 font-mono" />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {block.collapsed && (
                                                    <div className="px-6 py-4 text-[10px] text-white/20 italic truncate font-mono">
                                                        {block.text.slice(0, 80) || '(No Data In Block)'}{block.text.length > 80 ? '...' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}

                </div>
            </div>

            {/* FOOTER ACTIONS (Sticky at bottom of Content Area) */}
            <div className="absolute bottom-0 left-[64px] right-0 p-6 bg-gradient-to-t from-[#121316] via-[#121316] to-transparent pointer-events-none z-20">
                <div className="flex gap-4 pointer-events-auto">
                    <button
                        onClick={onClearBlocks}
                        className="flex-1 py-4 bg-white/[0.03] text-white/40 text-[10px] font-black uppercase tracking-widest border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
                    >
                        Flush
                    </button>
                    <button
                        onClick={onParseChat}
                        className="flex-[2] py-4 bg-[#FF3B3B] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(255,59,59,0.3)] hover:brightness-110 active:scale-95 transition-all"
                    >
                        Bake into Canvas
                    </button>
                </div>
            </div>
        </div>
    );
};
