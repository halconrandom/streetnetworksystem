'use client';

import React from 'react';
import { useI18n } from '../i18n/context';

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center border-2 border-black bg-[#fdfbf7]">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-all duration-75 ${
          language === 'en'
            ? 'bg-violet-500 text-white'
            : 'text-slate-600 hover:text-black hover:bg-[#f4f1ea]'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider border-l-2 border-black transition-all duration-75 ${
          language === 'es'
            ? 'bg-violet-500 text-white'
            : 'text-slate-600 hover:text-black hover:bg-[#f4f1ea]'
        }`}
        title="Español"
      >
        ES
      </button>
    </div>
  );
}