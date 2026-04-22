'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MetricCards } from './MetricCards';
import { useOverview } from '../../hooks/useOverview';
import { Currency } from '../../types';

const CategoryPieChart = dynamic(() => import('./CategoryPieChart').then(m => ({ default: m.CategoryPieChart })), { ssr: false });
const MonthlyBarChart = dynamic(() => import('./MonthlyBarChart').then(m => ({ default: m.MonthlyBarChart })), { ssr: false });
const BurnRateLineChart = dynamic(() => import('./BurnRateLineChart').then(m => ({ default: m.BurnRateLineChart })), { ssr: false });

interface Props {
  month: number;
  year: number;
  currency: Currency;
  salary: number;
}

export function OverviewTab({ month, year, currency, salary }: Props) {
  const { data, loading } = useOverview(month, year);

  return (
    <div className="p-6 space-y-6">
      {loading ? (
        <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading overview...</div>
      ) : (
        <>
          <MetricCards data={data} salary={salary} currency={currency} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="settings-card p-4">
              <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest mb-4">Expenses by Category</h3>
              <CategoryPieChart data={data?.by_category ?? []} currency={currency} />
            </div>
            <div className="settings-card p-4">
              <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest mb-4">Monthly History</h3>
              <MonthlyBarChart data={data?.monthly_history ?? []} currency={currency} />
            </div>
            <div className="settings-card p-4">
              <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest mb-4">Burn Rate</h3>
              <BurnRateLineChart data={data?.daily_burn ?? []} salary={salary} currency={currency} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
