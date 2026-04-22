'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, List, Target, PiggyBank, CreditCard, BarChart2, TrendingUp, Grid } from '@shared/icons';
import { useTransactions } from '../../hooks/useTransactions';
import { useBudgets } from '../../hooks/useBudgets';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';
import { useDebts } from '../../hooks/useDebts';
import { TransactionTable } from '../transactions/TransactionTable';
import { TransactionModal } from '../transactions/TransactionModal';
import { BudgetCard } from '../budgets/BudgetCard';
import { BudgetModal } from '../budgets/BudgetModal';
import { GoalCard } from '../goals/GoalCard';
import { GoalModal } from '../goals/GoalModal';
import { ContributionModal } from '../goals/ContributionModal';
import { DebtCard } from '../debts/DebtCard';
import { DebtModal } from '../debts/DebtModal';
import { PaymentModal } from '../debts/PaymentModal';
import { OverviewData, Currency, Transaction, SavingsGoal, Debt, TransactionCategory } from '../../types';
import { toast } from 'sonner';

const CategoryPieChart = dynamic(() => import('./CategoryPieChart').then(m => ({ default: m.CategoryPieChart })), { ssr: false });
const MonthlyBarChart  = dynamic(() => import('./MonthlyBarChart').then(m => ({ default: m.MonthlyBarChart })),  { ssr: false });
const BurnRateLineChart = dynamic(() => import('./BurnRateLineChart').then(m => ({ default: m.BurnRateLineChart })), { ssr: false });

interface Props {
  data: OverviewData | null;
  loading: boolean;
  currency: Currency;
  salary: number;
  month: number;
  year: number;
  categories: TransactionCategory[];
}

const TX_LIMIT = 10;

// ── Button tokens ──────────────────────────────────────────────────────────────
const btnPrimary =
  'flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ff003c] text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg shadow-[0_0_16px_rgba(255,0,60,0.3)] hover:shadow-[0_0_26px_rgba(255,0,60,0.5)] transition-all active:scale-[0.97]';

const btnGhost =
  'flex items-center gap-1.5 px-3.5 py-1.5 border border-white/[0.08] text-white/40 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg hover:border-[#ff003c]/40 hover:text-white/70 transition-all active:scale-[0.97]';

// ── Panel shell ────────────────────────────────────────────────────────────────
interface PanelProps {
  icon: React.ElementType;
  title: string;
  meta?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Panel({ icon: Icon, title, meta, action, children, className = '' }: PanelProps) {
  return (
    <div className={`rounded-xl border border-white/[0.07] bg-[#0c0c0c] overflow-hidden flex flex-col ${className}`}>
      <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.015] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Icon size={13} className="text-[#ff003c]" />
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{title}</span>
          {meta !== undefined && (
            <span className="text-[10px] font-mono text-white/20">{meta}</span>
          )}
        </div>
        {action}
      </div>
      <div className={`p-5 flex-1 ${className.includes('min-h') ? '' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-[11px] font-mono text-white/20">{text}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function OverviewTab({ data, loading, currency, salary, month, year, categories }: Props) {
  // Transactions
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(month, year);
  const [showTxModal, setShowTxModal]   = useState(false);
  const [editTx, setEditTx]             = useState<Transaction | null>(null);
  const [showAllTx, setShowAllTx]       = useState(false);

  // Budgets
  const { budgets, loading: budgetsLoading, refetch: refetchBudgets } = useBudgets(month, year);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Goals
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useSavingsGoals();
  const [showGoalModal, setShowGoalModal]       = useState(false);
  const [contributingTo, setContributingTo]     = useState<SavingsGoal | null>(null);

  // Debts
  const { debts, loading: debtsLoading, refetch: refetchDebts } = useDebts();
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [payingDebt, setPayingDebt]       = useState<Debt | null>(null);

  const activeDebts = debts.filter(d => !d.is_paid_off).length;

  const handleDeleteBudget = async (id: string) => {
    try {
      await fetch(`/api/finance/budgets?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Budget removed');
      refetchBudgets();
    } catch { toast.error('Failed to remove budget'); }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await fetch(`/api/finance/goals?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Goal deleted');
      refetchGoals();
    } catch { toast.error('Failed to delete goal'); }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      await fetch(`/api/finance/debts?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Debt removed');
      refetchDebts();
    } catch { toast.error('Failed to remove debt'); }
  };

  const visibleTx = showAllTx ? transactions : transactions.slice(0, TX_LIMIT);

  return (
    <div className="p-6 space-y-4">

      {/* ── Charts row ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-white/20 font-mono text-xs animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0c] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.015] flex items-center gap-2.5">
              <Grid size={12} className="text-[#ff003c]" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">By Category</span>
            </div>
            <div className="p-4"><CategoryPieChart data={data?.by_category ?? []} currency={currency} /></div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0c] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.015] flex items-center gap-2.5">
              <BarChart2 size={12} className="text-[#ff003c]" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Monthly History</span>
            </div>
            <div className="p-4"><MonthlyBarChart data={data?.monthly_history ?? []} currency={currency} /></div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0c] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.015] flex items-center gap-2.5">
              <TrendingUp size={12} className="text-[#ff003c]" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Burn Rate</span>
            </div>
            <div className="p-4"><BurnRateLineChart data={data?.daily_burn ?? []} salary={salary} currency={currency} /></div>
          </div>
        </div>
      )}

      {/* ── Transactions ──────────────────────────────────────────────────────── */}
      <Panel
        icon={List}
        title="Transactions"
        meta={txLoading ? '' : `· ${transactions.length}`}
        action={
          <button onClick={() => { setEditTx(null); setShowTxModal(true); }} className={btnPrimary}>
            <Plus size={11} /> Add
          </button>
        }
      >
        {txLoading ? (
          <div className="text-white/20 font-mono text-xs animate-pulse py-8 text-center">Loading...</div>
        ) : (
          <>
            <TransactionTable
              transactions={visibleTx}
              currency={currency}
              onEdit={(tx) => { setEditTx(tx); setShowTxModal(true); }}
              onDeleted={refetchTx}
            />
            {transactions.length > TX_LIMIT && (
              <button
                onClick={() => setShowAllTx(v => !v)}
                className="mt-4 w-full py-2 text-[10px] font-mono text-white/20 hover:text-white/50 uppercase tracking-widest transition-colors border-t border-white/[0.04]"
              >
                {showAllTx ? 'Show less' : `Show all ${transactions.length} transactions ↓`}
              </button>
            )}
          </>
        )}
      </Panel>

      {/* ── Budgets · Goals · Debts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6">

        {/* Budgets */}
        <Panel
          icon={Target}
          title="Budgets"
          meta={budgetsLoading ? '' : `· ${budgets.length}`}
          action={
            <button onClick={() => setShowBudgetModal(true)} className={btnGhost}>
              <Plus size={11} /> Add
            </button>
          }
        >
          {budgetsLoading ? (
            <div className="text-white/20 font-mono text-xs animate-pulse">Loading...</div>
          ) : budgets.length === 0 ? (
            <Empty text="No budgets this month." />
          ) : (
            <div className="space-y-3">
              {budgets.map(b => (
                <BudgetCard key={b.id} budget={b} currency={currency} onDelete={handleDeleteBudget} />
              ))}
            </div>
          )}
        </Panel>

        {/* Goals */}
        <Panel
          icon={PiggyBank}
          title="Goals"
          meta={goalsLoading ? '' : `· ${goals.length}`}
          action={
            <button onClick={() => setShowGoalModal(true)} className={btnGhost}>
              <Plus size={11} /> New
            </button>
          }
        >
          {goalsLoading ? (
            <div className="text-white/20 font-mono text-xs animate-pulse">Loading...</div>
          ) : goals.length === 0 ? (
            <Empty text="No savings goals yet." />
          ) : (
            <div className="space-y-3">
              {goals.map(g => (
                <GoalCard key={g.id} goal={g} currency={currency} onContribute={setContributingTo} onDelete={handleDeleteGoal} />
              ))}
            </div>
          )}
        </Panel>

        {/* Debts */}
        <Panel
          icon={CreditCard}
          title="Debts"
          meta={debtsLoading ? '' : `· ${activeDebts} active`}
          action={
            <button onClick={() => setShowDebtModal(true)} className={btnGhost}>
              <Plus size={11} /> Add
            </button>
          }
        >
          {debtsLoading ? (
            <div className="text-white/20 font-mono text-xs animate-pulse">Loading...</div>
          ) : debts.length === 0 ? (
            <Empty text="No debts tracked." />
          ) : (
            <div className="space-y-3">
              {debts.map(d => (
                <DebtCard key={d.id} debt={d} currency={currency} onPayment={setPayingDebt} onDelete={handleDeleteDebt} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showTxModal && (
        <TransactionModal
          transaction={editTx}
          categories={categories}
          currency={currency}
          onClose={() => setShowTxModal(false)}
          onSaved={refetchTx}
        />
      )}
      {showBudgetModal && (
        <BudgetModal
          categories={categories}
          currency={currency}
          month={month}
          year={year}
          onClose={() => setShowBudgetModal(false)}
          onSaved={refetchBudgets}
        />
      )}
      {showGoalModal && (
        <GoalModal currency={currency} onClose={() => setShowGoalModal(false)} onSaved={refetchGoals} />
      )}
      {contributingTo && (
        <ContributionModal
          goal={contributingTo}
          currency={currency}
          onClose={() => setContributingTo(null)}
          onSaved={refetchGoals}
        />
      )}
      {showDebtModal && (
        <DebtModal currency={currency} onClose={() => setShowDebtModal(false)} onSaved={refetchDebts} />
      )}
      {payingDebt && (
        <PaymentModal
          debt={payingDebt}
          currency={currency}
          onClose={() => setPayingDebt(null)}
          onSaved={refetchDebts}
        />
      )}
    </div>
  );
}
