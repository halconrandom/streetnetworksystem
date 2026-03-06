import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon;
    label?: string;
    error?: string;
}

const PremiumInput: React.FC<PremiumInputProps> = ({ icon: Icon, label, error, className = '', ...props }) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="text-[10px] font-bold text-terminal-muted uppercase tracking-widest pl-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted group-focus-within:text-terminal-accent transition-colors duration-200">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    className={`
                        w-full bg-white/[0.03] backdrop-blur-md border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white 
                        transition-all duration-300 outline-none placeholder:text-white/10
                        hover:bg-white/[0.05] hover:border-white/[0.1]
                        focus:bg-white/[0.08] focus:border-terminal-accent/50 focus:ring-4 focus:ring-terminal-accent/10
                        ${Icon ? 'pl-10' : ''}
                        ${error ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/10' : ''}
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${className}
                    `}
                    {...props}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-terminal-accent transition-all duration-300 group-focus-within:w-[90%] shadow-[0_0_8px_rgba(255,0,60,0.5)]" />
            </div>
            {error && (
                <p className="text-[10px] text-red-400 uppercase tracking-wider pl-1 animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
};

export default PremiumInput;
