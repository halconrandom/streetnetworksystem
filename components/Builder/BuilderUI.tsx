
import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Label: React.FC<{ children: React.ReactNode, required?: boolean }> = ({ children, required }) => (
  <label className="block text-xs font-bold text-terminal-muted uppercase tracking-wider mb-1.5">
    {children}
    {required && <span className="text-terminal-accent ml-1">*</span>}
  </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props}
    className={`w-full bg-black/30 border border-terminal-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-terminal-accent transition-colors ${props.className}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <div className="relative">
    <select 
      {...props}
      className={`w-full bg-black/30 border border-terminal-border rounded px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-terminal-accent transition-colors ${props.className}`}
    >
      {props.children}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted pointer-events-none" />
  </div>
);

export const ColorPicker: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-2">
    <input 
      type="color" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-9 p-0.5 bg-terminal-dark border border-terminal-border rounded cursor-pointer"
    />
    <Input 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      placeholder="#000000"
      className="font-mono"
    />
  </div>
);

export const Toggle: React.FC<{ checked: boolean, onChange: (val: boolean) => void, label: string }> = ({ checked, onChange, label }) => (
  <div 
    className="flex items-center gap-2 cursor-pointer group"
    onClick={() => onChange(!checked)}
  >
    <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-terminal-accent' : 'bg-terminal-border'}`}>
      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}></div>
    </div>
    <span className="text-sm text-terminal-muted group-hover:text-white select-none">{label}</span>
  </div>
);
