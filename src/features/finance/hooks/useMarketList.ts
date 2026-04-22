import { useState, useEffect } from 'react';
import { MarketItem } from '../types';

interface MarketState {
  items: MarketItem[];
  loading: boolean;
  refetch: () => void;
}

export function useMarketList(): MarketState {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/finance/market', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (!cancelled) setItems(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  return { items, loading, refetch: () => setTick(t => t + 1) };
}
