import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@shared/icons';
import { SavingsGoal, Currency } from '../../types';
import { toast } from 'sonner';

interface Props {
  goal: SavingsGoal;
  currency: Currency;
  onClose: () => void;
  onSaved: () => void;
}

export function ContributionModal({ goal, currency, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/goals/${goal.id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: parseFloat(amount), note: note || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('Contribution added');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to add contribution');
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
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Add Funds</h3>
              <p className="text-[10px] text-terminal-muted font-mono mt-0.5">{goal.name}</p>
            </div>
            <button onClick={onClose} className="text-terminal-muted hover:text-white"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Amount ({currency})</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus className="settings-input w-full font-mono" placeholder="100.00" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} className="settings-input w-full" placeholder="Bonus, transfer..." />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="settings-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="settings-button-primary flex-1 disabled:opacity-50">{loading ? '...' : 'Contribute'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
