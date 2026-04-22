import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from '@shared/icons';
import { Currency } from '../types';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'COP', label: 'Colombian Peso', symbol: '$' },
];

const btnPrimary = 'w-full py-2.5 bg-[#ff003c] text-white text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest shadow-[0_0_14px_rgba(255,0,60,0.2)] hover:shadow-[0_0_22px_rgba(255,0,60,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';
const btnSecondary = 'flex-1 py-2.5 border border-white/[0.08] text-white/40 text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest hover:border-white/[0.15] hover:text-white/60 transition-all active:scale-[0.98]';

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [currency, setCurrency]   = useState<Currency | null>(null);
  const [salary, setSalary]       = useState('');
  const [loading, setLoading]     = useState(false);

  const handleConfirm = async () => {
    if (!currency) return;
    setLoading(true);
    try {
      const res = await fetch('/api/finance/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currency, monthly_salary: parseFloat(salary) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast.success('Finance module initialized');
      onComplete();
    } catch {
      toast.error('Error initializing finance module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4"
      >
        <div className="rounded-xl border border-white/[0.07] bg-[#0f0f0f] overflow-hidden shadow-2xl shadow-black/70">

          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-[#ff003c]/10 border border-[#ff003c]/20 shrink-0">
              <TrendingUp size={18} className="text-[#ff003c]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Finance Setup</p>
              <p className="text-[10px] font-mono text-white/30 mt-0.5">Step {step} of 3</p>
            </div>
            {/* Step dots */}
            <div className="flex gap-1.5 shrink-0">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`w-5 h-0.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-[#ff003c]' : 'bg-white/10'}`}
                />
              ))}
            </div>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                <div className="px-6 py-5">
                  <p className="text-sm font-semibold text-white mb-1">Select your currency</p>
                  <p className="text-[11px] text-white/30 font-mono mb-5">This setting is permanent and requires a full reset to change.</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCurrency(c.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          currency === c.value
                            ? 'border-[#ff003c]/50 bg-[#ff003c]/8 shadow-[0_0_12px_rgba(255,0,60,0.1)]'
                            : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className={`font-mono text-2xl font-bold mb-2 ${currency === c.value ? 'text-[#ff003c]' : 'text-white/40'}`}>{c.symbol}</div>
                        <div className={`font-mono text-[11px] font-bold uppercase tracking-widest ${currency === c.value ? 'text-white' : 'text-white/50'}`}>{c.value}</div>
                        <div className={`text-[10px] mt-0.5 font-mono ${currency === c.value ? 'text-white/50' : 'text-white/25'}`}>{c.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-6 pb-5">
                  <button disabled={!currency} onClick={() => setStep(2)} className={btnPrimary}>Continue →</button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                <div className="px-6 py-5">
                  <p className="text-sm font-semibold text-white mb-1">Monthly net income</p>
                  <p className="text-[11px] text-white/30 font-mono mb-5">Your take-home salary after taxes. You can update this anytime.</p>
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-white/30 pointer-events-none">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={salary}
                      onChange={e => setSalary(e.target.value)}
                      placeholder="0"
                      className="settings-input w-full pl-14 text-lg font-mono"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                  <button onClick={() => setStep(1)} className={btnSecondary}>← Back</button>
                  <button onClick={() => setStep(3)} className={`${btnPrimary} flex-1 w-auto`}>Continue →</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                <div className="px-6 py-5">
                  <p className="text-sm font-semibold text-white mb-1">Confirm setup</p>
                  <p className="text-[11px] text-white/30 font-mono mb-5">Review before initializing. Currency cannot be changed later.</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Currency</span>
                      <span className="font-mono text-sm text-white font-bold">{currency}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Monthly Salary</span>
                      <span className="font-mono text-sm text-white font-bold">
                        {salary ? `${currency} ${parseFloat(salary).toLocaleString()}` : <span className="text-white/30">Not set</span>}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                  <button onClick={() => setStep(2)} className={btnSecondary}>← Back</button>
                  <button onClick={handleConfirm} disabled={loading} className={`${btnPrimary} flex-1 w-auto`}>
                    {loading ? 'Initializing...' : 'Initialize Finance'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
