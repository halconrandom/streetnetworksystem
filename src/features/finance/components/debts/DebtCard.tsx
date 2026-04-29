import React from 'react';
import { CreditCard, Plus, Trash2 } from '@shared/icons';
import { Debt, Currency, formatCurrency } from '../../types';
import { useFinanceI18n } from '../../i18n';

interface Props {
  debt: Debt;
  currency: Currency;
  onPayment: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export function DebtCard({ debt, currency, onPayment, onDelete }: Props) {
  const { t } = useFinanceI18n();
  const totalPaid = parseFloat(debt.total_paid as any ?? 0);
  const pctPaid = debt.original_amount > 0 ? Math.min((totalPaid / debt.original_amount) * 100, 100) : 0;

  return (
    <div className={`settings-card p-5 group ${debt.is_paid_off ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-white/5">
            <CreditCard size={14} className="text-terminal-muted" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{debt.creditor_name}</h4>
            {debt.is_paid_off && (
              <span className="text-[9px] font-mono bg-green-400/10 text-green-400 border border-green-400/20 px-1.5 py-0.5 rounded uppercase">{t('paidOff')}</span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(debt.id)} className="opacity-0 group-hover:opacity-100 p-1 text-terminal-muted hover:text-terminal-accent transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      <div className="space-y-2 mb-4 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-terminal-muted">{t('currentBalance')}</span>
          <span className="text-terminal-accent font-bold">{formatCurrency(debt.current_balance, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-terminal-muted">{t('original')}</span>
          <span className="text-white">{formatCurrency(debt.original_amount, currency)}</span>
        </div>
        {debt.interest_rate > 0 && (
          <div className="flex justify-between">
            <span className="text-terminal-muted">{t('interestRate')}</span>
            <span className="text-yellow-400">{debt.interest_rate}% / yr</span>
          </div>
        )}
        {debt.minimum_payment && (
          <div className="flex justify-between">
            <span className="text-terminal-muted">{t('minPayment')}</span>
            <span className="text-white">{formatCurrency(debt.minimum_payment, currency)}</span>
          </div>
        )}
        {debt.due_day && (
          <div className="flex justify-between">
            <span className="text-terminal-muted">{t('dueDay')}</span>
            <span className="text-white">{t('dayNumber', { day: debt.due_day })}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all bg-green-400"
          style={{ width: `${pctPaid}%` }}
        />
      </div>
      <p className="text-[9px] font-mono text-terminal-muted mb-3">{t('pctPaidOff', { pct: pctPaid.toFixed(0) })}</p>

      {!debt.is_paid_off && (
        <button
          onClick={() => onPayment(debt)}
          className="w-full py-2 text-[11px] font-mono font-bold border border-green-400/30 text-green-400 rounded hover:bg-green-400/10 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
        >
          <Plus size={12} />
          {t('logPayment')}
        </button>
      )}
    </div>
  );
}
