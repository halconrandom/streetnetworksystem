'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/context';

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
          language === 'en'
            ? 'bg-terminal-accent/20 text-terminal-accent'
            : 'text-white/40 hover:text-white hover:bg-white/5'
        }`}
        title="English"
      >
        <span className="text-sm">🇺🇸</span>
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
          language === 'es'
            ? 'bg-terminal-accent/20 text-terminal-accent'
            : 'text-white/40 hover:text-white hover:bg-white/5'
        }`}
        title="Español"
      >
        <span className="text-sm">🇪🇸</span>
        ES
      </button>
    </div>
  );
}