import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OverviewData, Currency, formatCurrency } from '../../types';
import { CHART_THEME } from './chartTheme';
import { financeMonthNames, useFinanceI18n } from '../../i18n';

interface Props {
  data: OverviewData['monthly_history'];
  currency: Currency;
}

const CyberTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: CHART_THEME.fontFamily, fontSize: 10, margin: '0 0 4px' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill, fontFamily: CHART_THEME.fontFamily, fontSize: 11, margin: '1px 0', fontWeight: 'bold' }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

export function MonthlyBarChart({ data, currency }: Props) {
  const { language, t } = useFinanceI18n();

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-terminal-muted font-mono text-xs">
        {t('noHistoricalDataYet')}
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: financeMonthNames[language][d.month - 1].slice(0, 3).toUpperCase(),
    income: parseFloat(d.income as any),
    expenses: parseFloat(d.expenses as any),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barGap={2}>
        <CartesianGrid vertical={false} stroke={CHART_THEME.gridColor} />
        <XAxis
          dataKey="name"
          tick={{ fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize, fill: CHART_THEME.axisColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize, fill: CHART_THEME.axisColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
        />
        <Tooltip content={<CyberTooltip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
        <Legend
          formatter={(v) => (
            <span style={{ fontFamily: CHART_THEME.fontFamily, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{v}</span>
          )}
        />
        <Bar dataKey="income" name={t('income')} fill={CHART_THEME.incomeColor} radius={[2, 2, 0, 0]} maxBarSize={24} />
        <Bar dataKey="expenses" name={t('expenses')} fill={CHART_THEME.expenseColor} radius={[2, 2, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
