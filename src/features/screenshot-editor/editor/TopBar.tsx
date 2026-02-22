import React from 'react';
import { Undo, Redo, Save, Trash2, Bell, User, Copy, Download } from '@/components/Icons';

type TopBarProps = {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onSaveToCache: () => void;
    onSaveToFile: () => void;
    onCopyScreenshot: () => void;
    onClear: () => void;
};

export const TopBar: React.FC<TopBarProps> = ({
    canUndo, canRedo, onUndo, onRedo, onSaveToCache, onSaveToFile, onCopyScreenshot, onClear
}) => {
    return (
        <div className="flex items-center justify-end px-6 py-4 bg-[#0a0a0c] border-b border-white/5 gap-6">
            <div className="flex items-center gap-4 mr-auto">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-2 rounded-lg transition-all ${canUndo ? 'text-white/40 hover:text-white' : 'text-white/5 cursor-not-allowed'}`}
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-2 rounded-lg transition-all ${canRedo ? 'text-white/40 hover:text-white' : 'text-white/5 cursor-not-allowed'}`}
                >
                    <Redo size={18} />
                </button>
            </div>

            <button
                onClick={onClear}
                className="flex items-center gap-2 text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all"
            >
                <Trash2 size={14} />
                Clear All
            </button>

            <div className="flex items-center gap-2">
                <button
                    onClick={onSaveToCache}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    title="Save to Cache (Miniaturas)"
                >
                    <Save size={14} />
                    Cache
                </button>
                <button
                    onClick={onSaveToFile}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    title="Save as PNG"
                >
                    <Download size={14} />
                    Files
                </button>
                <button
                    onClick={onCopyScreenshot}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B3B] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,59,59,0.2)] hover:brightness-110 active:scale-95 transition-all text-nowrap"
                    title="Copy to Clipboard"
                >
                    <Copy size={12} />
                    Copy
                </button>
            </div>

        </div>
    );
};
