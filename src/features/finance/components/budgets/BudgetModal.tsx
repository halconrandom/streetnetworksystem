import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@shared/icons';
import { TransactionCategory, Currency } from '../../types';
import { toast } from 'sonner';

interface Props {
  categories: TransactionCategory[];
  currency: Currency;
  month: number;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}

export function BudgetModal({ categories, currency, month, year, onClose, onSaved }: Props) {
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !limitAmount) return;

    setLoading(true);
    try {
      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category_id: categoryId, month, year, limit_amount: parseFloat(limitAmount), alert_threshold: parseFloat(alertThreshold) }),
      });
      if (!res.ok) throw new Error();
      toast.success('Budget created');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="settings-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">New Budget</h3>
            <button onClick={onClose} className="text-terminal-muted hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="settings-input w-full font-mono">
                <option value="">Select category...</option>
                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Monthly Limit ({currency})</label>
              <input type="number" min="0" step="0.01" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} required className="settings-input w-full font-mono" placeholder="500.00" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Alert at ({alertThreshold}%)</label>
              <input type="range" min="10" max="95" step="5" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} className="w-full accent-terminal-accent" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="settings-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="settings-button-primary flex-1 disabled:opacity-50">{loading ? 'Saving...' : 'Create Budget'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
