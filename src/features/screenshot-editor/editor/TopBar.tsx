import React from 'react';
import { Undo, Redo, Save, Trash2, Copy, Download } from '@/components/Icons';
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
        <div className="flex items-center px-4 py-2 bg-[#fdfbf7] border-b-4 border-black gap-3 flex-wrap">
            {/* Undo / Redo + Language */}
            <div className="flex items-center gap-2 mr-auto">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-2 border-2 border-black transition-all duration-75 ${
                        canUndo
                            ? 'bg-[#fdfbf7] text-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                            : 'bg-[#f4f1ea] text-slate-300 cursor-not-allowed'
                    }`}
                    title="Undo"
                >
                    <Undo size={16} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-2 border-2 border-black transition-all duration-75 ${
                        canRedo
                            ? 'bg-[#fdfbf7] text-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                            : 'bg-[#f4f1ea] text-slate-300 cursor-not-allowed'
                    }`}
                    title="Redo"
                >
                    <Redo size={16} />
                </button>
                <div className="w-[2px] h-6 bg-black" />
                <LanguageSelector />
            </div>

            {/* Clear */}
            <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-[#fdfbf7] text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
            >
                <Trash2 size={13} />
                {t('clearAll')}
            </button>

            <div className="w-[2px] h-6 bg-black" />

            {/* Import / Export */}
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
                    className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-[#fdfbf7] text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                    title="Import Workspace JSON"
                >
                    {t('import')}
                </button>
                <button
                    onClick={onExportWorkspace}
                    className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-[#fdfbf7] text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                    title="Export Workspace JSON"
                >
                    {t('export')}
                </button>
            </div>

            <div className="w-[2px] h-6 bg-black" />

            {/* Save / Copy */}
            <div className="flex items-center gap-2">
                {canUseCacheDrafts ? (
                    <button
                        onClick={onSaveToCache}
                        className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-yellow-300 text-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                        title="Save to Cache"
                    >
                        <Save size={13} />
                        {t('cache')}
                    </button>
                ) : (
                    <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-[#f4f1ea] text-slate-300 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                        title={t('premiumFeature')}
                    >
                        <Lock size={12} />
                        {t('cache')}
                    </button>
                )}
                <button
                    onClick={onSaveToFile}
                    className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-[#fdfbf7] text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                    title="Save as PNG"
                >
                    <Download size={13} />
                    {t('files')}
                </button>
                <button
                    onClick={onCopyScreenshot}
                    className="flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-violet-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 text-nowrap"
                    title="Copy to Clipboard"
                >
                    <Copy size={13} />
                    {t('copy')}
                </button>
            </div>

            {/* Review / Submit */}
            {onConfirm && onSelectChannel && (
                <>
                    <div className="w-[2px] h-6 bg-black" />
                    {canUseReviewChannels ? (
                        <>
                            <ReviewChannelSelector
                                selectedChannelId={selectedChannelId}
                                onSelectChannel={onSelectChannel}
                            />
                            <div className="flex items-center gap-2">
                                {submitStatus === 'success' && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 animate-fade-in border-2 border-emerald-600 px-2 py-1 bg-emerald-50">
                                        {t('sent')}
                                    </span>
                                )}
                                {submitStatus === 'error' && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 animate-fade-in border-2 border-red-600 px-2 py-1 bg-red-50" title={submitError ?? ''}>
                                        {t('error')}
                                    </span>
                                )}
                                <button
                                    onClick={onConfirm}
                                    disabled={isSubmitting || !selectedChannelId}
                                    className={`flex items-center gap-1.5 px-4 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all duration-75 text-nowrap
                                        ${isSubmitting || !selectedChannelId
                                            ? 'bg-[#f4f1ea] text-slate-300 cursor-not-allowed'
                                            : 'bg-[#fdfbf7] text-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                        }`}
                                    title={!selectedChannelId ? t('selectChannel') : 'Enviar para revision en Discord'}
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
                                className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-[#f4f1ea] text-slate-300 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                                title={t('premiumFeature')}
                            >
                                <Lock size={12} />
                                {t('reviewChannels')}
                            </button>
                            <button
                                disabled
                                className="flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-[#f4f1ea] text-slate-300 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
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
