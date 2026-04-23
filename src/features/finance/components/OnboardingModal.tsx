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

const btnPrimary = 'px-8 py-3 bg-terminal-accent text-white text-[9px] font-mono font-bold rounded-lg uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,0,60,0.2)] hover:shadow-[0_0_30px_rgba(255,0,60,0.4)] hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';
const btnSecondary = 'px-8 py-3 border border-white/10 bg-white/[0.02] text-white/40 text-[9px] font-mono font-bold rounded-lg uppercase tracking-[0.2em] hover:border-white/20 hover:text-white transition-all active:scale-[0.98]';
const inputCls = 'bg-black/40 border border-white/5 rounded px-4 py-2 text-white font-mono outline-none transition-all focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 placeholder:text-white/10';

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [currency, setCurrency]   = useState<Currency | null>(null);
  const [salary, setSalary]       = useState('');
  const [displaySalary, setDisplaySalary] = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setSalary('');
      setDisplaySalary('');
      return;
    }
    const num = parseInt(raw, 10);
    setSalary(raw);
    setDisplaySalary(num.toLocaleString('de-DE')); // Uses dots for thousands
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xl">
      <style dangerouslySetInnerHTML={{ __html: `
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}} />
      <motion.div
        initial={{ opacity: 0, scale: 1.02, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-4"
      >
        <div className="relative rounded-2xl border border-white/[0.1] bg-[#111111]/95 backdrop-blur-2xl overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.9)]">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-right from-transparent via-terminal-accent/60 to-transparent" />

          {/* Header */}
          <div className="px-14 py-10 border-b border-white/[0.04] bg-white/[0.02] flex items-center gap-8">
            <div className="p-5 rounded-lg bg-terminal-accent/10 border border-terminal-accent/20 shrink-0 shadow-[0_0_20px_rgba(255,0,60,0.1)]">
              <TrendingUp size={32} className="text-terminal-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-mono font-bold text-white uppercase tracking-[0.4em]">Finance Setup</p>
              <p className="text-[9px] font-mono text-terminal-muted uppercase tracking-[0.2em] mt-1.5">Initial configuration // Step {step} of 3</p>
            </div>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <div className="px-14 py-14">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 bg-terminal-accent rounded-full animate-pulse shadow-[0_0_10px_#ff003c]" />
                    <p className="text-[13px] font-mono font-bold text-white uppercase tracking-widest">Base Currency</p>
                  </div>
                  <p className="text-[11px] text-terminal-muted font-mono mb-8 leading-relaxed uppercase tracking-wider max-w-xl">
                    Choose the primary currency you will use for your accounts. This cannot be changed later.
                  </p>
                  <div className="grid grid-cols-2 gap-8 mb-6">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCurrency(c.value)}
                        className={`p-8 rounded-xl border text-left transition-all duration-300 ${
                          currency === c.value
                            ? 'border-terminal-accent/50 bg-terminal-accent/5 shadow-[0_0_30px_rgba(255,0,60,0.15)] ring-1 ring-terminal-accent/20'
                            : 'border-white/[0.05] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`font-mono text-4xl font-bold mb-4 ${currency === c.value ? 'text-terminal-accent' : 'text-white/20'}`}>{c.symbol}</div>
                        <div className={`font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${currency === c.value ? 'text-white' : 'text-white/40'}`}>{c.value}</div>
                        <div className={`text-[9px] mt-1 font-mono uppercase tracking-widest ${currency === c.value ? 'text-white/40' : 'text-white/20'}`}>{c.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-14 pb-14">
                  <button disabled={!currency} onClick={() => setStep(2)} className={`${btnPrimary} w-full`}>
                    Next Step →
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <div className="px-14 py-14">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 bg-terminal-accent rounded-full animate-pulse shadow-[0_0_10px_#ff003c]" />
                    <p className="text-[13px] font-mono font-bold text-white uppercase tracking-widest">Monthly Income</p>
                  </div>
                  <p className="text-[11px] text-terminal-muted font-mono mb-8 leading-relaxed uppercase tracking-wider max-w-xl">
                    Enter your monthly net salary. This helps calculate your spending capacity.
                  </p>
                  <div className="relative mb-6 group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[16px] font-bold text-terminal-accent/80 tracking-tighter">{currency}</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={displaySalary}
                      onChange={handleSalaryChange}
                      placeholder="0"
                      className="w-full bg-black/60 border border-white/10 pl-24 py-5 text-[22px] font-mono font-bold text-white rounded-xl outline-none focus:border-terminal-accent/40 transition-all"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="px-14 pb-14 flex gap-6">
                  <button onClick={() => setStep(1)} className={btnSecondary}>Back</button>
                  <button onClick={() => setStep(3)} className={`${btnPrimary} flex-[2]`}>Proceed to Finalization →</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <div className="px-14 py-14">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 bg-terminal-accent rounded-full animate-pulse shadow-[0_0_10px_#ff003c]" />
                    <p className="text-[13px] font-mono font-bold text-white uppercase tracking-widest">Final Review</p>
                  </div>
                  <p className="text-[11px] text-terminal-muted font-mono mb-8 leading-relaxed uppercase tracking-wider max-w-xl">
                    Confirm your details to finish the setup.
                  </p>
                  <div className="space-y-6 mb-6">
                    <div className="flex justify-between items-center p-6 rounded-xl bg-white/[0.01] border border-white/[0.05] shadow-inner">
                      <span className="text-[9px] font-mono text-terminal-muted uppercase tracking-[0.3em]">Selected Currency</span>
                      <span className="font-mono text-[16px] text-white font-bold">{currency}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 rounded-xl bg-white/[0.01] border border-white/[0.05] shadow-inner">
                      <span className="text-[9px] font-mono text-terminal-muted uppercase tracking-[0.3em]">Monthly Salary</span>
                      <span className="font-mono text-[16px] text-white font-bold">
                        {salary ? `${currency} ${parseFloat(salary).toLocaleString()}` : <span className="text-white/20">Not set</span>}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-14 pb-14 flex gap-6">
                  <button onClick={() => setStep(2)} className={btnSecondary}>Modify</button>
                  <button onClick={handleConfirm} disabled={loading} className={`${btnPrimary} flex-[2]`}>
                    {loading ? 'Setting up...' : 'Finish Setup'}
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

