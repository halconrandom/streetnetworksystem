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

const labelCls = 'text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5';
const btnCancel = 'flex-1 py-2.5 border border-white/[0.08] text-white/40 text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest hover:border-white/[0.15] hover:text-white/60 transition-all active:scale-[0.98]';
const btnSubmit = 'flex-1 py-2.5 bg-[#ff003c] text-white text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest shadow-[0_0_14px_rgba(255,0,60,0.2)] hover:shadow-[0_0_22px_rgba(255,0,60,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';

export function GoalModal({ currency, onClose, onSaved }: Props) {
  const [name, setName]               = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline]       = useState('');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);

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
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">New Savings Goal</span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">

              <div>
                <label className={labelCls}>Goal Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="settings-input w-full" placeholder="Emergency Fund, New Laptop..." autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Target ({currency})</label>
                  <input type="number" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required className="settings-input w-full" placeholder="5000.00" />
                </div>
                <div>
                  <label className={labelCls}>Deadline <span className="normal-case text-white/20">(optional)</span></label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="settings-input w-full" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes <span className="normal-case text-white/20">(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="settings-textarea w-full" placeholder="Why this goal matters..." />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} className={btnSubmit}>
                {loading ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
