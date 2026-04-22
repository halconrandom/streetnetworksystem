import { useState, useEffect } from 'react';
import { SavingsGoal } from '../types';

interface GoalsState {
  goals: SavingsGoal[];
  loading: boolean;
  refetch: () => void;
}

export function useSavingsGoals(): GoalsState {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/finance/goals', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!cancelled) setGoals(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setGoals([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  return { goals, loading, refetch: () => setTick(t => t + 1) };
}
