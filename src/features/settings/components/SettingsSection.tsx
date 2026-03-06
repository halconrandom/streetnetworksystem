'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SettingsSectionProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
}

export default function SettingsSection({ 
    title, 
    description, 
    icon: Icon, 
    children, 
    className = '' 
}: SettingsSectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`bg-terminal-panel/50 border border-terminal-border rounded-xl overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-terminal-border/50 bg-terminal-dark/30">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-terminal-accent/10 border border-terminal-accent/20 flex items-center justify-center">
                            <Icon size={16} className="text-terminal-accent" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
                        {description && (
                            <p className="text-[10px] text-terminal-muted mt-0.5 uppercase tracking-widest">{description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {children}
            </div>
        </motion.section>
    );
}

// Sub-componente para filas de configuración
interface SettingsRowProps {
    label: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function SettingsRow({ label, description, children, className = '' }: SettingsRowProps) {
    return (
        <div className={`flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0 ${className}`}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                {description && (
                    <p className="text-xs text-terminal-muted mt-1">{description}</p>
                )}
            </div>
            <div className="flex-shrink-0">
                {children}
            </div>
        </div>
    );
}

// Sub-componente para divider
export function SettingsDivider() {
    return <div className="h-px bg-terminal-border/50 my-4" />;
}