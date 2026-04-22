import React from 'react';
import { ChevronLeft, ChevronRight } from '@shared/icons';
import { MONTH_NAMES } from '../types';

interface Props {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ month, year, onPrev, onNext }: Props) {
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-1.5 rounded text-terminal-muted hover:text-white hover:bg-white/5 transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="font-mono text-xs tracking-widest text-white uppercase min-w-[120px] text-center">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className="p-1.5 rounded text-terminal-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
