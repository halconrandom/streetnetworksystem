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

const labelCls = 'text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5';
const btnCancel = 'flex-1 py-2.5 border border-white/[0.08] text-white/40 text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest hover:border-white/[0.15] hover:text-white/60 transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-2.5 bg-[#ff003c] text-white text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest shadow-[0_0_14px_rgba(255,0,60,0.2)] hover:shadow-[0_0_22px_rgba(255,0,60,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

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
            <div>
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Log Payment</span>
              <p className="text-[10px] font-mono text-white/30 mt-0.5">
                {debt.creditor_name} · <span className="text-[#ff003c]">{formatCurrency(debt.current_balance, currency)}</span> remaining
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount ({currency})</label>
                  <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus className="settings-input w-full" />
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="settings-input w-full" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Note <span className="normal-case text-white/20">(optional)</span></label>
                <input value={note} onChange={e => setNote(e.target.value)} className="settings-input w-full" placeholder="Monthly payment, extra payment..." />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? 'Saving...' : 'Log Payment'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
