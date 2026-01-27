import React, { useState } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Crop,
  Type,
  Search,
  UserPlus,
  Save,
  Activity
} from '../../components/Icons';
import { defaultTextSettings } from './constants';
import { CropModal } from './CropModal';
import type { OverlayImage, TextBlock, TextBlockSettings } from './types';

type LeftColumnProps = {
  onImageFile: (file: File) => void;
  onChatFile: (file: File) => void;
  overlays: OverlayImage[];
  onOverlayFile: (file: File) => void;
  onUpdateOverlay: (id: string, update: Partial<OverlayImage>) => void;
  onRemoveOverlay: (id: string) => void;
  nameInputs: { id: string; name: string }[];
  onAddNameInput: () => void;
  onRemoveNameInput: (id: string) => void;
  onUpdateNameInput: (id: string, name: string) => void;
  onAppendToBlock: (text: string) => void;
  activeCropOverlayId: string | null;
  onSetActiveCropOverlayId: (id: string | null) => void;
  textBlocks: TextBlock[];
  onUpdateBlock: (id: string, text: string) => void;
  onUpdateBlockSettings: (id: string, update: Partial<TextBlockSettings>) => void;
  onAddBlock: () => void;
  onRemoveBlock: (id: string) => void;
  onToggleBlockSettings: (id: string) => void;
  onToggleBlockCollapsed: (id: string) => void;
  onToggleBlockAdvanced: (id: string) => void;
  onSetActiveBlockId: (id: string) => void;
  width: number;
  height: number;
  filterText: string;
  onFilterTextChange: (value: string) => void;
  onParseChat: () => void;
  onClearBlocks: () => void;
  onCommitHistory: () => void;
  mode?: 'full' | 'source' | 'text';
};

export const LeftColumn: React.FC<LeftColumnProps> = ({
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
  activeCropOverlayId,
  onSetActiveCropOverlayId,
  textBlocks,
  onUpdateBlock,
  onUpdateBlockSettings,
  onAddBlock,
  onRemoveBlock,
  onToggleBlockSettings,
  onToggleBlockCollapsed,
  onToggleBlockAdvanced,
  onSetActiveBlockId,
  width,
  height,
  filterText,
  onFilterTextChange,
  onParseChat,
  onClearBlocks,
  onCommitHistory,
  mode = 'full'
}) => {
  const showSource = mode === 'full' || mode === 'source';
  const showTextEditor = mode === 'full' || mode === 'text';

  const [imageFileName, setImageFileName] = useState('');
  const [chatFileName, setChatFileName] = useState('');
  const [overlayFileName, setOverlayFileName] = useState('');

  // Local storage for saved names (dropdown list)
  const savedNames: string[] = JSON.parse(localStorage.getItem('streetnetwork_saved_names') || '[]');

  const handleSaveName = (name: string) => {
    if (!name.trim()) return;
    const current = JSON.parse(localStorage.getItem('streetnetwork_saved_names') || '[]');
    if (!current.includes(name.trim())) {
      const updated = [...current, name.trim()];
      localStorage.setItem('streetnetwork_saved_names', JSON.stringify(updated));
      // Force re-render if needed, but here it depends on state. 
      // For now, it will update next time the component renders.
    }
  };

  const handleRemoveSavedName = (name: string) => {
    const current = JSON.parse(localStorage.getItem('streetnetwork_saved_names') || '[]');
    const updated = current.filter((n: string) => n !== name);
    localStorage.setItem('streetnetwork_saved_names', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 min-h-0 pb-10 pr-1">
      {showSource && (
        /* Main Source Import */
        <div className="bg-terminal-panel/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ImageIcon size={18} className="text-terminal-accent" />
            Source Material
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
              Screenshot
              <label htmlFor="screenshot-image" className="group flex flex-col items-center justify-center gap-2 p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 hover:border-terminal-accent/30 transition-all">
                <input
                  id="screenshot-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setImageFileName(file.name);
                      onImageFile(file);
                    }
                  }}
                />
                <Plus size={16} className="text-terminal-accent" />
                <span className="text-[9px] truncate w-full text-center font-mono">{imageFileName || 'UPLOAD'}</span>
              </label>
            </div>

            <div className="flex flex-col gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
              Overlays
              <label htmlFor="overlay-image" className="group flex flex-col items-center justify-center gap-2 p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 hover:border-terminal-accent/30 transition-all">
                <input
                  id="overlay-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setOverlayFileName(file.name);
                      onOverlayFile(file);
                    }
                  }}
                />
                <ImageIcon size={16} className="text-terminal-accent" />
                <span className="text-[9px] truncate w-full text-center font-mono">{overlayFileName || 'ADD'}</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30 pt-2">
            Logs / Chat file
            <label htmlFor="chat-file" className="group flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 hover:border-terminal-accent/30 transition-all">
              <input
                id="chat-file"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setChatFileName(file.name);
                    onChatFile(file);
                  }
                }}
              />
              <FileText size={16} className="text-terminal-accent" />
              <span className="truncate flex-1 text-[9px] text-white/60 font-mono italic">{chatFileName || 'import_chat.txt'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Character Manager with Actions - Always show if left column is active */}
      <div className="bg-terminal-panel/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold text-xs flex items-center gap-2">
            <UserPlus size={16} className="text-terminal-accent" />
            Character Matrix
          </div>
          <button
            onClick={onAddNameInput}
            className="p-1 px-3 bg-terminal-accent text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95"
          >
            Add Row
          </button>
        </div>

        <datalist id="saved-names">
          {savedNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
          {nameInputs.map((input, index) => (
            <div key={input.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl space-y-3 group relative">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-white/10 w-4">{index + 1}</span>
                <input
                  value={input.name}
                  onChange={(e) => onUpdateNameInput(input.id, e.target.value)}
                  placeholder="Character Name"
                  list="saved-names"
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:border-terminal-accent/30 outline-none"
                />
                <div className="flex items-center gap-1">
                  {nameInputs.length > 1 && (
                    <button
                      onClick={() => onRemoveNameInput(input.id)}
                      className="p-1.5 text-white/20 hover:text-red-400 transition-all"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Character Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAppendToBlock(`(#bd9dd4)* ${input.name || '[Nombre]'} `)}
                  className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-[#bd9dd4]/20 hover:border-[#bd9dd4]/30 rounded-lg transition-all"
                >
                  /me
                </button>
                <button
                  onClick={() => onAppendToBlock(`(#8fbe2e)* (( ${input.name || '[Nombre]'} )) `)}
                  className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-[#8fbe2e]/20 hover:border-[#8fbe2e]/30 rounded-lg transition-all"
                >
                  /do
                </button>
                <button
                  onClick={() => onAppendToBlock(`(#b4b401)${input.name || '[Nombre]'} dice (phone): `)}
                  className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-[#b4b401]/20 hover:border-[#b4b401]/30 rounded-lg transition-all"
                >
                  Call
                </button>
                <button
                  onClick={() => onAppendToBlock(`${input.name || '[Nombre]'} dice: `)}
                  className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  Dialog
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay Management List - Tie to source visibility or just show if column is on */}
      {showSource && overlays.length > 0 && (
        <div className="bg-terminal-panel/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-4 shadow-2xl">
          <div className="text-white font-semibold text-xs flex items-center gap-2">
            <ImageIcon size={16} className="text-terminal-accent" />
            Active Overlays
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {overlays.map((overlay) => (
              <div key={overlay.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl space-y-4 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10 p-1">
                      <img src={overlay.dataUrl} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-white/70 truncate font-mono font-bold uppercase tracking-wider">{overlay.name}</span>
                      <span className="text-[9px] text-white/30 truncate">ID: {overlay.id.split('-')[0]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSetActiveCropOverlayId(overlay.id)}
                      className="p-2 bg-white/5 hover:bg-terminal-accent/20 text-white/40 hover:text-terminal-accent rounded-xl transition-all"
                      title="Crop Image"
                    >
                      <Crop size={14} />
                    </button>
                    <button
                      onClick={() => onRemoveOverlay(overlay.id)}
                      className="p-2 bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Manual Controls */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Scale</label>
                    <input
                      type="number"
                      value={overlay.scale}
                      step={0.05}
                      onChange={(e) => onUpdateOverlay(overlay.id, { scale: Number(e.target.value) })}
                      onBlur={onCommitHistory}
                      className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] outline-none focus:border-white/20 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Rotation</label>
                    <input
                      type="number"
                      value={overlay.rotation}
                      onChange={(e) => onUpdateOverlay(overlay.id, { rotation: Number(e.target.value) })}
                      onBlur={onCommitHistory}
                      className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] outline-none focus:border-white/20 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Opacity</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={overlay.opacity}
                        onChange={(e) => onUpdateOverlay(overlay.id, { opacity: Number(e.target.value) })}
                        onMouseUp={onCommitHistory}
                        className="flex-1 accent-terminal-accent h-1.5"
                      />
                      <span className="text-[10px] font-mono text-white/50 w-8 text-right">{(overlay.opacity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTextEditor && (
        <div className="bg-terminal-panel/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-6 shadow-xl flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold flex items-center gap-2">
              <Type size={18} className="text-terminal-accent" />
              Content Strategy
            </div>
            <button
              onClick={onAddBlock}
              className="p-2 bg-terminal-accent text-black rounded-lg hover:brightness-110 active:scale-90 transition-all shadow-lg"
              title="New Text Block"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
            {textBlocks.map((block, index) => {
              const bSettings = { ...defaultTextSettings, ...(block.settings ?? {}) };
              return (
                <div
                  key={block.id}
                  className={`group relative flex flex-col gap-4 p-4 bg-black/40 border transition-all duration-300 rounded-3xl hover:border-white/10 ${block.collapsed ? 'opacity-60' : 'opacity-100 shadow-2xl'
                    }`}
                >
                  {/* Block Header Toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-terminal-accent/10 text-terminal-accent text-[9px] font-extrabold uppercase tracking-widest rounded-full border border-terminal-accent/20">
                        UNIT #{index + 1}
                      </span>
                      <span className="text-[10px] font-mono text-white/30 truncate max-w-[120px]">
                        {block.id.split('-')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onToggleBlockCollapsed(block.id)}
                        className="p-2 rounded-xl text-white/10 hover:text-white/40 hover:bg-white/5 transition-all"
                        title={block.collapsed ? 'Expand' : 'Collapse'}
                      >
                        {block.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                      <button
                        onClick={() => onToggleBlockSettings(block.id)}
                        className={`p-2 rounded-xl transition-all ${block.settingsOpen ? 'bg-terminal-accent/20 text-terminal-accent' : 'text-white/10 hover:text-white/60 hover:bg-white/5'}`}
                        title="Configuration"
                      >
                        <Settings size={14} />
                      </button>
                      {textBlocks.length > 1 && (
                        <button
                          onClick={() => onRemoveBlock(block.id)}
                          className="p-2 rounded-xl text-white/5 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {!block.collapsed && (
                    <>
                      <textarea
                        value={block.text}
                        onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                        onFocus={() => onSetActiveBlockId(block.id)}
                        placeholder="Import logs or type narration..."
                        rows={5}
                        className="w-full bg-black/40 text-[11px] text-white border border-white/5 rounded-2xl p-4 focus:border-terminal-accent/30 outline-none transition-all custom-scrollbar font-mono leading-relaxed"
                      />

                      {block.settingsOpen && (
                        <div className="space-y-4 pt-4 border-t border-white/5 animate-fade-in-up">
                          {/* Basic Settings */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Box Max Width</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={100}
                                  max={width}
                                  value={bSettings.textBoxWidth}
                                  onChange={(e) => onUpdateBlockSettings(block.id, { textBoxWidth: Number(e.target.value) })}
                                  onMouseUp={onCommitHistory}
                                  className="flex-1 accent-terminal-accent h-1"
                                />
                                <input
                                  type="number"
                                  value={bSettings.textBoxWidth}
                                  onChange={(e) => onUpdateBlockSettings(block.id, { textBoxWidth: Number(e.target.value) })}
                                  onBlur={onCommitHistory}
                                  className="w-16 bg-black/60 border border-white/5 rounded-lg px-2 py-1 text-white text-[10px] font-mono text-center"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Font Size</label>
                              <input
                                type="number"
                                value={bSettings.fontSize}
                                onChange={(e) => onUpdateBlockSettings(block.id, { fontSize: Number(e.target.value) })}
                                onBlur={onCommitHistory}
                                className="bg-black/60 border border-white/5 rounded-lg px-3 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none font-mono"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Line Space</label>
                              <input
                                type="number"
                                value={bSettings.lineHeight}
                                onChange={(e) => onUpdateBlockSettings(block.id, { lineHeight: Number(e.target.value) })}
                                onBlur={onCommitHistory}
                                className="bg-black/60 border border-white/5 rounded-lg px-3 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none font-mono"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Align</label>
                              <select
                                value={bSettings.align}
                                onChange={(e) => { onUpdateBlockSettings(block.id, { align: e.target.value as any }); }}
                                className="bg-black/60 border border-white/5 rounded-lg px-3 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Rotation</label>
                              <input
                                type="number"
                                value={bSettings.textRotation}
                                step={1}
                                onChange={(e) => onUpdateBlockSettings(block.id, { textRotation: Number(e.target.value) })}
                                onBlur={onCommitHistory}
                                className="bg-black/60 border border-white/5 rounded-lg px-3 py-2 text-white text-[11px] focus:border-terminal-accent/30 outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* Backdrop & Shadow Toggles */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => onUpdateBlockSettings(block.id, { backdropEnabled: !bSettings.backdropEnabled })}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${bSettings.backdropEnabled ? 'bg-terminal-accent/10 border-terminal-accent/40 text-terminal-accent' : 'bg-white/5 border-white/5 text-white/20'}`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-widest">Backdrop</span>
                              {bSettings.backdropEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                            <button
                              onClick={() => onUpdateBlockSettings(block.id, { shadowEnabled: !bSettings.shadowEnabled })}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${bSettings.shadowEnabled ? 'bg-terminal-accent/10 border-terminal-accent/40 text-terminal-accent' : 'bg-white/5 border-white/5 text-white/20'}`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-widest">Shadow</span>
                              {bSettings.shadowEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                          </div>

                          {bSettings.backdropEnabled && (
                            <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                              <button
                                onClick={() => onUpdateBlockSettings(block.id, { backdropMode: 'text' })}
                                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${bSettings.backdropMode === 'text' ? 'bg-terminal-accent text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                              >
                                Fitted
                              </button>
                              <button
                                onClick={() => onUpdateBlockSettings(block.id, { backdropMode: 'all' })}
                                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${bSettings.backdropMode === 'all' ? 'bg-terminal-accent text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                              >
                                Full Width
                              </button>
                            </div>
                          )}

                          {/* Advanced Options Toggle */}
                          <button
                            onClick={() => onToggleBlockAdvanced(block.id)}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-all ${block.advancedOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-white/30 hover:text-white/60'}`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-widest">Advanced Visuals</span>
                            {block.advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {block.advancedOpen && (
                            <div className="space-y-4 pt-2 animate-fade-in">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Shift X</label>
                                  <input
                                    type="number"
                                    value={bSettings.textOffsetX}
                                    onChange={(e) => onUpdateBlockSettings(block.id, { textOffsetX: Number(e.target.value) })}
                                    onBlur={onCommitHistory}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Shift Y</label>
                                  <input
                                    type="number"
                                    value={bSettings.textOffsetY}
                                    onChange={(e) => onUpdateBlockSettings(block.id, { textOffsetY: Number(e.target.value) })}
                                    onBlur={onCommitHistory}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 col-span-2">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Font Family</label>
                                  <select
                                    value={bSettings.fontFamily}
                                    onChange={(e) => { onUpdateBlockSettings(block.id, { fontFamily: e.target.value }); }}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px]"
                                  >
                                    <option value="Arial, Helvetica, sans-serif">Standard Arial</option>
                                    <option value="Calibri, sans-serif">Modern Calibri</option>
                                    <option value="Raleway, san-serif">Elegant Raleway</option>
                                    <option value="Comic Sans MS, cursive, san-serif">Comic Sans MS</option>
                                    <option value="'Courier New', Courier, monospace">True Monospace</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Weight</label>
                                  <input
                                    type="number"
                                    value={bSettings.fontWeight}
                                    step={100}
                                    min={100}
                                    max={900}
                                    onChange={(e) => onUpdateBlockSettings(block.id, { fontWeight: Number(e.target.value) })}
                                    onBlur={onCommitHistory}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Stroke</label>
                                  <input
                                    type="number"
                                    value={bSettings.strokeWidth}
                                    step={0.5}
                                    onChange={(e) => onUpdateBlockSettings(block.id, { strokeWidth: Number(e.target.value) })}
                                    onBlur={onCommitHistory}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Stroke Color</label>
                                  <input
                                    value={bSettings.strokeColor}
                                    onChange={(e) => onUpdateBlockSettings(block.id, { strokeColor: e.target.value })}
                                    onBlur={onCommitHistory}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Padding X</label>
                                  <input
                                    type="number"
                                    value={bSettings.paddingX}
                                    onChange={(e) => onUpdateBlockSettings(block.id, { paddingX: Number(e.target.value) })}
                                    onBlur={onCommitHistory}
                                    className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                                  />
                                </div>
                              </div>

                              {bSettings.shadowEnabled && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-white/10 uppercase tracking-widest">S-Blur</label>
                                    <input
                                      type="number"
                                      value={bSettings.shadowBlur}
                                      onChange={(e) => onUpdateBlockSettings(block.id, { shadowBlur: Number(e.target.value) })}
                                      onBlur={onCommitHistory}
                                      className="bg-transparent border border-white/5 rounded px-2 py-1 text-white text-[10px] font-mono"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-white/10 uppercase tracking-widest">S-Color</label>
                                    <input
                                      value={bSettings.shadowColor}
                                      onChange={(e) => onUpdateBlockSettings(block.id, { shadowColor: e.target.value })}
                                      onBlur={onCommitHistory}
                                      className="bg-transparent border border-white/5 rounded px-2 py-1 text-white text-[10px] font-mono"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {block.collapsed && (
                    <div className="text-[10px] text-white/40 italic truncate pr-20 font-mono flex items-center gap-2">
                      <Activity size={10} className="text-terminal-accent/40" />
                      {block.text.slice(0, 60) || '(Unit Data Missing)'}{block.text.length > 60 ? '...' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-auto flex gap-3">
            <button
              onClick={onClearBlocks}
              className="flex-1 px-4 py-3 bg-white/5 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest border border-white/5 rounded-2xl transition-all"
            >
              Flush
            </button>
            <button
              onClick={onParseChat}
              className="flex-[2] px-4 py-3 bg-terminal-accent text-black text-[10px] font-extrabold uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] hover:brightness-110 active:scale-95 transition-all"
            >
              Bake Into Canvas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
