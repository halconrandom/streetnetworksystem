import React, { useState } from 'react';
import { Trash2 } from '@shared/icons';
import { Transaction, Currency, formatCurrency } from '../../types';
import { toast } from 'sonner';
import { useFinanceI18n } from '../../i18n';

interface Props {
  transactions: Transaction[];
  currency: Currency;
  onEdit: (tx: Transaction) => void;
  onDeleted: () => void;
}

export function TransactionTable({ transactions, currency, onEdit, onDeleted }: Props) {
  const { t, categoryName } = useFinanceI18n();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      toast.success(t('transactionDeleted'));
      onDeleted();
    } catch {
      toast.error(t('failedToDeleteTransaction'));
    } finally {
      setDeletingId(null);
    }
  };

  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-terminal-muted font-mono text-xs">
        {t('noTransactionsThisMonth')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            <th className="pb-3 pr-4 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">{t('date')}</th>
            <th className="pb-3 pr-4 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">{t('description')}</th>
            <th className="pb-3 pr-4 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">{t('category')}</th>
            <th className="pb-3 pr-4 text-[10px] font-mono text-terminal-muted uppercase tracking-widest text-right">{t('amount')}</th>
            <th className="pb-3 text-[10px] font-mono text-terminal-muted uppercase tracking-widest w-8"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr
              key={tx.id}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer group transition-colors"
              onClick={() => onEdit(tx)}
            >
              <td className="py-3 pr-4 font-mono text-[11px] text-terminal-muted">{tx.date}</td>
              <td className="py-3 pr-4 text-sm text-white">
                {tx.description || <span className="text-terminal-muted italic text-xs">{t('noDescription')}</span>}
                {tx.is_recurring && (
                  <span className="ml-2 text-[9px] font-mono bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20 px-1.5 py-0.5 rounded uppercase">rec</span>
                )}
              </td>
              <td className="py-3 pr-4">
                {tx.category_name ? (
                  <span
                    className="inline-block text-[10px] font-mono px-2 py-0.5 rounded border"
                    style={{ color: tx.category_color || '#64748b', borderColor: `${tx.category_color || '#64748b'}33`, background: `${tx.category_color || '#64748b'}0d` }}
                  >
                    {categoryName(tx.category_name)}
                  </span>
                ) : (
                  <span className="text-[10px] text-terminal-muted font-mono">—</span>
                )}
              </td>
              <td className="py-3 pr-4 font-mono text-sm font-bold text-right">
                <span className={tx.type === 'income' ? 'text-green-400' : 'text-terminal-accent'}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                </span>
              </td>
              <td className="py-3" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={deletingId === tx.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-terminal-muted hover:text-terminal-accent transition-all rounded"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10">
            <td colSpan={3} className="pt-3 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
              {t('totalExpensesFooter')}
            </td>
            <td className="pt-3 font-mono text-sm font-bold text-terminal-accent text-right">
              {formatCurrency(
                transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
                currency
              )}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
