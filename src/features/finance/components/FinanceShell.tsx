import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Globe, HelpCircle } from '@shared/icons';
import { useFinanceProfile } from '../hooks/useFinanceProfile';
import { useRecurring } from '../hooks/useRecurring';
import { useOverview } from '../hooks/useOverview';
import { OnboardingModal } from './OnboardingModal';
import { RecurringPrompt } from './RecurringPrompt';
import { MonthNavigator } from './MonthNavigator';
import { OverviewTab } from './overview/OverviewTab';
import { MarketTab } from './market/MarketTab';
import { FinanceHelpModal, HelpTopic } from './FinanceHelpModal';
import { FinanceTab, TransactionCategory } from '../types';
import { FinanceI18nProvider, FinanceTranslationKey, useFinanceI18n } from '../i18n';

const TABS: { id: FinanceTab; labelKey: FinanceTranslationKey }[] = [
  { id: 'overview', labelKey: 'overview' },
  { id: 'market', labelKey: 'market' },
];

export function FinanceShell() {
  return (
    <FinanceI18nProvider>
      <FinanceShellContent />
    </FinanceI18nProvider>
  );
}

function FinanceLanguageSwitch() {
  const { language, setLanguage, t } = useFinanceI18n();

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1 shrink-0"
      aria-label={t('languageSwitchLabel')}
    >
      <Globe size={13} className="mx-1 text-white/25" />
      {(['en', 'es'] as const).map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          title={lang === 'en' ? t('english') : t('spanish')}
          className={`min-w-8 rounded px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
            language === lang
              ? 'bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/25'
              : 'border border-transparent text-white/30 hover:text-white/70 hover:bg-white/[0.04]'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

function FinanceShellContent() {
  const { t } = useFinanceI18n();
  const { profile, exists, loading, refetch: refetchProfile } = useFinanceProfile();

  const now = new Date();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [recurringDismissed, setRecurringDismissed] = useState(false);
  const [helpTopic, setHelpTopic] = useState<HelpTopic | null>(null);

  const { pending, refetch: refetchRecurring } = useRecurring();
  const { data: overviewData, loading: overviewLoading, refetch: refetchOverview } = useOverview(month, year);

  // Load categories once profile exists
  React.useEffect(() => {
    if (!exists) return;
    fetch('/api/finance/categories', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setCategories([]); return; }
        const seen = new Set<string>();
        setCategories(data.filter(c => {
          const key = `${c.type}:${c.name}`;
          return seen.has(key) ? false : (seen.add(key), true);
        }));
      })
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
        <span className="animate-pulse font-mono text-xs text-terminal-muted uppercase tracking-widest">{t('loadingFinance')}</span>
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
    <div className="flex flex-col h-full relative">
      <AnimatePresence>
        {helpTopic && (
          <FinanceHelpModal topic={helpTopic} onClose={() => setHelpTopic(null)} />
        )}
      </AnimatePresence>

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
        <div className="flex items-center gap-4">
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
                {t(tab.labelKey)}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-accent" />
                )}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setHelpTopic('general')}
            className="p-2 rounded text-terminal-muted hover:text-terminal-accent transition-all"
            title="System Documentation"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== 'market' && (
            <MonthNavigator month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
          )}
          <FinanceLanguageSwitch />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
        {activeTab === 'overview' && (
          <OverviewTab
            data={overviewData}
            loading={overviewLoading}
            currency={currency}
            salary={salary}
            month={month}
            year={year}
            categories={categories}
            onHelp={setHelpTopic}
            refetchOverview={refetchOverview}
          />
        )}
        {activeTab === 'market' && (
          <MarketTab 
            currency={currency} 
            onHelp={setHelpTopic}
          />
        )}
      </div>
    </div>
  );
}
