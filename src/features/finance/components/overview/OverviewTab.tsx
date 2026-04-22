'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from '@shared/icons';
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
const MonthlyBarChart = dynamic(() => import('./MonthlyBarChart').then(m => ({ default: m.MonthlyBarChart })), { ssr: false });
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

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">{title}</h2>
      {action}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-white/5" />;
}

export function OverviewTab({ data, loading, currency, salary, month, year, categories }: Props) {
  // Transactions
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(month, year);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showAllTx, setShowAllTx] = useState(false);

  // Budgets
  const { budgets, loading: budgetsLoading, refetch: refetchBudgets } = useBudgets(month, year);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Goals
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useSavingsGoals();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [contributingTo, setContributingTo] = useState<SavingsGoal | null>(null);

  // Debts
  const { debts, loading: debtsLoading, refetch: refetchDebts } = useDebts();
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const handleDeleteBudget = async (id: string) => {
    try {
      await fetch(`/api/finance/budgets?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Budget removed');
      refetchBudgets();
    } catch {
      toast.error('Failed to remove budget');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await fetch(`/api/finance/goals?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Goal deleted');
      refetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      await fetch(`/api/finance/debts?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Debt removed');
      refetchDebts();
    } catch {
      toast.error('Failed to remove debt');
    }
  };

  const visibleTx = showAllTx ? transactions : transactions.slice(0, TX_LIMIT);

  return (
    <div className="p-6 space-y-8">

      {/* ── Charts ─────────────────────────────────────────── */}
      {loading ? (
        <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading overview...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="settings-card p-4">
            <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest mb-4">Expenses by Category</h3>
            <CategoryPieChart data={data?.by_category ?? []} currency={currency} />
          </div>
          <div className="settings-card p-4">
            <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest mb-4">Monthly History</h3>
            <MonthlyBarChart data={data?.monthly_history ?? []} currency={currency} />
          </div>
          <div className="settings-card p-4">
            <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest mb-4">Burn Rate</h3>
            <BurnRateLineChart data={data?.daily_burn ?? []} salary={salary} currency={currency} />
          </div>
        </div>
      )}

      <Divider />

      {/* ── Transactions ───────────────────────────────────── */}
      <section>
        <SectionHeader
          title={txLoading ? 'Transactions' : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
          action={
            <button
              onClick={() => { setEditTx(null); setShowTxModal(true); }}
              className="settings-button-primary flex items-center gap-2 text-xs"
            >
              <Plus size={13} />
              Add Transaction
            </button>
          }
        />
        <div className="settings-card p-4">
          {txLoading ? (
            <div className="text-terminal-muted font-mono text-xs animate-pulse py-8 text-center">Loading transactions...</div>
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
                  className="mt-3 w-full text-center text-[10px] font-mono text-terminal-muted hover:text-white uppercase tracking-widest transition-colors py-1"
                >
                  {showAllTx ? 'Show less' : `Show all ${transactions.length} transactions`}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <Divider />

      {/* ── Budgets ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title={budgetsLoading ? 'Budgets' : `${budgets.length} budget${budgets.length !== 1 ? 's' : ''} this month`}
          action={
            <button
              onClick={() => setShowBudgetModal(true)}
              className="settings-button-primary flex items-center gap-2 text-xs"
            >
              <Plus size={13} />
              Add Budget
            </button>
          }
        />
        {budgetsLoading ? (
          <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="settings-card p-10 text-center">
            <p className="text-terminal-muted font-mono text-xs">No budgets set for this month.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {budgets.map(b => (
              <BudgetCard key={b.id} budget={b} currency={currency} onDelete={handleDeleteBudget} />
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* ── Goals ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title={goalsLoading ? 'Goals' : `${goals.length} goal${goals.length !== 1 ? 's' : ''}`}
          action={
            <button
              onClick={() => setShowGoalModal(true)}
              className="settings-button-primary flex items-center gap-2 text-xs"
            >
              <Plus size={13} />
              New Goal
            </button>
          }
        />
        {goalsLoading ? (
          <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="settings-card p-10 text-center">
            <p className="text-terminal-muted font-mono text-xs">No savings goals yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(g => (
              <GoalCard key={g.id} goal={g} currency={currency} onContribute={setContributingTo} onDelete={handleDeleteGoal} />
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* ── Debts ──────────────────────────────────────────── */}
      <section className="pb-6">
        <SectionHeader
          title={debtsLoading ? 'Debts' : `${debts.filter(d => !d.is_paid_off).length} active debt${debts.filter(d => !d.is_paid_off).length !== 1 ? 's' : ''}`}
          action={
            <button
              onClick={() => setShowDebtModal(true)}
              className="settings-button-primary flex items-center gap-2 text-xs"
            >
              <Plus size={13} />
              Add Debt
            </button>
          }
        />
        {debtsLoading ? (
          <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading debts...</div>
        ) : debts.length === 0 ? (
          <div className="settings-card p-10 text-center">
            <p className="text-terminal-muted font-mono text-xs">No debts tracked.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {debts.map(d => (
              <DebtCard key={d.id} debt={d} currency={currency} onPayment={setPayingDebt} onDelete={handleDeleteDebt} />
            ))}
          </div>
        )}
      </section>

      {/* ── Modals ─────────────────────────────────────────── */}
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
