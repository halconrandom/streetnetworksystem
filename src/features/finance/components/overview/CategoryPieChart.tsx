import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OverviewData, Currency, formatCurrency } from '../../types';
import { CHART_THEME } from './chartTheme';
import { useFinanceI18n } from '../../i18n';

interface Props {
  data: OverviewData['by_category'];
  currency: Currency;
}

const CyberTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ color: payload[0].payload.color, fontFamily: CHART_THEME.fontFamily, fontSize: 11, margin: 0 }}>
        {payload[0].name}
      </p>
      <p style={{ color: '#fff', fontFamily: CHART_THEME.fontFamily, fontSize: 12, margin: '2px 0 0', fontWeight: 'bold' }}>
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  );
};

export function CategoryPieChart({ data, currency }: Props) {
  const { categoryName, t } = useFinanceI18n();

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-terminal-muted font-mono text-xs">
        {t('noExpenseDataThisMonth')}
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    name: categoryName(d.name),
    value: parseFloat(d.total as any),
    color: d.color || CHART_THEME.categoryColors[i % CHART_THEME.categoryColors.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CyberTooltip currency={currency} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontFamily: CHART_THEME.fontFamily, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
