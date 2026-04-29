import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@shared/icons';
import { Transaction, TransactionCategory, Currency, TransactionType } from '../../types';
import { toast } from 'sonner';
import { useFinanceI18n } from '../../i18n';

interface Props {
  transaction?: Transaction | null;
  categories: TransactionCategory[];
  currency: Currency;
  onClose: () => void;
  onSaved: () => void;
}

const labelCls = 'text-[10px] font-mono text-terminal-muted uppercase tracking-widest block mb-1.5';
const inputCls = 'w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-sm text-white font-mono outline-none transition-all focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 placeholder:text-white/10';
const selectCls = 'w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-sm text-white font-mono outline-none transition-all focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 appearance-none cursor-pointer';
const btnCancel = 'flex-1 py-3 border border-white/[0.05] text-terminal-muted text-[10px] font-mono font-bold rounded uppercase tracking-widest hover:border-white/10 hover:text-white transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-3 bg-terminal-accent text-white text-[10px] font-mono font-bold rounded uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.2)] hover:shadow-[0_0_30px_rgba(255,0,60,0.4)] hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

export function TransactionModal({ transaction, categories, currency, onClose, onSaved }: Props) {
  const { t, categoryName } = useFinanceI18n();
  const isEdit = !!transaction;
  const [type, setType]               = useState<TransactionType>(transaction?.type ?? 'expense');
  const initRaw = transaction?.amount ? String(Math.round(transaction.amount)) : '';
  const [amountRaw, setAmountRaw]         = useState(initRaw);
  const [amountDisplay, setAmountDisplay] = useState(initRaw === '' ? '' : parseInt(initRaw, 10).toLocaleString('de-DE'));
  const [description, setDescription]    = useState(transaction?.description ?? '');
  const [categoryId, setCategoryId]   = useState(transaction?.category_id ?? '');
  const [date, setDate]               = useState(transaction?.date ?? new Date().toISOString().split('T')[0]);
  const [loading, setLoading]         = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountRaw || parseFloat(amountRaw) <= 0) return toast.error(t('amountMustBePositive'));
    setLoading(true);
    try {
      const body = { category_id: categoryId || null, type, amount: parseFloat(amountRaw), description, date };
      const res = isEdit
        ? await fetch(`/api/finance/transactions/${transaction!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
        : await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? t('transactionUpdated') : t('transactionAdded'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('failedToSaveTransaction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-xl border border-white/[0.1] bg-[#111111]/95 backdrop-blur-xl overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.9)]">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-right from-transparent via-terminal-accent/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-12 py-8 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex flex-col">
              <span className="text-[14px] font-mono font-bold text-white uppercase tracking-[0.3em]">
                {isEdit ? t('editTransaction') : t('newTransaction')}
              </span>
              <span className="text-[11px] font-mono text-terminal-muted uppercase tracking-widest mt-1.5">
                {t('financialRecord')} // {isEdit ? `ID: ${transaction?.id.slice(0,8)}` : t('enterDetailsBelow')}
              </span>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full text-white/20 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-12 py-12 space-y-10">

              {/* Type toggle */}
              <div className="flex gap-2 p-1 bg-white/[0.01] rounded border border-white/[0.05]">
                {(['expense', 'income'] as TransactionType[]).map(txType => (
                  <button
                    key={txType}
                    type="button"
                    onClick={() => { setType(txType); setCategoryId(''); }}
                    className={`flex-1 py-2 text-[10px] font-mono font-bold rounded uppercase tracking-widest transition-all ${
                      type === txType
                        ? txType === 'expense'
                          ? 'bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent'
                          : 'bg-green-400/10 border border-green-400/30 text-green-400'
                        : 'text-white/20 hover:text-white/40 border border-transparent'
                    }`}
                  >
                    {txType === 'expense' ? `- ${t('expense')}` : `+ ${t('income')}`}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className={labelCls}>{t('amount')} ({currency})</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAmountRaw(raw);
                    setAmountDisplay(raw === '' ? '' : parseInt(raw, 10).toLocaleString('de-DE'));
                  }}
                  required
                  className={`${inputCls} text-lg font-bold ${type === 'income' ? 'text-green-400' : 'text-white'}`}
                  placeholder="0"
                  autoFocus={!isEdit}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>{t('description')}</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className={inputCls} 
                  placeholder="Netflix, Rent, Salary..." 
                />
              </div>

              {/* Category + Date side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('category')}</label>
                  <div className="relative">
                    <select 
                      value={categoryId} 
                      onChange={e => setCategoryId(e.target.value)} 
                      className={selectCls}
                    >
                      <option value="" className="bg-[#0f0f0f]">{t('uncategorized')}</option>
                      {filteredCategories.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#0f0f0f]">{categoryName(c.name)}</option>
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
                  <label className={labelCls}>{t('date')}</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required 
                    className={inputCls} 
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-10 border-t border-white/[0.04] bg-white/[0.02] flex gap-8">
              <button type="button" onClick={onClose} className={btnCancel}>{t('cancel')}</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? t('saving') : isEdit ? t('saveChanges') : t('addTransaction')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
