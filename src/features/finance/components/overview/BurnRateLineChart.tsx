import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { OverviewData, Currency, formatCurrency } from '../../types';
import { CHART_THEME } from './chartTheme';

interface Props {
  data: OverviewData['daily_burn'];
  salary: number;
  currency: Currency;
}

const CyberTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: CHART_THEME.fontFamily, fontSize: 10, margin: '0 0 4px' }}>Day {label}</p>
      <p style={{ color: CHART_THEME.expenseColor, fontFamily: CHART_THEME.fontFamily, fontSize: 11, margin: 0, fontWeight: 'bold' }}>
        Spent: {formatCurrency(payload[0]?.value ?? 0, currency)}
      </p>
    </div>
  );
};

export function BurnRateLineChart({ data, salary, currency }: Props) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-terminal-muted font-mono text-xs">
        No spending data this month
      </div>
    );
  }

  const chartData = data.map(d => ({
    day: new Date(d.date).getDate(),
    spent: parseFloat(d.cumulative_expense as any),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid stroke={CHART_THEME.gridColor} />
        <XAxis
          dataKey="day"
          tick={{ fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize, fill: CHART_THEME.axisColor }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Day', position: 'insideBottomRight', offset: -5, style: { fontFamily: CHART_THEME.fontFamily, fontSize: 9, fill: CHART_THEME.axisColor } }}
        />
        <YAxis
          tick={{ fontFamily: CHART_THEME.fontFamily, fontSize: CHART_THEME.fontSize, fill: CHART_THEME.axisColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
        />
        <Tooltip content={<CyberTooltip currency={currency} />} />
        {salary > 0 && (
          <ReferenceLine
            y={salary}
            stroke="rgba(34, 197, 94, 0.3)"
            strokeDasharray="4 2"
            label={{ value: 'Salary', position: 'right', style: { fontFamily: CHART_THEME.fontFamily, fontSize: 9, fill: 'rgba(34,197,94,0.5)' } }}
          />
        )}
        <Line
          type="monotone"
          dataKey="spent"
          stroke={CHART_THEME.expenseColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: CHART_THEME.expenseColor, stroke: 'transparent' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
