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

const labelCls = 'text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5';
const btnCancel = 'flex-1 py-2.5 border border-white/[0.08] text-white/40 text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest hover:border-white/[0.15] hover:text-white/60 transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-2.5 bg-[#ff003c] text-white text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest shadow-[0_0_14px_rgba(255,0,60,0.2)] hover:shadow-[0_0_22px_rgba(255,0,60,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

export function BudgetModal({ categories, currency, month, year, onClose, onSaved }: Props) {
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const [categoryId, setCategoryId]       = useState('');
  const [limitAmount, setLimitAmount]     = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [loading, setLoading]             = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !limitAmount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category_id: categoryId, month, year, limit_amount: parseFloat(limitAmount), alert_threshold: alertThreshold }),
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

  const thresholdColor = alertThreshold >= 80 ? '#ff003c' : alertThreshold >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="rounded-xl border border-white/[0.07] bg-[#0f0f0f] overflow-hidden shadow-2xl shadow-black/60">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">New Budget</span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">

              <div>
                <label className={labelCls}>Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="settings-select w-full">
                  <option value="">Select category...</option>
                  {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Monthly Limit ({currency})</label>
                <input type="number" min="0" step="0.01" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} required className="settings-input w-full" placeholder="500.00" autoFocus />
              </div>

              {/* Alert threshold with live value */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls.replace('block mb-1.5', '')}>Alert threshold</label>
                  <span className="text-[11px] font-mono font-bold" style={{ color: thresholdColor }}>{alertThreshold}%</span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={alertThreshold}
                    onChange={e => setAlertThreshold(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10"
                    style={{ accentColor: thresholdColor }}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] font-mono text-white/20">10%</span>
                    <span className="text-[9px] font-mono text-white/20">95%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? 'Creating...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
