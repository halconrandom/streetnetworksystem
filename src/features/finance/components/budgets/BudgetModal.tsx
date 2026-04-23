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

const labelCls = 'text-[10px] font-mono text-terminal-muted uppercase tracking-widest block mb-1.5';
const inputCls = 'w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-sm text-white font-mono outline-none transition-all focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 placeholder:text-white/10';
const selectCls = 'w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-sm text-white font-mono outline-none transition-all focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 appearance-none cursor-pointer';
const btnCancel = 'flex-1 py-3 border border-white/[0.05] text-terminal-muted text-[10px] font-mono font-bold rounded uppercase tracking-widest hover:border-white/10 hover:text-white transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-3 bg-terminal-accent text-white text-[10px] font-mono font-bold rounded uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.2)] hover:shadow-[0_0_30px_rgba(255,0,60,0.4)] hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-xl border border-white/[0.1] bg-[#111111]/95 backdrop-blur-xl overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.9)]">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-right from-transparent via-terminal-accent/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-12 py-8 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex flex-col">
              <span className="text-[14px] font-mono font-bold text-white uppercase tracking-[0.3em]">New Budget Category</span>
              <span className="text-[11px] font-mono text-terminal-muted uppercase tracking-widest mt-1.5">Monthly Planning // {month}/{year}</span>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full text-white/20 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-12 py-12 space-y-10">

              <div>
                <label className={labelCls}>Category</label>
                <div className="relative">
                  <select 
                    value={categoryId} 
                    onChange={e => setCategoryId(e.target.value)} 
                    required 
                    className={selectCls}
                  >
                    <option value="" disabled className="bg-[#0f0f0f]">Select category...</option>
                    {expenseCategories.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0f0f0f] py-2">{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Monthly Limit ({currency})</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={limitAmount} 
                  onChange={e => setLimitAmount(e.target.value)} 
                  required 
                  className={inputCls} 
                  placeholder="0.00" 
                  autoFocus 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">Alert threshold</label>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.03]" style={{ color: thresholdColor }}>
                    {alertThreshold}%
                  </span>
                </div>
                <div className="relative py-2 group">
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={alertThreshold}
                    onChange={e => setAlertThreshold(Number(e.target.value))}
                    className="w-full h-1 bg-white/[0.05] rounded-full appearance-none cursor-pointer accent-terminal-accent"
                  />
                  <div className="flex justify-between mt-3 px-0.5">
                    <span className="text-[9px] font-mono text-white/10 group-hover:text-white/20 transition-colors">10%</span>
                    <span className="text-[9px] font-mono text-white/10 group-hover:text-white/20 transition-colors">95%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-10 border-t border-white/[0.04] bg-white/[0.02] flex gap-8">
              <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? 'Saving...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

