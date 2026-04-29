import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, AlertTriangle } from '@shared/icons';
import { RecurringTemplate, formatCurrency, Currency } from '../types';
import { toast } from 'sonner';
import { useFinanceI18n } from '../i18n';

interface Props {
  pending: RecurringTemplate[];
  currency: Currency;
  onApplied: () => void;
  onDismiss: () => void;
}

export function RecurringPrompt({ pending, currency, onApplied, onDismiss }: Props) {
  const { language, t } = useFinanceI18n();
  const [loading, setLoading] = useState(false);

  const pluralValues = (count: number) => ({
    count,
    suffix: count !== 1 ? (language === 'es' ? 'es' : 's') : '',
    pluralS: count !== 1 ? 's' : '',
  });

  const applyAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/recurring/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_ids: pending.map(t => t.id),
          apply_date: new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error('Failed to apply');
      const data = await res.json();
      toast.success(t('recurringApplied', pluralValues(data.applied)));
      onApplied();
    } catch {
      toast.error(t('failedToApplyRecurring'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-6 mt-4 p-4 bg-terminal-accent/5 border border-terminal-accent/30 rounded-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded bg-terminal-accent/10 mt-0.5">
            <Repeat size={14} className="text-terminal-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              {t('recurringPending', pluralValues(pending.length))}
            </p>
            <div className="space-y-0.5">
              {pending.slice(0, 3).map(template => (
                <p key={template.id} className="text-[11px] font-mono text-terminal-muted">
                  <span className={template.type === 'income' ? 'text-green-400' : 'text-terminal-accent'}>
                    {template.type === 'income' ? '+' : '-'}{formatCurrency(template.amount, currency)}
                  </span>
                  {' '}{template.description || t('unnamed')} · {template.frequency}
                </p>
              ))}
              {pending.length > 3 && (
                <p className="text-[10px] text-terminal-muted">+{pending.length - 3} {t('more')}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-[11px] font-mono font-bold text-terminal-muted hover:text-white border border-white/10 rounded transition-colors uppercase tracking-wider"
          >
            {t('dismiss')}
          </button>
          <button
            onClick={applyAll}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-mono font-bold bg-terminal-accent text-white rounded hover:bg-terminal-accent/80 transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? '...' : t('applyAll')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
