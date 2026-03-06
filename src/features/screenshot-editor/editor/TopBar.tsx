import React from 'react';
import { Undo, Redo, Save, Trash2, Bell, User, Copy, Download } from '@/components/Icons';
import { Send, Lock } from 'lucide-react';
import { ReviewChannelSelector, ReviewChannel } from '../components/ReviewChannelSelector';
import { LanguageSelector } from '../components/LanguageSelector';
import { useI18n } from '../i18n/context';

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
    // Premium feature flags
    canUseReviewChannels?: boolean;
    canUseCacheDrafts?: boolean;
};

export const TopBar: React.FC<TopBarProps> = ({
    canUndo, canRedo, onUndo, onRedo, onSaveToCache, onSaveToFile, onCopyScreenshot, onClear, onExportWorkspace, onImportWorkspace,
    onConfirm, isSubmitting = false, submitStatus = 'idle', submitError = null,
    selectedChannelId = null, onSelectChannel,
    canUseReviewChannels = false, canUseCacheDrafts = false
}) => {
    const { t } = useI18n();
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
                <LanguageSelector />
            </div>

            <button
                onClick={onClear}
                className="flex items-center gap-2 text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all"
            >
                <Trash2 size={14} />
                {t('clearAll')}
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
                    {t('import')}
                </button>
                <button
                    onClick={onExportWorkspace}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                    title="Export Workspace JSON"
                >
                    {t('export')}
                </button>
            </div>

            <div className="h-6 w-[1px] bg-white/5" />

            <div className="flex items-center gap-2">
                {canUseCacheDrafts ? (
                    <button
                        onClick={onSaveToCache}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        title="Save to Cache (Miniaturas)"
                    >
                        <Save size={14} />
                        {t('cache')}
                    </button>
                ) : (
                    <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/30 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                        title={t('premiumFeature')}
                    >
                        <Lock size={12} />
                        {t('cache')}
                    </button>
                )}
                <button
                    onClick={onSaveToFile}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    title="Save as PNG"
                >
                    <Download size={14} />
                    {t('files')}
                </button>
                <button
                    onClick={onCopyScreenshot}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B3B] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,59,59,0.2)] hover:brightness-110 active:scale-95 transition-all text-nowrap"
                    title="Copy to Clipboard"
                >
                    <Copy size={12} />
                    {t('copy')}
                </button>
            </div>

            {onConfirm && onSelectChannel && (
                <>
                    <div className="h-6 w-[1px] bg-white/5" />
                    {canUseReviewChannels ? (
                        <>
                            <ReviewChannelSelector
                                selectedChannelId={selectedChannelId}
                                onSelectChannel={onSelectChannel}
                            />
                            <div className="flex items-center gap-3">
                                {/* Status toast */}
                                {submitStatus === 'success' && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-fade-in">
                                        ✅ {t('sent')}
                                    </span>
                                )}
                                {submitStatus === 'error' && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 animate-fade-in" title={submitError ?? ''}>
                                        ❌ {t('error')}
                                    </span>
                                )}
                                <button
                                    onClick={onConfirm}
                                    disabled={isSubmitting || !selectedChannelId}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-nowrap active:scale-95 border
                                        ${isSubmitting
                                            ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                                            : !selectedChannelId
                                                ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                    title={!selectedChannelId ? t('selectChannel') : 'Enviar para revisión en Discord'}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                            {t('sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send size={12} />
                                            {t('review')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                disabled
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/30 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                                title={t('premiumFeature')}
                            >
                                <Lock size={12} />
                                {t('reviewChannels')}
                            </button>
                            <button
                                disabled
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                                title={t('premiumFeature')}
                            >
                                <Lock size={12} />
                                {t('review')}
                            </button>
                        </div>
                    )}
                </>
            )}

        </div>
    );
};
