import React from 'react';
import { Undo, Redo, Save, Trash2, Bell, User, Copy, Download } from '@/components/Icons';
import { Send } from 'lucide-react';
import { ReviewChannelSelector, ReviewChannel } from '../components/ReviewChannelSelector';

type TopBarProps = {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onSaveToCache: () => void;
    onSaveToFile: () => void;
    onCopyScreenshot: () => void;
    onClear: () => void;
    onExportWorkspace: () => void;
    onImportWorkspace: (data: any) => void;
    onConfirm?: () => void;
    isSubmitting?: boolean;
    submitStatus?: 'idle' | 'success' | 'error';
    submitError?: string | null;
    selectedChannelId?: string | null;
    onSelectChannel?: (channel: ReviewChannel | null) => void;
};

export const TopBar: React.FC<TopBarProps> = ({
    canUndo, canRedo, onUndo, onRedo, onSaveToCache, onSaveToFile, onCopyScreenshot, onClear, onExportWorkspace, onImportWorkspace,
    onConfirm, isSubmitting = false, submitStatus = 'idle', submitError = null,
    selectedChannelId = null, onSelectChannel
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                onImportWorkspace(data);
            } catch (err) {
                alert('Error al leer el archivo JSON.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

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

            <div className="h-6 w-[1px] bg-white/5" />

            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
                <button
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                    title="Import Workspace JSON"
                >
                    Import
                </button>
                <button
                    onClick={onExportWorkspace}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                    title="Export Workspace JSON"
                >
                    Export
                </button>
            </div>

            <div className="h-6 w-[1px] bg-white/5" />

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

            {onConfirm && onSelectChannel && (
                <>
                    <div className="h-6 w-[1px] bg-white/5" />
                    <ReviewChannelSelector
                        selectedChannelId={selectedChannelId}
                        onSelectChannel={onSelectChannel}
                    />
                    <div className="flex items-center gap-3">
                        {/* Status toast */}
                        {submitStatus === 'success' && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-fade-in">
                                ✅ Enviado
                            </span>
                        )}
                        {submitStatus === 'error' && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 animate-fade-in" title={submitError ?? ''}>
                                ❌ Error
                            </span>
                        )}
                        <button
                            onClick={onConfirm}
                            disabled={isSubmitting || !selectedChannelId}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-nowrap active:scale-95
                                ${isSubmitting
                                    ? 'bg-emerald-700/40 text-emerald-300/50 cursor-not-allowed'
                                    : !selectedChannelId
                                        ? 'bg-emerald-900/40 text-emerald-300/30 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:brightness-110'
                                }`}
                            title={!selectedChannelId ? 'Selecciona un canal primero' : 'Enviar para revisión en Discord'}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={12} />
                                    Confirmar
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

        </div>
    );
};
