import { useState, useEffect } from 'react';
import { RecurringTemplate } from '../types';

interface RecurringState {
  templates: RecurringTemplate[];
  pending: RecurringTemplate[];
  loading: boolean;
  refetch: () => void;
}

export function useRecurring(): RecurringState {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/finance/recurring', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setTemplates([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  const today = new Date().toISOString().split('T')[0];
  const pending = templates.filter(t => t.next_due <= today);

  return { templates, pending, loading, refetch: () => setTick(t => t + 1) };
}
