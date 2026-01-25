import React from 'react';
import { Undo, Redo, Save, Trash2 } from '../../components/Icons';

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
        <div className="flex items-center justify-between px-6 py-3 bg-terminal-panel/60 backdrop-blur-md border border-white/5 rounded-2xl mb-6 shadow-2xl">
            <div className="flex items-center gap-3">
                <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${canUndo
                                ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white active:scale-90 shadow-lg'
                                : 'text-white/10 cursor-not-allowed opacity-50'
                            }`}
                        title="Deshacer (Ctrl+Z)"
                    >
                        <Undo size={14} strokeWidth={3} />
                        Undo
                    </button>
                    <div className="w-px h-6 bg-white/5 mx-1" />
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${canRedo
                                ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white active:scale-90 shadow-lg'
                                : 'text-white/10 cursor-not-allowed opacity-50'
                            }`}
                        title="Rehacer (Ctrl+Y)"
                    >
                        <Redo size={14} strokeWidth={3} />
                        Redo
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onClear}
                    className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-500/30 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95"
                >
                    <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                    Clear All
                </button>
                <button
                    onClick={onSave}
                    className="group relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-terminal-accent text-black hover:brightness-110 active:scale-95 text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
                >
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-30 transition-opacity" />
                    <Save size={14} strokeWidth={3} />
                    Save Snapshot
                </button>
            </div>
        </div>
    );
};
