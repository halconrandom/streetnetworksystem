'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Plus, Trash2, Calendar } from '@shared/icons';
import { Currency, TransactionCategory, formatCurrency } from '../../types';
import { toast } from 'sonner';

interface Props {
  categories: TransactionCategory[];
  currency: Currency;
  onClose: () => void;
  onSaved: () => void;
}

const btnPrimary = "w-full py-5 bg-terminal-accent text-white text-[11px] font-mono font-bold rounded-lg uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_45px_rgba(255,0,60,0.5)] hover:brightness-110 transition-all active:scale-[0.99] disabled:opacity-30";
const btnSecondary = "px-6 py-4 border border-white/10 text-terminal-muted text-[11px] font-mono font-bold rounded-lg uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all";
const inputCls = "w-full bg-black/60 border border-white/10 rounded-lg px-6 py-4 text-white font-mono text-sm outline-none focus:border-terminal-accent/50 transition-all placeholder:text-white/10";
const labelCls = "block text-[10px] font-mono text-terminal-muted uppercase tracking-[0.2em] mb-2 ml-1";

export function IncomeModal({ categories, currency, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Filter unique categories by name to avoid duplicates
  const incomeCategories = Array.from(new Map(
    categories.filter(c => c.type === 'income').map(c => [c.name, c])
  ).values());
  
  // Default entry
  const [entries, setEntries] = useState([
    { category_id: incomeCategories[0]?.id || '', amount: '', displayAmount: '', description: '', date: new Date().toISOString().split('T')[0] }
  ]);

  const formatAmount = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw === '') return { raw: '', display: '' };
    const num = parseInt(raw, 10);
    return { raw, display: num.toLocaleString('de-DE') };
  };

  const addEntry = () => {
    setEntries([...entries, { 
      category_id: incomeCategories[0]?.id || '', 
      amount: '', 
      displayAmount: '',
      description: '', 
      date: new Date().toISOString().split('T')[0] 
    }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const next = [...entries];
    (next[index] as any)[field] = value;
    setEntries(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const promises = entries.map(entry => {
        if (!entry.amount || parseFloat(entry.amount) <= 0) return null;
        return fetch('/api/finance/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category_id: entry.category_id,
            type: 'income',
            amount: parseFloat(entry.amount),
            description: entry.description || 'Income Entry',
            date: entry.date,
          }),
        });
      }).filter(Boolean);

      if (promises.length === 0) {
        toast.error('Please enter at least one valid amount');
        setLoading(false);
        return;
      }

      const responses = await Promise.all(promises);
      for (const res of responses) {
        if (res && !res.ok) {
          if (res.status === 401) throw new Error('Session expired. Please refresh the page.');
          throw new Error('Server error');
        }
      }

      toast.success('Income recorded successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-3xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-xl border border-white/[0.1] bg-[#111111]/95 backdrop-blur-xl overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.9)]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-right from-transparent via-terminal-accent/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-12 py-8 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex flex-col">
              <span className="text-[14px] font-mono font-bold text-white uppercase tracking-[0.3em]">Record Income</span>
              <span className="text-[11px] font-mono text-terminal-muted uppercase tracking-widest mt-1.5">Add salary, bonuses or extra revenue</span>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full text-white/20 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-12 py-10 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
              {entries.map((entry, idx) => (
                <div key={idx} className="relative p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-6 group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-terminal-accent uppercase tracking-[0.2em]">Source #{idx + 1}</span>
                    {entries.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeEntry(idx)}
                        className="text-white/10 hover:text-terminal-accent transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelCls}>Category</label>
                      <select
                        value={entry.category_id}
                        onChange={e => updateEntry(idx, 'category_id', e.target.value)}
                        className={inputCls}
                        required
                      >
                        {incomeCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Amount ({currency})</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={entry.displayAmount}
                        onChange={e => {
                          const { raw, display } = formatAmount(e.target.value);
                          const next = [...entries];
                          next[idx].amount = raw;
                          next[idx].displayAmount = display;
                          setEntries(next);
                        }}
                        className={inputCls}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelCls}>Description</label>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={e => updateEntry(idx, 'description', e.target.value)}
                        className={inputCls}
                        placeholder="Source description..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Date</label>
                      <div className="relative group/date">
                        <input
                          type="date"
                          value={entry.date}
                          onChange={e => updateEntry(idx, 'date', e.target.value)}
                          className={`${inputCls} pr-12`}
                          required
                          id={`date-${idx}`}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`date-${idx}`) as HTMLInputElement;
                            if (el && 'showPicker' in el) (el as any).showPicker();
                            else el?.focus();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-hover/date:text-terminal-accent transition-colors"
                        >
                          <Calendar size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={addEntry}
                className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[11px] font-mono text-terminal-muted hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Another Source
              </button>
            </div>

            <div className="px-12 py-10 border-t border-white/[0.04] bg-white/[0.02] flex gap-8">
              <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Recording...' : 'Register All Income'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
