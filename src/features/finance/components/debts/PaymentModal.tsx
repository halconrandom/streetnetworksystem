import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@shared/icons';
import { Debt, Currency, formatCurrency } from '../../types';
import { toast } from 'sonner';

interface Props {
  debt: Debt;
  currency: Currency;
  onClose: () => void;
  onSaved: () => void;
}

const labelCls = 'text-[10px] font-mono text-terminal-muted uppercase tracking-widest block mb-1.5';
const inputCls = 'w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-sm text-white font-mono outline-none transition-all focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 placeholder:text-white/10';
const btnCancel = 'flex-1 py-3 border border-white/[0.05] text-terminal-muted text-[10px] font-mono font-bold rounded uppercase tracking-widest hover:border-white/10 hover:text-white transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-3 bg-terminal-accent text-white text-[10px] font-mono font-bold rounded uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.2)] hover:shadow-[0_0_30px_rgba(255,0,60,0.4)] hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

export function PaymentModal({ debt, currency, onClose, onSaved }: Props) {
  const [amount, setAmount]           = useState(debt.minimum_payment?.toString() ?? '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote]               = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/debts/${debt.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: parseFloat(amount), payment_date: paymentDate, note: note || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('Payment logged');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to log payment');
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
        className="w-full max-w-xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-xl border border-white/[0.1] bg-[#111111]/95 backdrop-blur-xl overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.9)]">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-right from-transparent via-terminal-accent/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-12 py-8 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="flex flex-col">
              <span className="text-[14px] font-mono font-bold text-white uppercase tracking-[0.3em]">Make a Payment</span>
              <span className="text-[11px] font-mono text-terminal-muted uppercase tracking-widest mt-1.5">
                {debt.creditor_name} // {formatCurrency(debt.current_balance, currency)} Remaining
              </span>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full text-white/20 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-12 py-12 space-y-10">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Amount ({currency})</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required 
                    autoFocus 
                    className={inputCls} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelCls}>Payment Date</label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)} 
                    required 
                    className={inputCls} 
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Reference / Note <span className="normal-case text-white/10">(optional)</span></label>
                <input 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className={inputCls} 
                  placeholder="Monthly installment, extra payoff..." 
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-10 border-t border-white/[0.04] bg-white/[0.02] flex gap-8">
              <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? 'Saving...' : 'Register Payment'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

