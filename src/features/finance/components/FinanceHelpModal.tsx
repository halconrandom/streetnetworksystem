import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, TrendingUp, DollarSign, Target, CreditCard, Activity } from '@shared/icons';
import { FinanceTranslationKey, useFinanceI18n } from '../i18n';

export type HelpTopic = 'overview' | 'transactions' | 'budgets' | 'debts' | 'goals' | 'market' | 'general';

interface Props {
  topic?: HelpTopic;
  onClose: () => void;
}

const HELP_CONTENT: Record<HelpTopic, { titleKey: FinanceTranslationKey; icon: any; contentKeys: FinanceTranslationKey[] }> = {
  general: {
    titleKey: 'helpGeneralTitle',
    icon: HelpCircle,
    contentKeys: ['helpGeneral1', 'helpGeneral2', 'helpGeneral3']
  },
  overview: {
    titleKey: 'helpOverviewTitle',
    icon: Activity,
    contentKeys: ['helpOverview1', 'helpOverview2', 'helpOverview3']
  },
  transactions: {
    titleKey: 'helpTransactionsTitle',
    icon: DollarSign,
    contentKeys: ['helpTransactions1', 'helpTransactions2', 'helpTransactions3']
  },
  budgets: {
    titleKey: 'helpBudgetsTitle',
    icon: TrendingUp,
    contentKeys: ['helpBudgets1', 'helpBudgets2', 'helpBudgets3']
  },
  debts: {
    titleKey: 'helpDebtsTitle',
    icon: CreditCard,
    contentKeys: ['helpDebts1', 'helpDebts2', 'helpDebts3']
  },
  goals: {
    titleKey: 'helpGoalsTitle',
    icon: Target,
    contentKeys: ['helpGoals1', 'helpGoals2', 'helpGoals3']
  },
  market: {
    titleKey: 'helpMarketTitle',
    icon: Activity,
    contentKeys: ['helpMarket1', 'helpMarket2', 'helpMarket3']
  }
};

export function FinanceHelpModal({ topic = 'general', onClose }: Props) {
  const { t } = useFinanceI18n();
  const data = HELP_CONTENT[topic];
  const title = t(data.titleKey);

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
              <p className="text-[16px] font-mono font-bold text-white uppercase tracking-[0.4em]">{t('help')} // {title}</p>
              <p className="text-[11px] font-mono text-terminal-muted uppercase tracking-[0.2em] mt-1.5">{t('documentationInstructions')}</p>
            </div>
            <button onClick={onClose} className="p-3 rounded-full text-white/20 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-14 py-12 space-y-8">
            {data.contentKeys.map((itemKey, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-terminal-accent/40 group-hover:bg-terminal-accent group-hover:shadow-[0_0_10px_#ff003c] transition-all" />
                <p className="text-[14px] font-mono text-white/70 leading-relaxed uppercase tracking-wider group-hover:text-white transition-colors">
                  {t(itemKey)}
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
              {t('close')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
