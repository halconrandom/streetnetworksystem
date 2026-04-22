import { useState, useEffect } from 'react';
import { Budget } from '../types';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  refetch: () => void;
}

export function useBudgets(month: number, year: number): BudgetState {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/finance/budgets?month=${month}&year=${year}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!cancelled) setBudgets(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setBudgets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [month, year, tick]);

  return { budgets, loading, refetch: () => setTick(t => t + 1) };
}
