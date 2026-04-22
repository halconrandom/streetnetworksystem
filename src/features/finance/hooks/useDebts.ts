import { useState, useEffect } from 'react';
import { Debt } from '../types';

interface DebtsState {
  debts: Debt[];
  loading: boolean;
  refetch: () => void;
}

export function useDebts(): DebtsState {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/finance/debts', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!cancelled) setDebts(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setDebts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  return { debts, loading, refetch: () => setTick(t => t + 1) };
}
