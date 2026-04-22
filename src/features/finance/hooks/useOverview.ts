import { useState, useEffect } from 'react';
import { OverviewData } from '../types';

interface OverviewState {
  data: OverviewData | null;
  loading: boolean;
  refetch: () => void;
}

export function useOverview(month: number, year: number): OverviewState {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/finance/overview?month=${month}&year=${year}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [month, year, tick]);

  return { data, loading, refetch: () => setTick(t => t + 1) };
}
