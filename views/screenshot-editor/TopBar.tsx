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
        <div className="flex items-center justify-between px-4 py-2 bg-terminal-panel border border-terminal-border rounded-lg mb-6">
            <div className="flex items-center gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-2 rounded-md border border-terminal-border flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors ${canUndo
                            ? 'bg-terminal-dark text-terminal-muted hover:text-white'
                            : 'bg-terminal-dark/50 text-terminal-muted/30 cursor-not-allowed'
                        }`}
                    title="Deshacer (Ctrl+Z)"
                >
                    <Undo size={14} />
                    Undo
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-2 rounded-md border border-terminal-border flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors ${canRedo
                            ? 'bg-terminal-dark text-terminal-muted hover:text-white'
                            : 'bg-terminal-dark/50 text-terminal-muted/30 cursor-not-allowed'
                        }`}
                    title="Rehacer (Ctrl+Y)"
                >
                    <Redo size={14} />
                    Redo
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onClear}
                    className="p-2 px-3 rounded-md border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 transition-colors"
                    title="Limpiar todo"
                >
                    <Trash2 size={14} />
                    Clear Canvas
                </button>
                <button
                    onClick={onSave}
                    className="p-2 px-4 rounded-md bg-terminal-accent text-black hover:bg-terminal-accent/90 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 transition-colors shadow-lg"
                    title="Guardar en Cache"
                >
                    <Save size={14} />
                    Save Snapshot
                </button>
            </div>
        </div>
    );
};
