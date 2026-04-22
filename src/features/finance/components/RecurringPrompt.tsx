import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, AlertTriangle } from '@shared/icons';
import { RecurringTemplate, formatCurrency, Currency } from '../types';
import { toast } from 'sonner';

interface Props {
  pending: RecurringTemplate[];
  currency: Currency;
  onApplied: () => void;
  onDismiss: () => void;
}

export function RecurringPrompt({ pending, currency, onApplied, onDismiss }: Props) {
  const [loading, setLoading] = useState(false);

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
      toast.success(`Applied ${data.applied} recurring transaction${data.applied !== 1 ? 's' : ''}`);
      onApplied();
    } catch {
      toast.error('Failed to apply recurring transactions');
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
              {pending.length} recurring transaction{pending.length !== 1 ? 's' : ''} pending
            </p>
            <div className="space-y-0.5">
              {pending.slice(0, 3).map(t => (
                <p key={t.id} className="text-[11px] font-mono text-terminal-muted">
                  <span className={t.type === 'income' ? 'text-green-400' : 'text-terminal-accent'}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </span>
                  {' '}{t.description || 'Unnamed'} · {t.frequency}
                </p>
              ))}
              {pending.length > 3 && (
                <p className="text-[10px] text-terminal-muted">+{pending.length - 3} more</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-[11px] font-mono font-bold text-terminal-muted hover:text-white border border-white/10 rounded transition-colors uppercase tracking-wider"
          >
            Dismiss
          </button>
          <button
            onClick={applyAll}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-mono font-bold bg-terminal-accent text-white rounded hover:bg-terminal-accent/80 transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? '...' : 'Apply All'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
