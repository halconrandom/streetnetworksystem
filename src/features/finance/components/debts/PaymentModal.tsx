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

export function PaymentModal({ debt, currency, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState(debt.minimum_payment?.toString() ?? '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="settings-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Log Payment</h3>
              <p className="text-[10px] text-terminal-muted font-mono mt-0.5">
                {debt.creditor_name} · Balance: {formatCurrency(debt.current_balance, currency)}
              </p>
            </div>
            <button onClick={onClose} className="text-terminal-muted hover:text-white"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Payment Amount ({currency})</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus className="settings-input w-full font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Date</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="settings-input w-full font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} className="settings-input w-full" placeholder="Monthly payment, extra payment..." />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="settings-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="settings-button-primary flex-1 disabled:opacity-50">{loading ? '...' : 'Log Payment'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
