import { useState, useEffect } from 'react';
import { Transaction } from '../types';

interface TxState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTransactions(month: number, year: number): TxState {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/finance/transactions?month=${month}&year=${year}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Session expired' : 'Server error');
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        setTransactions(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [month, year, tick]);

  return { transactions, loading, error, refetch: () => setTick(t => t + 1) };
}
