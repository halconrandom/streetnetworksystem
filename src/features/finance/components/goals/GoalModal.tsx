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

export function GoalModal({ currency, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/finance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, target_amount: parseFloat(targetAmount), deadline: deadline || null, notes: notes || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('Goal created');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="settings-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">New Savings Goal</h3>
            <button onClick={onClose} className="text-terminal-muted hover:text-white"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Goal Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="settings-input w-full" placeholder="Emergency Fund, New Laptop..." />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Target Amount ({currency})</label>
              <input type="number" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required className="settings-input w-full font-mono" placeholder="5000.00" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Target Date (optional)</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="settings-input w-full font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider block mb-1.5">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="settings-textarea w-full" placeholder="Why this goal matters..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="settings-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="settings-button-primary flex-1 disabled:opacity-50">{loading ? 'Creating...' : 'Create Goal'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
