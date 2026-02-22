import React from 'react';
import { Undo, Redo, Save, Trash2, Bell, User } from '@/components/Icons';

type TopBarProps = {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onClear: () => void;
};

export const TopBar: React.FC<TopBarProps> = ({
    canUndo, canRedo, onUndo, onRedo, onSave, onClear
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

            <button
                onClick={onSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B3B] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,59,59,0.2)] hover:brightness-110 active:scale-95 transition-all"
            >
                <Save size={14} />
                Save Snapshot
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <button className="text-white/20 hover:text-white transition-colors">
                    <Bell size={18} />
                </button>
                <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <User size={16} />
                </button>
            </div>
        </div>
    );
};
