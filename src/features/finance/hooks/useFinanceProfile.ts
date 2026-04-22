import { useState, useEffect } from 'react';
import { FinanceProfile } from '../types';

interface ProfileState {
  profile: FinanceProfile | null;
  exists: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFinanceProfile(): ProfileState {
  const [profile, setProfile] = useState<FinanceProfile | null>(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/finance/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.exists) {
          setExists(true);
          setProfile(data);
        } else {
          setExists(false);
          setProfile(null);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { profile, exists, loading, error, refetch: () => setTick(t => t + 1) };
}
