import React, { useState } from 'react';
import { useMarketList } from '../../hooks/useMarketList';
import { Currency, formatCurrency } from '../../types';
import { toast } from 'sonner';

interface Props {
  currency: Currency;
}

export function MarketTab({ currency }: Props) {
  const { items, loading, refetch } = useMarketList();
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await fetch('/api/finance/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), quantity: newQty || null, estimated_price: newPrice ? parseFloat(newPrice) : null }),
      });
      setNewName('');
      setNewQty('');
      setNewPrice('');
      refetch();
    } catch {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string, checked: boolean) => {
    await fetch('/api/finance/market', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, is_checked: checked }),
    });
    refetch();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/finance/market?id=${id}`, { method: 'DELETE', credentials: 'include' });
    refetch();
  };

  const handleClearChecked = async () => {
    await fetch('/api/finance/market?checked=true', { method: 'DELETE', credentials: 'include' });
    toast.success('Cleared checked items');
    refetch();
  };

  const estimatedTotal = items
    .filter(i => !i.is_checked && i.estimated_price)
    .reduce((s, i) => s + (i.estimated_price ?? 0), 0);

  const checkedCount = items.filter(i => i.is_checked).length;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="settings-card overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <span className="font-mono text-[10px] text-terminal-accent uppercase tracking-widest">MARKET_LIST.sh</span>
            <div className="flex items-center gap-3">
              {checkedCount > 0 && (
                <button
                  onClick={handleClearChecked}
                  className="text-[10px] font-mono text-terminal-muted hover:text-terminal-accent transition-colors uppercase tracking-wider"
                >
                  Clear Checked ({checkedCount})
                </button>
              )}
              <span className="text-[10px] font-mono text-terminal-muted">{items.length} items</span>
            </div>
          </div>

          {/* Items list */}
          <div className="divide-y divide-white/[0.03] min-h-[120px]">
            {loading ? (
              <div className="p-8 text-center font-mono text-xs text-terminal-muted animate-pulse">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-terminal-muted">Empty list. Add your first item below.</div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] group transition-colors ${item.is_checked ? 'opacity-40' : ''}`}
                >
                  <button
                    onClick={() => handleToggle(item.id, !item.is_checked)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      item.is_checked
                        ? 'bg-terminal-accent/20 border-terminal-accent text-terminal-accent'
                        : 'border-white/20 hover:border-terminal-accent'
                    }`}
                  >
                    {item.is_checked && <span className="text-[10px] font-bold">✓</span>}
                  </button>

                  <span className={`font-mono text-sm flex-1 ${item.is_checked ? 'line-through text-terminal-muted' : 'text-white'}`}>
                    {item.name}
                  </span>

                  {item.quantity && (
                    <span className="font-mono text-[10px] text-terminal-muted">{item.quantity}</span>
                  )}

                  {item.estimated_price && (
                    <span className="font-mono text-[10px] text-terminal-muted">
                      ~{formatCurrency(item.estimated_price, currency)}
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-terminal-muted hover:text-terminal-accent transition-all font-mono text-xs"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add form */}
          <div className="border-t border-white/5 bg-white/[0.01]">
            <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-3">
              <span className="font-mono text-terminal-accent text-sm flex-shrink-0">›</span>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Add item..."
                className="flex-1 bg-transparent font-mono text-sm text-white placeholder-terminal-muted/50 outline-none border-none"
              />
              <input
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                placeholder="qty"
                className="w-16 bg-transparent font-mono text-xs text-terminal-muted placeholder-terminal-muted/30 outline-none border-none text-right"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="price"
                className="w-20 bg-transparent font-mono text-xs text-terminal-muted placeholder-terminal-muted/30 outline-none border-none text-right"
              />
              <button
                type="submit"
                disabled={adding || !newName.trim()}
                className="px-3 py-1 bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent font-mono text-[10px] rounded hover:bg-terminal-accent/20 transition-colors disabled:opacity-30 uppercase tracking-wider"
              >
                Add
              </button>
            </form>
          </div>

          {/* Footer total */}
          {estimatedTotal > 0 && (
            <div className="border-t border-white/5 px-4 py-2 flex justify-between items-center">
              <span className="font-mono text-[10px] text-terminal-muted uppercase tracking-widest">Estimated Total</span>
              <span className="font-mono text-sm font-bold text-white">{formatCurrency(estimatedTotal, currency)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
