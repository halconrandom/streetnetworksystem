import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@shared/icons';
import { Currency } from '../../types';
import { toast } from 'sonner';

interface Props {
  currency: Currency;
  onClose: () => void;
  onSaved: () => void;
}

export function DebtModal({ currency, onClose, onSaved }: Props) {
  const [creditorName, setCreditorName] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/finance/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          creditor_name: creditorName,
          original_amount: parseFloat(originalAmount),
          current_balance: parseFloat(currentBalance || originalAmount),
          interest_rate: parseFloat(interestRate || '0'),
          minimum_payment: minimumPayment ? parseFloat(minimumPayment) : null,
          due_day: dueDay ? parseInt(dueDay) : null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Debt added');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to add debt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="settings-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Add Debt</h3>
            <button onClick={onClose} className="text-terminal-muted hover:text-white"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Creditor</label>
              <input value={creditorName} onChange={e => setCreditorName(e.target.value)} required className="settings-input w-full" placeholder="Credit Card, Bank Loan..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Original Amount ({currency})</label>
                <input type="number" min="0" step="0.01" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} required className="settings-input w-full font-mono" placeholder="5000.00" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Current Balance</label>
                <input type="number" min="0" step="0.01" value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} className="settings-input w-full font-mono" placeholder="Same as original" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Interest %/yr</label>
                <input type="number" min="0" step="0.001" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="settings-input w-full font-mono" placeholder="18.5" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Min. Payment</label>
                <input type="number" min="0" step="0.01" value={minimumPayment} onChange={e => setMinimumPayment(e.target.value)} className="settings-input w-full font-mono" placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Due Day</label>
                <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="settings-input w-full font-mono" placeholder="15" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="settings-textarea w-full" placeholder="Additional details..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="settings-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="settings-button-primary flex-1 disabled:opacity-50">{loading ? 'Adding...' : 'Add Debt'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
