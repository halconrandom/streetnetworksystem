import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, TrendingUp, DollarSign, Target, CreditCard, Activity } from '@shared/icons';

export type HelpTopic = 'overview' | 'transactions' | 'budgets' | 'debts' | 'goals' | 'market' | 'general';

interface Props {
  topic?: HelpTopic;
  onClose: () => void;
}

const HELP_CONTENT: Record<HelpTopic, { title: string; icon: any; content: string[] }> = {
  general: {
    title: 'Finance Overview',
    icon: HelpCircle,
    content: [
      'Welcome to your financial dashboard. Here you can track all your money movements.',
      'Use the tabs to switch between transactions, budgets, debts, and goals.',
      'All your data is securely saved and synced with your account.'
    ]
  },
  overview: {
    title: 'Dashboard Summary',
    icon: Activity,
    content: [
      'The summary gives you a quick look at your monthly spending and income.',
      'Spending Rate: See how much you are spending relative to your income.',
      'Charts: Visualize your spending patterns and trends throughout the month.'
    ]
  },
  transactions: {
    title: 'Transaction History',
    icon: DollarSign,
    content: [
      'Record every income and expense to keep your history accurate.',
      'Categories: Group your spending to see where your money goes.',
      'Filters: Use search and filters to find specific transactions quickly.'
    ]
  },
  budgets: {
    title: 'Monthly Budgets',
    icon: TrendingUp,
    content: [
      'Set spending limits for different categories like Food, Rent, or Entertainment.',
      'Alerts: Set limits (like 80%) to get notified before you overspend.',
      'Discipline: Budgets help you stick to your financial plan.'
    ]
  },
  debts: {
    title: 'Debt Tracking',
    icon: CreditCard,
    content: [
      'Keep track of what you owe and your payment progress.',
      'Payments: Log each payment to update your remaining balance.',
      'Progress: See how your debt decreases over time with every payment.'
    ]
  },
  goals: {
    title: 'Savings Goals',
    icon: Target,
    content: [
      'Set targets for things you want to save for, like a vacation or a new car.',
      'Contributions: Add money to your goals to track your progress.',
      'Estimates: See how close you are to reaching your target based on your savings.'
    ]
  },
  market: {
    title: 'Market List',
    icon: Activity,
    content: [
      'Keep a list of things you want to buy or monitor.',
      'Prices: Track estimated prices for items you are interested in.',
      'Planning: Use this list to plan your future purchases.'
    ]
  }
};

export function FinanceHelpModal({ topic = 'general', onClose }: Props) {
  const data = HELP_CONTENT[topic];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-3xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-2xl border border-white/[0.1] bg-[#111111]/95 backdrop-blur-2xl overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.9)]">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-right from-transparent via-terminal-accent/60 to-transparent" />

          {/* Header */}
          <div className="px-12 py-10 border-b border-white/[0.04] bg-white/[0.02] flex items-center gap-6">
            <div className="p-4 rounded-lg bg-terminal-accent/10 border border-terminal-accent/20 shrink-0">
              <data.icon size={28} className="text-terminal-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-mono font-bold text-white uppercase tracking-[0.4em]">Help // {data.title}</p>
              <p className="text-[11px] font-mono text-terminal-muted uppercase tracking-[0.2em] mt-1.5">Documentation & Instructions</p>
            </div>
            <button onClick={onClose} className="p-3 rounded-full text-white/20 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-14 py-12 space-y-8">
            {data.content.map((item, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-terminal-accent/40 group-hover:bg-terminal-accent group-hover:shadow-[0_0_10px_#ff003c] transition-all" />
                <p className="text-[14px] font-mono text-white/70 leading-relaxed uppercase tracking-wider group-hover:text-white transition-colors">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-12 py-8 border-t border-white/[0.04] bg-white/[0.02] flex justify-end">
            <button
              onClick={onClose}
              className="px-10 py-4 bg-terminal-accent text-white text-[11px] font-mono font-bold rounded-lg uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,0,60,0.2)] hover:shadow-[0_0_45px_rgba(255,0,60,0.4)] hover:brightness-110 transition-all active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
