import React, { useState } from 'react';
import { Plus } from '@shared/icons';
import { useBudgets } from '../../hooks/useBudgets';
import { BudgetCard } from './BudgetCard';
import { BudgetModal } from './BudgetModal';
import { TransactionCategory, Currency } from '../../types';
import { toast } from 'sonner';

interface Props {
  month: number;
  year: number;
  currency: Currency;
  categories: TransactionCategory[];
}

export function BudgetsTab({ month, year, currency, categories }: Props) {
  const { budgets, loading, refetch } = useBudgets(month, year);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/finance/budgets?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Budget removed');
      refetch();
    } catch {
      toast.error('Failed to remove budget');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          {budgets.length} budget{budgets.length !== 1 ? 's' : ''} this month
        </h3>
        <button onClick={() => setShowModal(true)} className="settings-button-primary flex items-center gap-2 text-xs">
          <Plus size={13} />
          Add Budget
        </button>
      </div>

      {loading ? (
        <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="settings-card p-12 text-center">
          <p className="text-terminal-muted font-mono text-xs">No budgets set for this month. Add one to track your spending limits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map(b => (
            <BudgetCard key={b.id} budget={b} currency={currency} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <BudgetModal
          categories={categories}
          currency={currency}
          month={month}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
