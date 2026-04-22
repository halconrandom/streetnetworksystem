import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFinanceProfile } from '../hooks/useFinanceProfile';
import { useRecurring } from '../hooks/useRecurring';
import { OnboardingModal } from './OnboardingModal';
import { RecurringPrompt } from './RecurringPrompt';
import { MonthNavigator } from './MonthNavigator';
import { OverviewTab } from './overview/OverviewTab';
import { TransactionsTab } from './transactions/TransactionsTab';
import { BudgetsTab } from './budgets/BudgetsTab';
import { GoalsTab } from './goals/GoalsTab';
import { DebtsTab } from './debts/DebtsTab';
import { MarketTab } from './market/MarketTab';
import { FinanceTab, TransactionCategory } from '../types';

const TABS: { id: FinanceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'goals', label: 'Goals' },
  { id: 'debts', label: 'Debts' },
  { id: 'market', label: 'Market' },
];

export function FinanceShell() {
  const { profile, exists, loading, refetch: refetchProfile } = useFinanceProfile();

  const now = new Date();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [recurringDismissed, setRecurringDismissed] = useState(false);

  const { pending, refetch: refetchRecurring } = useRecurring();

  // Load categories once profile exists
  React.useEffect(() => {
    if (!exists) return;
    fetch('/api/finance/categories', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [exists]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    const n = new Date();
    if (year < n.getFullYear() || (year === n.getFullYear() && month < n.getMonth() + 1)) {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="animate-pulse font-mono text-xs text-terminal-muted uppercase tracking-widest">Initializing Finance...</span>
      </div>
    );
  }

  if (!exists) {
    return <OnboardingModal onComplete={refetchProfile} />;
  }

  const currency = profile!.currency;
  const salary = profile!.monthly_salary;

  const showRecurringPrompt = pending.length > 0 && !recurringDismissed;

  return (
    <div className="flex flex-col h-full">
      {/* Recurring prompt */}
      <AnimatePresence>
        {showRecurringPrompt && (
          <RecurringPrompt
            pending={pending}
            currency={currency}
            onApplied={() => { refetchRecurring(); setRecurringDismissed(true); }}
            onDismiss={() => setRecurringDismissed(true)}
          />
        )}
      </AnimatePresence>

      {/* Tab bar + month navigator */}
      <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-white/5">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-widest rounded-t transition-all relative ${
                activeTab === tab.id
                  ? 'text-white bg-white/5'
                  : 'text-terminal-muted hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-accent" />
              )}
            </button>
          ))}
        </div>
        {activeTab !== 'market' && (
          <MonthNavigator month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <OverviewTab month={month} year={year} currency={currency} salary={salary} />
        )}
        {activeTab === 'transactions' && (
          <TransactionsTab month={month} year={year} currency={currency} categories={categories} />
        )}
        {activeTab === 'budgets' && (
          <BudgetsTab month={month} year={year} currency={currency} categories={categories} />
        )}
        {activeTab === 'goals' && <GoalsTab currency={currency} />}
        {activeTab === 'debts' && <DebtsTab currency={currency} />}
        {activeTab === 'market' && <MarketTab currency={currency} />}
      </div>
    </div>
  );
}
