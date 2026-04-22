import React, { useState } from 'react';
import { Plus } from '@shared/icons';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionTable } from './TransactionTable';
import { TransactionModal } from './TransactionModal';
import { TransactionCategory, Transaction, Currency } from '../../types';

interface Props {
  month: number;
  year: number;
  currency: Currency;
  categories: TransactionCategory[];
}

export function TransactionsTab({ month, year, currency, categories }: Props) {
  const { transactions, loading, refetch } = useTransactions(month, year);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const openAdd = () => { setEditTx(null); setShowModal(true); };
  const openEdit = (tx: Transaction) => { setEditTx(tx); setShowModal(true); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </h3>
        <button onClick={openAdd} className="settings-button-primary flex items-center gap-2 text-xs">
          <Plus size={13} />
          Add Transaction
        </button>
      </div>

      <div className="settings-card p-4">
        {loading ? (
          <div className="text-terminal-muted font-mono text-xs animate-pulse py-8 text-center">Loading transactions...</div>
        ) : (
          <TransactionTable
            transactions={transactions}
            currency={currency}
            onEdit={openEdit}
            onDeleted={refetch}
          />
        )}
      </div>

      {showModal && (
        <TransactionModal
          transaction={editTx}
          categories={categories}
          currency={currency}
          onClose={() => setShowModal(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
