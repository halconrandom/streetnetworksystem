import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, PiggyBank } from '@shared/icons';
import { OverviewData, Currency, formatCurrency } from '../../types';

interface Props {
  data: OverviewData | null;
  salary: number;
  currency: Currency;
}

export function MetricCards({ data, salary, currency }: Props) {
  const income = data?.total_income ?? 0;
  const expenses = data?.total_expenses ?? 0;
  const balance = data?.net_balance ?? 0;
  const savingsRate = data?.savings_rate ?? 0;

  const cards = [
    {
      label: 'Total Income',
      value: formatCurrency(income, currency),
      icon: ArrowUpCircle,
      color: 'text-green-400',
      borderColor: 'border-green-400/20',
      bgColor: 'bg-green-400/5',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(expenses, currency),
      icon: ArrowDownCircle,
      color: 'text-terminal-accent',
      borderColor: 'border-terminal-accent/20',
      bgColor: 'bg-terminal-accent/5',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(balance, currency),
      icon: Wallet,
      color: balance >= 0 ? 'text-green-400' : 'text-terminal-accent',
      borderColor: balance >= 0 ? 'border-green-400/20' : 'border-terminal-accent/20',
      bgColor: balance >= 0 ? 'bg-green-400/5' : 'bg-terminal-accent/5',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      icon: PiggyBank,
      color: savingsRate >= 20 ? 'text-green-400' : savingsRate >= 0 ? 'text-yellow-400' : 'text-terminal-accent',
      borderColor: 'border-white/10',
      bgColor: 'bg-white/[0.02]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, color, borderColor, bgColor }) => (
        <div
          key={label}
          className={`p-4 rounded-lg border ${borderColor} ${bgColor} flex flex-col gap-3`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">{label}</span>
            <Icon size={14} className={color} />
          </div>
          <span className={`font-mono text-lg font-bold ${color} leading-none`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
