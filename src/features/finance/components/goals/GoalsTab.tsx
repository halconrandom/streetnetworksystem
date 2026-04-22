import React, { useState } from 'react';
import { Plus } from '@shared/icons';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';
import { GoalCard } from './GoalCard';
import { GoalModal } from './GoalModal';
import { ContributionModal } from './ContributionModal';
import { SavingsGoal, Currency } from '../../types';
import { toast } from 'sonner';

interface Props {
  currency: Currency;
}

export function GoalsTab({ currency }: Props) {
  const { goals, loading, refetch } = useSavingsGoals();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [contributingTo, setContributingTo] = useState<SavingsGoal | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/finance/goals?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Goal deleted');
      refetch();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          {goals.length} goal{goals.length !== 1 ? 's' : ''}
        </h3>
        <button onClick={() => setShowGoalModal(true)} className="settings-button-primary flex items-center gap-2 text-xs">
          <Plus size={13} />
          New Goal
        </button>
      </div>

      {loading ? (
        <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="settings-card p-12 text-center">
          <p className="text-terminal-muted font-mono text-xs">No savings goals yet. Create one to start tracking your progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} currency={currency} onContribute={setContributingTo} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showGoalModal && <GoalModal currency={currency} onClose={() => setShowGoalModal(false)} onSaved={refetch} />}
      {contributingTo && (
        <ContributionModal
          goal={contributingTo}
          currency={currency}
          onClose={() => setContributingTo(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
