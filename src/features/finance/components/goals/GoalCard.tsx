import React from 'react';
import { Target, Plus, Trash2 } from '@shared/icons';
import { SavingsGoal, Currency, formatCurrency } from '../../types';
import { useFinanceI18n } from '../../i18n';

interface Props {
  goal: SavingsGoal;
  currency: Currency;
  onContribute: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

export function GoalCard({ goal, currency, onContribute, onDelete }: Props) {
  const { t } = useFinanceI18n();
  const current = parseFloat(goal.current_amount as any ?? 0);
  const target = goal.target_amount;
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // SVG ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="settings-card p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{goal.name}</h4>
          {goal.is_completed && (
            <span className="text-[9px] font-mono bg-green-400/10 text-green-400 border border-green-400/20 px-1.5 py-0.5 rounded uppercase">{t('completed')}</span>
          )}
          {daysLeft !== null && !goal.is_completed && (
            <p className="text-[10px] font-mono text-terminal-muted mt-0.5">
              {daysLeft > 0 ? t('daysRemaining', { days: daysLeft }) : daysLeft === 0 ? t('dueToday') : t('overdue')}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-terminal-muted hover:text-terminal-accent transition-all ml-2"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Progress ring */}
      <div className="flex items-center gap-4 mb-4">
        <svg width="88" height="88" className="shrink-0">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={goal.is_completed ? '#22c55e' : '#ff003c'}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="13" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
            {pct.toFixed(0)}%
          </text>
        </svg>
        <div>
          <p className="font-mono text-sm font-bold text-white">{formatCurrency(current, currency)}</p>
          <p className="font-mono text-[10px] text-terminal-muted">{t('ofAmount', { amount: formatCurrency(target, currency) })}</p>
          {goal.notes && <p className="text-[10px] text-terminal-muted mt-1 line-clamp-2">{goal.notes}</p>}
        </div>
      </div>

      {!goal.is_completed && (
        <button
          onClick={() => onContribute(goal)}
          className="w-full py-2 text-[11px] font-mono font-bold border border-terminal-accent/30 text-terminal-accent rounded hover:bg-terminal-accent/10 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
        >
          <Plus size={12} />
          {t('addFunds')}
        </button>
      )}
    </div>
  );
}
