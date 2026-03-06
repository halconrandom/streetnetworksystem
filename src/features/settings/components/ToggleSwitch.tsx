'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

export default function ToggleSwitch({ 
    enabled, 
    onChange, 
    disabled = false,
    size = 'md' 
}: ToggleSwitchProps) {
    const dimensions = {
        sm: { track: 'w-8 h-4.5', thumb: 'w-3 h-3' },
        md: { track: 'w-11 h-6', thumb: 'w-4 h-4' }
    };

    const { track, thumb } = dimensions[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(!enabled)}
            className={`
                ${track}
                relative rounded-full transition-all duration-300 ease-out
                ${disabled 
                    ? 'bg-terminal-border/30 cursor-not-allowed' 
                    : enabled 
                        ? 'bg-terminal-accent shadow-[0_0_12px_rgba(255,0,60,0.3)]' 
                        : 'bg-terminal-border hover:bg-terminal-border/80'
                }
                focus:outline-none focus:ring-2 focus:ring-terminal-accent/30 focus:ring-offset-1 focus:ring-offset-terminal-dark
            `}
        >
            <motion.div
                className={`
                    ${thumb}
                    absolute top-1 rounded-full bg-white shadow-md
                    ${enabled ? 'left-auto' : 'left-1'}
                `}
                animate={{
                    x: enabled ? (size === 'sm' ? 16 : 20) : 0,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                }}
            />
            
            {/* Glow effect when enabled */}
            {enabled && !disabled && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-terminal-accent/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </button>
    );
}