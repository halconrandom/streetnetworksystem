'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userName?: string;
    onUpload?: (file: File) => Promise<void>;
    disabled?: boolean;
}

export default function AvatarUpload({ 
    currentAvatarUrl, 
    userName = 'User',
    onUpload,
    disabled = false 
}: AvatarUploadProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayUrl = previewUrl || currentAvatarUrl;
    const initials = userName?.charAt(0)?.toUpperCase() || 'U';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen válida');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no puede exceder 5MB');
            return;
        }

        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload if handler provided
        if (onUpload) {
            setIsUploading(true);
            try {
                await onUpload(file);
            } catch (_err) {
                setError('Error al subir la imagen');
                setPreviewUrl(null);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleRemovePreview = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
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

                {/* Overlay on hover */}
                <AnimatePresence>
                    {isHovered && !disabled && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-terminal-dark/80 rounded-2xl flex items-center justify-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 size={24} className="text-terminal-accent animate-spin" />
                            ) : (
                                <Camera size={24} className="text-white" />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Remove preview button */}
                {previewUrl && !isUploading && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={handleRemovePreview}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-terminal-dark hover:bg-red-400 transition-colors"
                    >
                        <X size={12} className="text-white" />
                    </motion.button>
                )}
            </div>

            {/* Upload button */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium
                    transition-all duration-200 uppercase tracking-wider
                    ${disabled || isUploading
                        ? 'bg-terminal-border/30 text-terminal-muted cursor-not-allowed'
                        : 'bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 border border-terminal-accent/30'
                    }
                `}
            >
                {isUploading ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Subiendo...</span>
                    </>
                ) : (
                    <>
                        <Upload size={14} />
                        <span>Cambiar Avatar</span>
                    </>
                )}
            </button>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-red-400"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Helper text */}
            <p className="text-[10px] text-terminal-muted uppercase tracking-widest text-center">
                PNG, JPG o GIF. Máx 5MB
            </p>
        </div>
    );
}