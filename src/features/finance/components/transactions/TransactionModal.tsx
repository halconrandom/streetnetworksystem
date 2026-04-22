import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@shared/icons';
import { Transaction, TransactionCategory, Currency, TransactionType } from '../../types';
import { toast } from 'sonner';

interface Props {
  transaction?: Transaction | null;
  categories: TransactionCategory[];
  currency: Currency;
  onClose: () => void;
  onSaved: () => void;
}

const labelCls = 'text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5';
const inputCls = 'settings-input w-full';
const btnCancel = 'flex-1 py-2.5 border border-white/[0.08] text-white/40 text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest hover:border-white/[0.15] hover:text-white/60 transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-2.5 bg-[#ff003c] text-white text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest shadow-[0_0_14px_rgba(255,0,60,0.2)] hover:shadow-[0_0_22px_rgba(255,0,60,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

export function TransactionModal({ transaction, categories, currency, onClose, onSaved }: Props) {
  const isEdit = !!transaction;
  const [type, setType]               = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount]           = useState(transaction?.amount?.toString() ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [categoryId, setCategoryId]   = useState(transaction?.category_id ?? '');
  const [date, setDate]               = useState(transaction?.date ?? new Date().toISOString().split('T')[0]);
  const [loading, setLoading]         = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast.error('Amount must be positive');
    setLoading(true);
    try {
      const body = { category_id: categoryId || null, type, amount: parseFloat(amount), description, date };
      const res = isEdit
        ? await fetch(`/api/finance/transactions/${transaction!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
        : await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? 'Transaction updated' : 'Transaction added');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="rounded-xl border border-white/[0.07] bg-[#0f0f0f] overflow-hidden shadow-2xl shadow-black/60">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">
              {isEdit ? 'Edit Transaction' : 'New Transaction'}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">

              {/* Type toggle */}
              <div className="flex gap-2 p-1 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                {(['expense', 'income'] as TransactionType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategoryId(''); }}
                    className={`flex-1 py-2 text-[10px] font-mono font-bold rounded-md uppercase tracking-widest transition-all ${
                      type === t
                        ? t === 'expense'
                          ? 'bg-[#ff003c]/15 border border-[#ff003c]/40 text-[#ff003c]'
                          : 'bg-green-400/10 border border-green-400/30 text-green-400'
                        : 'text-white/25 hover:text-white/50 border border-transparent'
                    }`}
                  >
                    {t === 'expense' ? '− Expense' : '+ Income'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className={labelCls}>Amount ({currency})</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className={inputCls} placeholder="0.00" autoFocus={!isEdit} />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Netflix, Rent, Salary..." />
              </div>

              {/* Category + Date side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={`${inputCls} settings-select`}>
                    <option value="">Uncategorized</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputCls} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
