import React, { useState, useEffect } from 'react';
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

export function TransactionModal({ transaction, categories, currency, onClose, onSaved }: Props) {
  const isEdit = !!transaction;
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? '');
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="settings-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">
              {isEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <button onClick={onClose} className="text-terminal-muted hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(['expense', 'income'] as TransactionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCategoryId(''); }}
                  className={`flex-1 py-2 text-[11px] font-mono font-bold rounded border uppercase tracking-wider transition-all ${
                    type === t
                      ? t === 'expense'
                        ? 'bg-terminal-accent/20 border-terminal-accent text-terminal-accent'
                        : 'bg-green-400/20 border-green-400 text-green-400'
                      : 'border-white/10 text-terminal-muted hover:border-white/20'
                  }`}
                >
                  {t === 'expense' ? '− Expense' : '+ Income'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Amount ({currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="settings-input w-full font-mono"
                placeholder="0.00"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="settings-input w-full"
                placeholder="Netflix, Rent, Salary..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="settings-input w-full font-mono"
              >
                <option value="">Uncategorized</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="settings-input w-full font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="settings-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="settings-button-primary flex-1 disabled:opacity-50">
                {loading ? 'Saving...' : isEdit ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
