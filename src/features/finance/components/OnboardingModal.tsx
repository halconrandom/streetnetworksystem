import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign } from '@shared/icons';
import { Currency } from '../types';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (!res.ok) throw new Error('Failed to create profile');
      toast.success('Finance module initialized');
      onComplete();
    } catch {
      toast.error('Error initializing finance module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg mx-4"
      >
        <div className="settings-card p-8 border border-terminal-accent/20">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-lg bg-terminal-accent/10 border border-terminal-accent/20">
              <TrendingUp size={20} className="text-terminal-accent" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Finance Setup</h2>
              <p className="text-[10px] text-terminal-muted font-mono uppercase tracking-wider">Step {step} of 3</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-8">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-0.5 flex-1 rounded transition-colors ${s <= step ? 'bg-terminal-accent' : 'bg-white/10'}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-white font-semibold mb-1">Select your currency</h3>
                <p className="text-xs text-terminal-muted mb-6">This setting is permanent. Changing it requires a full finance reset.</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {(['USD', 'COP'] as Currency[]).map(c => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        currency === c
                          ? 'border-terminal-accent bg-terminal-accent/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-terminal-muted hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="font-mono text-xl font-bold mb-1">{c === 'USD' ? '$' : '$'}</div>
                      <div className="font-mono text-sm font-bold">{c}</div>
                      <div className="text-[10px] mt-1 opacity-70">{c === 'USD' ? 'US Dollar' : 'Colombian Peso'}</div>
                    </button>
                  ))}
                </div>
                <button
                  disabled={!currency}
                  onClick={() => setStep(2)}
                  className="settings-button-primary w-full disabled:opacity-30"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-white font-semibold mb-1">Monthly net income</h3>
                <p className="text-xs text-terminal-muted mb-6">Your base salary after taxes. You can update this anytime.</p>
                <div className="relative mb-8">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted font-mono text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    placeholder="0"
                    className="settings-input w-full pl-14 font-mono text-lg"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="settings-button-secondary flex-1">Back</button>
                  <button onClick={() => setStep(3)} className="settings-button-primary flex-1">Continue</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-white font-semibold mb-1">Confirm setup</h3>
                <p className="text-xs text-terminal-muted mb-6">Review your configuration before initializing.</p>
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center p-3 bg-white/[0.03] rounded border border-white/5">
                    <span className="text-xs font-mono text-terminal-muted uppercase tracking-wider">Currency</span>
                    <span className="font-mono text-sm text-white font-bold">{currency}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/[0.03] rounded border border-white/5">
                    <span className="text-xs font-mono text-terminal-muted uppercase tracking-wider">Monthly Salary</span>
                    <span className="font-mono text-sm text-white font-bold">
                      {salary ? `${currency} ${parseFloat(salary).toLocaleString()}` : 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="settings-button-secondary flex-1">Back</button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="settings-button-primary flex-1 disabled:opacity-50"
                  >
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
