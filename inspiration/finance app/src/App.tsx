import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Wallet, ShoppingCart, TerminalSquare, Clock, Plus, 
  CheckSquare, Square, Trash2, Tag, Calendar, Target, DollarSign 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TxType = 'in' | 'out';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: TxType;
  category: string;
  date: string;
}

interface MarketItem {
  id: number;
  name: string;
  checked: boolean;
}

const CATEGORIES = [
  'Suscripciones',
  'Alimentación / Mercado', 
  'Vivienda / Utilidades', 
  'Transporte', 
  'Entretenimiento', 
  'Ingreso Extra', 
  'Otro'
];

const WidgetPanel = ({ children, title, icon: Icon, className = '', rightElement = null }: any) => (
  <div className={`bg-[#0d0d0d] border border-neutral-800/60 rounded-md flex flex-col overflow-hidden ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between border-b border-neutral-800/60 p-2.5 bg-[#111] shrink-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-red-500" />}
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">{title}</span>
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>
    )}
    <div className="p-4 flex-1 flex flex-col min-h-0 relative">
      {children}
    </div>
  </div>
);

const TerminalInput = ({ icon: Icon, className = '', ...props }: any) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
        <Icon size={14} />
      </div>
    )}
    <input 
      className={`w-full bg-[#111] border border-neutral-800 rounded py-2 text-sm text-neutral-200 font-mono placeholder:text-neutral-700 
        focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all
        ${Icon ? 'pl-9 pr-3' : 'px-3'} ${className}`}
      {...props}
    />
  </div>
);

const TerminalSelect = ({ icon: Icon, children, ...props }: any) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500 z-10">
        <Icon size={14} />
      </div>
    )}
    <select 
      className={`w-full bg-[#111] border border-neutral-800 rounded py-2 text-sm text-neutral-200 font-mono focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all appearance-none
        ${Icon ? 'pl-9 pr-3' : 'px-3'}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export default function App() {
  const [time, setTime] = useState(new Date());

  // --- COMPREHENSIVE STATE ---
  const [salary, setSalary] = useState<number>(3500);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, title: 'Netflix Premium', amount: 19.99, type: 'out', category: 'Suscripciones', date: '2026-04-15' },
    { id: 2, title: 'Gym Membership', amount: 40.00, type: 'out', category: 'Suscripciones', date: '2026-04-01' },
    { id: 3, title: 'Supermercado Lider', amount: 154.00, type: 'out', category: 'Alimentación / Mercado', date: '2026-04-18' },
    { id: 4, title: 'Factura Luz', amount: 45.20, type: 'out', category: 'Vivienda / Utilidades', date: '2026-04-12' },
  ]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([
    { id: 1, name: 'Café Grano Entero (1kg)', checked: false },
    { id: 2, name: 'Leche de Avena x4', checked: true },
    { id: 3, name: 'Verduras', checked: false }
  ]);

  // --- FORM STATES ---
  const [txForm, setTxForm] = useState({ title: '', amount: '', type: 'out' as TxType, category: 'Alimentación / Mercado', date: new Date().toISOString().split('T')[0] });
  const [marketForm, setMarketForm] = useState('');

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatCurrency = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // --- GLOBAL METRICS & CALCULATIONS ---
  const { totalGastado, totalIngresos, balance, burnRate } = useMemo(() => {
    const outTxs = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
    const inTxs = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
    
    const ingresos = (salary || 0) + inTxs; // Salary + Extra income
    const netBalance = ingresos - outTxs;
    const br = ingresos > 0 ? (outTxs / ingresos) * 100 : 0;

    return {
      totalGastado: outTxs,
      totalIngresos: ingresos,
      balance: netBalance,
      burnRate: br
    };
  }, [transactions, salary]);

  // --- SUBMISSIONS ---
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.title || !txForm.amount) return;
    setTransactions(prev => [{
      id: Date.now(),
      title: txForm.title,
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      category: txForm.category,
      date: txForm.date
    }, ...prev]);
    setTxForm({ title: '', amount: '', type: 'out', category: 'Alimentación / Mercado', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteTransaction = (id: number) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  const handleAddMarketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketForm.trim()) return;
    setMarketItems(prev => [...prev, { id: Date.now(), name: marketForm, checked: false }]);
    setMarketForm('');
  };

  const toggleMarketItem = (id: number) => setMarketItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  return (
    <div className="flex h-screen w-full bg-[#080808] text-neutral-300 font-sans overflow-hidden selection:bg-red-900/50 flex-col">
      {/* HEADER */}
      <header className="h-14 border-b border-neutral-800/60 flex items-center justify-between px-6 shrink-0 bg-[#0a0a0a]">
         <div className="flex items-center gap-3">
             <TerminalSquare size={18} className="text-red-500" />
             <span className="font-mono text-sm font-bold text-neutral-100 tracking-wider">FINANCE.OS // CONTROL PANEL</span>
         </div>
         <div className="font-mono text-xs text-neutral-500 tracking-widest uppercase flex items-center gap-3">
            <span className="hidden sm:inline">Uplink Secure</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-500">{formatTime(time)}</span>
         </div>
      </header>

      {/* COMPREHENSIVE DASHBOARD: Single view, side by side modules */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,0,0,0.05),rgba(255,255,255,0))]">
         <div className="h-full w-full max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">

            {/* LEFT COLUMN: Input Forms & Metrics (col-span-3) */}
            <div className="md:col-span-4 xl:col-span-3 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                
                {/* SALARY & OVERVIEW METRICS */}
                <WidgetPanel title="FLUJO DE EFECTIVO" icon={DollarSign} className="shrink-0 bg-red-950/10 border-red-900/30">
                    <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Sueldo del Mes (Base)</label>
                    <TerminalInput 
                      type="number" step="0.01" min="0" 
                      value={salary} onChange={(e: any) => setSalary(Number(e.target.value))} 
                      icon={DollarSign} 
                      className="text-xl text-green-400 font-bold"
                    />

                    <div className="mt-5 pt-4 border-t border-red-900/30 grid grid-cols-2 gap-4">
                       <div>
                         <div className="font-mono text-[9px] text-neutral-500 uppercase">Total Disponible</div>
                         <div className="font-mono font-bold text-neutral-300">{formatCurrency(totalIngresos)}</div>
                       </div>
                       <div>
                         <div className="font-mono text-[9px] text-neutral-500 uppercase">Balance Neto</div>
                         <div className={`font-mono font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {formatCurrency(balance)}
                         </div>
                       </div>
                    </div>

                    <div className="mt-4">
                       <div className="flex justify-between items-end mb-1">
                          <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">Burn Rate</div>
                          <div className="font-mono text-xs text-neutral-400 font-bold">{burnRate.toFixed(1)}%</div>
                       </div>
                       <div className="h-1.5 w-full bg-neutral-900 rounded overflow-hidden relative">
                          <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(burnRate, 100)}%` }} />
                       </div>
                    </div>
                </WidgetPanel>

                {/* SINGLE ALL-PURPOSE ADD FORM */}
                <WidgetPanel title="ADJUDICAR MOVIMIENTO" icon={Plus} className="shrink-0">
                  <form onSubmit={handleAddTransaction} className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Concepto</label>
                      <TerminalInput placeholder="Ej: Netflix, Compra..." value={txForm.title} onChange={(e: any) => setTxForm({...txForm, title: e.target.value})} required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Monto ($)</label>
                        <TerminalInput type="number" step="0.01" min="0" placeholder="0.00" value={txForm.amount} onChange={(e: any) => setTxForm({...txForm, amount: e.target.value})} required />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Tipo</label>
                        <TerminalSelect value={txForm.type} onChange={(e: any) => setTxForm({...txForm, type: e.target.value})}>
                          <option value="out">Egreso (-)</option>
                          <option value="in">Ingreso (+)</option>
                        </TerminalSelect>
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Categoría</label>
                      <TerminalSelect icon={Tag} value={txForm.category} onChange={(e: any) => setTxForm({...txForm, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </TerminalSelect>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Fecha</label>
                      <TerminalInput type="date" icon={Calendar} value={txForm.date} onChange={(e: any) => setTxForm({...txForm, date: e.target.value})} required />
                    </div>

                    <button type="submit" className="w-full mt-2 bg-red-900/20 hover:bg-red-500 border border-red-900/50 hover:border-red-500 text-red-500 hover:text-black font-mono text-xs uppercase tracking-widest py-3 transition-all flex justify-center items-center gap-2 font-bold cursor-pointer">
                       AÑADIR AL LEDGER
                    </button>
                  </form>
                </WidgetPanel>
            </div>

            {/* CENTER COLUMN: Master Ledger with Footer Total (col-span-5) */}
            <div className="md:col-span-8 xl:col-span-6 flex flex-col h-full overflow-hidden">
               <WidgetPanel title="LEDGER / HISTORIAL GENERAL" icon={Activity} className="h-full flex flex-col border-neutral-700/50">
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-neutral-800/80">
                          <tr className="font-mono text-[9px] uppercase text-neutral-500 tracking-wider">
                             <th className="pb-3 px-2 text-left">Concepto</th>
                             <th className="pb-3 px-2 text-left">Categoría</th>
                             <th className="pb-3 px-2 text-right">Monto</th>
                             <th className="pb-3 px-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                              <motion.tr 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                key={tx.id} 
                                className="border-b border-neutral-800/40 hover:bg-neutral-900/40 group"
                              >
                                <td className="py-3 px-2">
                                  <div className="text-sm font-medium text-neutral-300 group-hover:text-red-100 transition-colors truncate max-w-[200px]">{tx.title}</div>
                                  <div className="font-mono text-[9px] text-neutral-600 mt-1">{tx.date}</div>
                                </td>
                                <td className="py-3 px-2">
                                  <span className="inline-block px-2 py-1 bg-[#141414] border border-neutral-800 rounded font-mono text-[10px] text-neutral-400 capitalize max-w-[140px] truncate">
                                    {tx.category}
                                  </span>
                                </td>
                                <td className={`py-3 px-2 text-right font-mono text-sm font-bold tracking-tight ${tx.type === 'in' ? 'text-green-500' : 'text-neutral-300'}`}>
                                  {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </td>
                                <td className="py-3 px-2 text-center text-neutral-600">
                                   <button onClick={() => handleDeleteTransaction(tx.id)} className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                     <Trash2 size={14} />
                                   </button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                      {transactions.length === 0 && (
                        <div className="text-center py-12 font-mono text-[10px] text-neutral-600 uppercase">Sin registros en el ledger</div>
                      )}
                   </div>

                   {/* DEDICATED TOTAL FOOTER EXPLICITLY REQUESTED */}
                   <div className="shrink-0 p-4 bg-[#0a0a0a] border border-neutral-800/80 rounded flex justify-between items-center relative overflow-hidden">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                       <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                           <Target size={14} className="text-red-500" /> TOTAL LLEVADO GASTADO
                       </div>
                       <div className="font-mono text-2xl md:text-3xl font-bold text-red-500 tracking-tight">
                           -{formatCurrency(totalGastado)}
                       </div>
                   </div>
               </WidgetPanel>
            </div>

            {/* RIGHT COLUMN: Market List (col-span-3) */}
            <div className="md:col-span-12 xl:col-span-3 flex flex-col h-full overflow-hidden">
                <WidgetPanel title="MARKET LOGISTICS" icon={ShoppingCart} className="h-full border-neutral-700/50">
                  <p className="font-mono text-[10px] text-neutral-600 mb-4 uppercase tracking-widest">// Logística Remota</p>
                  
                  <form onSubmit={handleAddMarketItem} className="flex gap-2 mb-5 shrink-0">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500 font-mono">{'>'}</div>
                      <input 
                        type="text" value={marketForm} onChange={(e) => setMarketForm(e.target.value)}
                        placeholder="Añadir ítem..." 
                        className="w-full bg-[#111] border border-neutral-800 rounded pl-8 pr-3 py-2.5 text-sm text-neutral-200 font-mono placeholder:text-neutral-700 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                      />
                    </div>
                    <button type="submit" disabled={!marketForm.trim()} className="cursor-pointer bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 hover:border-red-500 rounded px-4 flex items-center justify-center transition-all disabled:opacity-50">
                      <Plus size={16} />
                    </button>
                  </form>

                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                      {marketItems.map(item => (
                         <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          className={`group flex items-center gap-3 p-2.5 rounded border transition-colors ${item.checked ? 'bg-[#0a0a0a] border-neutral-800/40 opacity-50' : 'bg-[#111] border-neutral-800 hover:border-neutral-600'}`}
                        >
                          <button onClick={() => toggleMarketItem(item.id)} className={`flex-shrink-0 cursor-pointer focus:outline-none transition-colors ${item.checked ? 'text-neutral-600' : 'text-red-500 hover:text-red-400'}`}>
                            {item.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                          <span className={`flex-1 text-sm ${item.checked ? 'text-neutral-600 line-through' : 'text-neutral-200'}`}>
                            {item.name}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {marketItems.length === 0 && <div className="text-center py-10 font-mono text-[10px] text-neutral-600 uppercase">Sin pendientes</div>}
                  </div>
               </WidgetPanel>
            </div>
         </div>
      </main>
    </div>
  );
}
