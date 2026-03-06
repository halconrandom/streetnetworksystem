'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, Link, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AvatarUploadProps {
    customAvatarUrl?: string | null;
    discordAvatarUrl?: string | null;
    userName?: string;
    onAvatarChange?: (url: string | null) => Promise<void>;
    disabled?: boolean;
}

export default function AvatarUpload({ 
    customAvatarUrl,
    discordAvatarUrl,
    userName = 'User',
    onAvatarChange,
    disabled = false 
}: AvatarUploadProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Priority: custom avatar > discord avatar
    const displayUrl = customAvatarUrl || discordAvatarUrl;
    const hasCustomAvatar = !!customAvatarUrl;
    const initials = userName?.charAt(0)?.toUpperCase() || 'U';

    const validateImgurUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            const validDomains = ['imgur.com', 'i.imgur.com'];
            return validDomains.some(domain => urlObj.hostname.endsWith(domain));
        } catch {
            return false;
        }
    };

    const convertToDirectLink = (url: string): string => {
        try {
            const urlObj = new URL(url);
            
            if (urlObj.hostname === 'i.imgur.com') {
                return url;
            }
            
            if (urlObj.hostname === 'imgur.com' || urlObj.hostname === 'www.imgur.com') {
                const imageId = urlObj.pathname.split('/').filter(Boolean)[0];
                if (imageId) {
                    const cleanId = imageId.split('.')[0];
                    return `https://i.imgur.com/${cleanId}.png`;
                }
            }
            
            return url;
        } catch {
            return url;
        }
    };

    const handleSubmit = async () => {
        if (!inputValue.trim()) {
            setError('Por favor ingresa un enlace');
            return;
        }

        if (!validateImgurUrl(inputValue.trim())) {
            setError('El enlace debe ser de Imgur (imgur.com o i.imgur.com)');
            return;
        }

        setError(null);
        setIsSaving(true);

        try {
            const directUrl = convertToDirectLink(inputValue.trim());
            
            if (onAvatarChange) {
                await onAvatarChange(directUrl);
            }
            
            setSuccess(true);
            setTimeout(() => {
                setIsModalOpen(false);
                setInputValue('');
                setSuccess(false);
            }, 1500);
        } catch (err) {
            setError('Error al guardar el avatar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestoreDiscord = async () => {
        setIsSaving(true);
        setError(null);
        
        try {
            if (onAvatarChange) {
                await onAvatarChange(null);
            }
            setSuccess(true);
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccess(false);
            }, 1500);
        } catch (err) {
            setError('Error al restaurar el avatar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setIsModalOpen(false);
            setInputValue('');
            setError(null);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center gap-4">
                {/* Avatar Container */}
                <div 
                    className="relative group"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <motion.div
                        className={`
                            w-24 h-24 rounded-2xl overflow-hidden border-2 
                            ${disabled ? 'border-terminal-border/30 opacity-50' : 'border-terminal-border hover:border-terminal-accent/50'}
                            transition-all duration-300 cursor-pointer
                        `}
                        whileHover={!disabled ? { scale: 1.02 } : {}}
                        whileTap={!disabled ? { scale: 0.98 } : {}}
                    >
                        {displayUrl ? (
                            <img 
                                src={displayUrl} 
                                alt={userName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-terminal-dark flex items-center justify-center">
                                <span className="text-3xl font-bold text-terminal-muted">
                                    {initials}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    {/* Custom avatar indicator */}
                    {hasCustomAvatar && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-terminal-accent rounded-full flex items-center justify-center border-2 border-terminal-dark">
                            <Link size={10} className="text-white" />
                        </div>
                    )}

                    {/* Overlay on hover */}
                    <AnimatePresence>
                        {isHovered && !disabled && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-terminal-dark/80 rounded-2xl flex items-center justify-center cursor-pointer"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Camera size={24} className="text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Change button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={disabled}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium
                        transition-all duration-200 uppercase tracking-wider
                        ${disabled
                            ? 'bg-terminal-border/30 text-terminal-muted cursor-not-allowed'
                            : 'bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 border border-terminal-accent/30'
                        }
                    `}
                >
                    <Link size={14} />
                    <span>Cambiar Avatar</span>
                </button>

                {/* Source indicator */}
                <p className="text-[10px] text-terminal-muted uppercase tracking-widest text-center">
                    {hasCustomAvatar ? 'Avatar personalizado' : 'Avatar de Discord'}
                </p>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !isSaving && setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-terminal-panel border border-terminal-border rounded-2xl p-6 w-full max-w-md relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => {
                                    if (!isSaving) {
                                        setIsModalOpen(false);
                                        setInputValue('');
                                        setError(null);
                                    }
                                }}
                                className="absolute top-4 right-4 p-1 text-terminal-muted hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                                    Cambiar Avatar
                                </h3>
                                <p className="text-xs text-terminal-muted mt-1">
                                    Usa un enlace de Imgur o restaura el de Discord
                                </p>
                            </div>

                            {/* Current avatar preview */}
                            <div className="flex items-center gap-4 p-4 bg-terminal-dark/50 rounded-xl border border-terminal-border/50 mb-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-terminal-border">
                                    {displayUrl ? (
                                        <img src={displayUrl} alt="Current" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-terminal-dark flex items-center justify-center">
                                            <span className="text-2xl font-bold text-terminal-muted">{initials}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">Avatar actual</p>
                                    <p className="text-xs text-terminal-muted">
                                        {hasCustomAvatar ? 'Personalizado (Imgur)' : 'Sincronizado de Discord'}
                                    </p>
                                </div>
                            </div>

                            {/* Input */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            setError(null);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="https://imgur.com/..."
                                        disabled={isSaving}
                                        className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-4 py-3 text-sm text-white placeholder-terminal-muted/50 focus:outline-none focus:border-terminal-accent/50 transition-colors pr-10"
                                    />
                                    <Link size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted" />
                                </div>

                                {/* Preview */}
                                {inputValue && validateImgurUrl(inputValue) && (
                                    <div className="flex items-center gap-3 p-3 bg-terminal-dark/50 rounded-lg border border-terminal-border/50">
                                        <img 
                                            src={convertToDirectLink(inputValue)} 
                                            alt="Preview"
                                            className="w-12 h-12 rounded-lg object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="%230a0a0a" width="48" height="48"/><text x="50%" y="50%" fill="%23666" font-size="12" text-anchor="middle" dy=".3em">Error</text></svg>';
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white font-medium truncate">
                                                Vista previa
                                            </p>
                                            <p className="text-[10px] text-terminal-muted truncate">
                                                {convertToDirectLink(inputValue)}
                                            </p>
                                        </div>
                                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                                    </div>
                                )}

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                                        >
                                            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                            <p className="text-xs text-red-400">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Success */}
                                <AnimatePresence>
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                                        >
                                            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                                            <p className="text-xs text-emerald-400">Avatar actualizado correctamente</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setInputValue('');
                                            setError(null);
                                        }}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2.5 bg-terminal-dark border border-terminal-border rounded-lg text-xs font-medium text-terminal-muted hover:text-white hover:border-terminal-border/80 transition-all disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSaving || !inputValue.trim()}
                                        className="flex-1 px-4 py-2.5 bg-terminal-accent hover:bg-terminal-accent/90 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={14} />
                                                <span>Guardar</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Restore Discord avatar */}
                                {hasCustomAvatar && discordAvatarUrl && (
                                    <div className="pt-3 border-t border-terminal-border/50">
                                        <button
                                            onClick={handleRestoreDiscord}
                                            disabled={isSaving}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terminal-dark border border-terminal-border rounded-lg text-xs font-medium text-terminal-muted hover:text-white hover:border-terminal-accent/30 transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw size={14} />
                                            <span>Restaurar avatar de Discord</span>
                                        </button>
                                        <p className="text-[10px] text-terminal-muted/60 text-center mt-2">
                                            Eliminará tu avatar personalizado
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Help text */}
                            <div className="mt-4 pt-4 border-t border-terminal-border/50">
                                <p className="text-[10px] text-terminal-muted/60 text-center">
                                    Sube tu imagen a <span className="text-terminal-accent">imgur.com</span> y pega el enlace aquí
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}