import React, { useState } from 'react';
import { Plus } from '@shared/icons';
import { useDebts } from '../../hooks/useDebts';
import { DebtCard } from './DebtCard';
import { DebtModal } from './DebtModal';
import { PaymentModal } from './PaymentModal';
import { Debt, Currency } from '../../types';
import { toast } from 'sonner';

interface Props {
  currency: Currency;
}

export function DebtsTab({ currency }: Props) {
  const { debts, loading, refetch } = useDebts();
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/finance/debts?id=${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('Debt removed');
      refetch();
    } catch {
      toast.error('Failed to remove debt');
    }
  };

  const totalBalance = debts.filter(d => !d.is_paid_off).reduce((s, d) => s + d.current_balance, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
            {debts.filter(d => !d.is_paid_off).length} active debt{debts.filter(d => !d.is_paid_off).length !== 1 ? 's' : ''}
          </h3>
        </div>
        <button onClick={() => setShowDebtModal(true)} className="settings-button-primary flex items-center gap-2 text-xs">
          <Plus size={13} />
          Add Debt
        </button>
      </div>

      {loading ? (
        <div className="text-terminal-muted font-mono text-xs animate-pulse">Loading debts...</div>
      ) : debts.length === 0 ? (
        <div className="settings-card p-12 text-center">
          <p className="text-terminal-muted font-mono text-xs">No debts tracked. Add one to start monitoring your liabilities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {debts.map(d => (
            <DebtCard key={d.id} debt={d} currency={currency} onPayment={setPayingDebt} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showDebtModal && <DebtModal currency={currency} onClose={() => setShowDebtModal(false)} onSaved={refetch} />}
      {payingDebt && (
        <PaymentModal
          debt={payingDebt}
          currency={currency}
          onClose={() => setPayingDebt(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
