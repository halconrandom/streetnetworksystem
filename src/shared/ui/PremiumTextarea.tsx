import React from 'react';
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize';

interface PremiumTextareaProps extends TextareaAutosizeProps {
    label?: string;
    error?: string;
    maxLength?: number;
    showCount?: boolean;
}

const PremiumTextarea: React.FC<PremiumTextareaProps> = ({
    label,
    error,
    maxLength,
    showCount,
    value,
    className = '',
    ...props
}) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
        <div className="w-full space-y-1.5">
            <div className="flex justify-between items-end px-1">
                {label && (
                    <label className="text-[10px] font-bold text-terminal-muted uppercase tracking-widest">
                        {label}
                    </label>
                )}
                {showCount && maxLength && (
                    <span className="text-[10px] text-terminal-muted font-mono">
                        {currentLength}/{maxLength}
                    </span>
                )}
            </div>
            <div className="relative group">
                <TextareaAutosize
                    className={`
                        w-full bg-white/[0.03] backdrop-blur-md border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white 
                        transition-all duration-300 outline-none placeholder:text-white/10 resize-none
                        hover:bg-white/[0.05] hover:border-white/[0.1]
                        focus:bg-white/[0.08] focus:border-terminal-accent/50 focus:ring-4 focus:ring-terminal-accent/10
                        ${error ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/10' : ''}
                        disabled:opacity-40 disabled:cursor-not-allowed
                        min-h-[100px]
                        ${className}
                    `}
                    maxLength={maxLength}
                    value={value}
                    {...props}
                />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-terminal-accent transition-all duration-300 group-focus-within:w-[90%] shadow-[0_0_8px_rgba(255,0,60,0.5)]" />
            </div>
            {error && (
                <p className="text-[10px] text-red-400 uppercase tracking-wider pl-1 animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
};

export default PremiumTextarea;
