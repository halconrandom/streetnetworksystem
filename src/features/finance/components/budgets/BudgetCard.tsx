import React from 'react';
import { Trash2 } from '@shared/icons';
import { Budget, Currency, formatCurrency } from '../../types';
import { useFinanceI18n } from '../../i18n';

interface Props {
  budget: Budget;
  currency: Currency;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, currency, onDelete }: Props) {
  const { t, categoryName } = useFinanceI18n();
  const spent = parseFloat(budget.spent_amount as any ?? 0);
  const limit = budget.limit_amount;
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 999) : 0;
  const isOver = pct >= 100;
  const isWarning = pct >= budget.alert_threshold && !isOver;

  const barColor = isOver ? '#ff003c' : isWarning ? '#f59e0b' : '#22c55e';
  const borderColor = isOver
    ? 'border-terminal-accent/40'
    : isWarning
    ? 'border-yellow-400/30'
    : 'border-white/10';

  return (
    <div
      className={`settings-card p-4 border ${borderColor} ${isOver ? 'shadow-[0_0_12px_rgba(255,0,60,0.15)]' : ''} group`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: budget.category_color || '#64748b' }} />
          <span className="text-xs font-semibold text-white">{categoryName(budget.category_name)}</span>
          {isOver && (
            <span className="text-[9px] font-mono bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 px-1.5 py-0.5 rounded uppercase">{t('over')}</span>
          )}
          {isWarning && (
            <span className="text-[9px] font-mono bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded uppercase">{t('alert')}</span>
          )}
        </div>
        <button
          onClick={() => onDelete(budget.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-terminal-muted hover:text-terminal-accent transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: barColor,
            boxShadow: isOver ? `0 0 8px ${barColor}` : 'none',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-terminal-muted">
          {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
        </span>
        <span
          className="font-mono text-xs font-bold"
          style={{ color: barColor }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
