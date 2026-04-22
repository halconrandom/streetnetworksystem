import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  Cloud, 
  Wind, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  ExternalLink,
  Shield,
  Code,
  Image as ImageIcon,
  Database,
  Search,
  LayoutDashboard,
  Settings,
  X
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---

interface ChangelogEntry {
    id?: number;
    hash?: string;
    message?: string;
    msg?: string;
    date: string;
    type: string;
    description?: string;
}

interface HomeViewProps {
    flags: string[];
    role: string;
}

// --- Sub-components ---

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-terminal-border/30">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-terminal-accent/10 border border-terminal-accent/30 rounded shadow-[0_0_15px_rgba(255,0,60,0.1)]">
          <TerminalIcon size={24} className="text-terminal-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-[0.2em] uppercase">Command Central</h1>
          <p className="text-[10px] text-terminal-muted font-mono tracking-widest opacity-60">Personal Operations Node</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] font-mono text-terminal-muted uppercase tracking-[0.15em]">System Online</span>
        </div>
        <div className="h-4 w-px bg-terminal-border/50"></div>
        <div className="text-[10px] font-mono text-terminal-muted uppercase tracking-[0.15em]">
          V2.4.0-Build.829
        </div>
      </div>
    </div>
  );
};

const TerminalIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-terminal-accent/30 transition-colors">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Clock size={48} className="text-terminal-accent" />
      </div>
      <div className="relative z-10">
        <div className="text-4xl font-bold text-white font-mono tracking-tighter mb-1">
          {timeStr}
        </div>
        <div className="text-[10px] font-mono text-terminal-muted tracking-[0.2em]">
          {dateStr}
        </div>
      </div>
    </div>
  );
};

const ClimateWidget: React.FC = () => {
  const [data, setData] = useState<{ temp: number; wind: number; location: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async (lat: number, lon: number) => {
      try {
        // Fetch Weather (Open-Meteo)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        if (!weatherRes.ok) throw new Error('Weather fetch failed');
        const weatherJson = await weatherRes.json();
        
        // Fetch Location (Nominatim Reverse Geocoding)
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        if (!geoRes.ok) throw new Error('Geocoding fetch failed');
        const geoJson = await geoRes.json();
        
        // Extract city/town/village
        const city = geoJson.address.city || 
                     geoJson.address.town || 
                     geoJson.address.village || 
                     geoJson.address.suburb || 
                     geoJson.address.state || 
                     'Sector Desconocido';

        setData({
          temp: Math.round(weatherJson.current_weather.temperature),
          wind: weatherJson.current_weather.windspeed,
          location: city
        });
      } catch (err) {
        console.error('Fetch failed', err);
        // Fallback
        setData({ temp: 22, wind: 5.5, location: 'Nodo Remoto' });
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined' && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchAll(pos.coords.latitude, pos.coords.longitude),
        () => fetchAll(40.4168, -3.7038) // Madrid
      );
    } else {
      fetchAll(40.4168, -3.7038);
    }
  }, []);

  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-terminal-accent/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <Cloud size={14} className="text-terminal-accent" />
          Local Climate
        </div>
        {loading && <RefreshCw size={12} className="text-terminal-accent animate-spin" />}
      </div>
      
      {data ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white font-mono">{data.temp}°</span>
              <span className="text-lg text-terminal-muted font-mono">C</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-[10px] text-terminal-muted font-mono uppercase">
                <Wind size={12} />
                <span>Wind {data.wind} KM/H</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-3 border-t border-white/5">
            <div className="w-1 h-1 rounded-full bg-terminal-accent shadow-[0_0_5px_#ff003c] animate-pulse"></div>
            <span className="text-[9px] font-mono text-white/60 uppercase tracking-[0.2em]">
              Uplink Node: <span className="text-terminal-accent font-bold">{data.location}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-10 bg-white/5 rounded w-1/2" />
          <div className="h-4 bg-white/5 rounded w-full" />
        </div>
      )}
    </div>
  );
};

const TimerWidget: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-terminal-accent/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <Clock size={14} className="text-terminal-accent" />
          Sequence Timer
        </div>
        <div className="flex bg-terminal-dark rounded p-0.5 border border-terminal-border/50">
          <button 
            onClick={() => { setMode('focus'); setTimeLeft(25 * 60); setIsActive(false); }}
            className={`px-2 py-0.5 text-[9px] rounded uppercase tracking-tighter transition-colors ${mode === 'focus' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:text-white'}`}
          >
            Focus
          </button>
          <button 
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
            className={`px-2 py-0.5 text-[9px] rounded uppercase tracking-tighter transition-colors ${mode === 'break' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:text-white'}`}
          >
            Break
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="text-5xl font-bold text-white font-mono tracking-tighter mb-4">
          {formatTime(timeLeft)}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={toggleTimer}
            className={`p-3 rounded-full border transition-all ${isActive ? 'bg-terminal-accent/10 border-terminal-accent text-terminal-accent' : 'bg-white/5 border-terminal-border text-terminal-muted hover:text-white'}`}
          >
            {isActive ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button 
            onClick={resetTimer}
            className="p-3 rounded-full bg-white/5 border border-terminal-border text-terminal-muted hover:text-white transition-all"
          >
            <RefreshCw size={16} className={isActive ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DirectivesWidget: React.FC<{ updates: ChangelogEntry[], isLoading: boolean }> = ({ updates, isLoading }) => {
  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg shadow-xl flex flex-col h-full overflow-hidden group hover:border-terminal-accent/30 transition-colors">
      <div className="p-6 border-b border-terminal-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <Activity size={14} className="text-terminal-accent" />
          System Updates [Changelog]
        </div>
        <div className="text-[9px] font-mono text-terminal-muted opacity-40 uppercase tracking-widest">Live Feed</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded" />)}
          </div>
        ) : updates.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-xs text-terminal-muted py-20">
            // No recent updates found.
          </div>
        ) : (
          updates.map((update, idx) => (
            <motion.div 
              key={update.id || update.hash || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-white/[0.02] border-l-2 border-terminal-accent/30 rounded-r hover:bg-white/[0.04] transition-colors group/item"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${update.type === 'feat' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-terminal-accent/10 text-terminal-accent'}`}>
                  {update.type}
                </span>
                <span className="text-[8px] font-mono text-terminal-muted/40 group-hover/item:text-terminal-muted/60 transition-colors">
                  {new Date(update.date).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white/80 group-hover/item:text-white transition-colors line-clamp-1">
                {update.message || update.msg}
              </h4>
            </motion.div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-terminal-dark/50 border-t border-terminal-border/50">
        <div className="text-[9px] font-mono text-terminal-muted/30 uppercase tracking-[0.2em] text-center">
          Monitoring network changes...
        </div>
      </div>
    </div>
  );
};

import { toast } from 'sonner';

const CurrencyWidget: React.FC = () => {
  const [rates, setRates] = useState<{ usd: number; eur: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('1');

  const logMarketChange = async (newRates: { usd: number; eur: number }) => {
    const saved = localStorage.getItem('sn_last_market_rates');
    const prev = saved ? JSON.parse(saved) : null;
    
    if (!prev) {
      localStorage.setItem('sn_last_market_rates', JSON.stringify(newRates));
      return;
    }

    let changeDetails: string[] = [];
    const getChange = (curr: number, p: number, label: string) => {
      if (Math.abs(curr - p) < 1) return null; // Ignore tiny fluctuations
      const indicator = curr > p ? '↑ SUBE' : '↓ BAJA';
      const diff = curr - p;
      const percent = ((diff / p) * 100).toFixed(2);
      return `${label}: $${curr.toFixed(0)} (${indicator} ${percent}%)`;
    };

    const usdChange = getChange(newRates.usd, prev.usd, 'USD');
    const eurChange = getChange(newRates.eur, prev.eur, 'EUR');

    if (usdChange) changeDetails.push(usdChange);
    if (eurChange) changeDetails.push(eurChange);

    if (changeDetails.length > 0) {
      try {
        await fetch('/api/live-updates/log-market', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'market',
            message: 'Actualización de Mercado COP',
            description: changeDetails.join('\n')
          })
        });
        localStorage.setItem('sn_last_market_rates', JSON.stringify(newRates));
      } catch (err) {
        console.error('Market logging failed', err);
      }
    }
  };

  const fetchRates = async (isAuto = false) => {
    setLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const usdToCop = data.rates.COP;
      
      const eurResponse = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const eurData = await eurResponse.json();
      const eurToCop = eurData.rates.COP;

      const newRates = { usd: usdToCop, eur: eurToCop };
      setRates(newRates);
      
      // Log change if detected
      logMarketChange(newRates);

      toast.success(isAuto ? 'Auto-Sync Complete' : 'Market Data Refreshed', {
        description: `USD: $${usdToCop.toFixed(0)} | EUR: $${eurToCop.toFixed(0)}`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Currency fetch failed', err);
      toast.error('Uplink Error', {
        description: 'Failed to synchronize market telemetry.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    
    // Auto-refresh every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
      fetchRates(true);
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  const numAmount = amount === '' ? 0 : Number(amount);

  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-terminal-accent/30 transition-colors flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <Database size={14} className="text-terminal-accent" />
          Market Telemetry [COP]
        </div>
        <button 
          onClick={() => fetchRates()}
          className="p-1.5 rounded hover:bg-white/5 text-terminal-muted hover:text-terminal-accent transition-all active:scale-90"
          title="Refresh Rates"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-terminal-dark border border-terminal-border rounded-lg p-3 text-lg font-mono text-white outline-none focus:border-terminal-accent/50 transition-colors pl-10"
            placeholder="0.00"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-terminal-accent">$</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* USD */}
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl group/item hover:bg-white/[0.04] transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">USD - Dólar</div>
            </div>
            <div className="text-[9px] font-mono text-terminal-muted/40 uppercase">Rate: {rates?.usd.toFixed(2)}</div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            {rates ? (numAmount * rates.usd).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '----'}
          </div>
        </div>

        {/* EUR */}
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl group/item hover:bg-white/[0.04] transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-[12px] font-black text-blue-500 uppercase tracking-widest">EUR - Euro</div>
            </div>
            <div className="text-[9px] font-mono text-terminal-muted/40 uppercase">Rate: {rates?.eur.toFixed(2)}</div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            {rates ? (numAmount * rates.eur).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '----'}
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-terminal-muted/30 uppercase tracking-widest">
        <span>Uplink Established</span>
        <span>Auto-Sync: 10m</span>
      </div>
    </div>
  );
};

const ScratchpadWidget: React.FC = () => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sn_dashboard_notes');
    if (saved) setNotes(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('sn_dashboard_notes', notes);
  }, [notes]);

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg shadow-xl flex flex-col group hover:border-terminal-accent/30 transition-colors h-[280px]">
      <div className="p-4 border-b border-terminal-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <Code size={14} className="text-terminal-accent" />
          Scratchpad
        </div>
      </div>
      <textarea 
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="// Enter encrypted notes here..."
        className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-terminal-muted p-6 resize-none custom-scrollbar focus:text-white transition-colors"
      />
    </div>
  );
};

const RedirectsSection: React.FC<{ modules: any[] }> = ({ modules }) => {
  const router = useRouter();
  
  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Network Access Nodes</h3>
        <div className="flex-1 h-px bg-white/5"></div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4">
        {modules.map((node) => (
          <button
            key={node.id}
            onClick={() => router.push(node.path)}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-terminal-panel border border-terminal-border rounded-lg group hover:border-white/20 transition-all active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <div 
              className="p-3 rounded-xl transition-all group-hover:scale-110 bg-terminal-accent/10 text-terminal-accent group-hover:shadow-[0_0_15px_rgba(255,0,60,0.2)]"
            >
              <node.icon size={20} />
            </div>
            <span className="text-[9px] font-bold text-terminal-muted group-hover:text-white uppercase tracking-widest text-center transition-colors">
              {node.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Main View ---

export const HomeView: React.FC<HomeViewProps> = ({ flags, role }) => {
    const [updates, setUpdates] = useState<ChangelogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const modules = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: '/dashboard',
            flag: 'dashboard'
        },
        {
            id: 'tickets',
            label: 'Transcripts',
            icon: MessageSquare,
            path: '/tickets',
            flag: 'transcripts'
        },
        {
            id: 'message_builder',
            label: 'Builder',
            icon: Code,
            path: '/message-builder',
            flag: 'message_builder'
        },
        {
            id: 'screenshot_editor',
            label: 'Lens Editor',
            icon: ImageIcon,
            path: '/screenshot-editor',
            flag: 'screenshot_editor'
        },
        {
            id: 'nexus',
            label: 'The Nexus',
            icon: Activity,
            path: '/nexus',
            flag: 'nexus'
        },
        {
            id: 'audit',
            label: 'Audit Matrix',
            icon: Search,
            path: '/audit',
            flag: 'audit_logs'
        },
        {
            id: 'vault',
            label: 'The Vault',
            icon: Shield,
            path: '/vault',
            flag: 'vault'
        },
        {
            id: 'users',
            label: 'Personnel',
            icon: Users,
            path: '/users',
            flag: 'users'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            path: '/settings',
            flag: 'ALWAYS_VISIBLE'
        },
    ];

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const response = await fetch('/api/live-updates');
                if (response.ok) {
                    const data = await response.json();
                    setUpdates(data);
                }
            } catch (err) {
                console.error('Failed to fetch updates:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUpdates();
    }, []);

    const visibleModules = modules.filter(m => m.flag === 'ALWAYS_VISIBLE' || flags.includes(m.flag));

    return (
        <div className="p-6 md:p-8 animate-fade-in max-w-[1800px] mx-auto min-h-screen">
            <DashboardHeader />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Column 1: Time, Climate, Timer */}
                <div className="md:col-span-3 space-y-6">
                    <ClockWidget />
                    <ClimateWidget />
                    <TimerWidget />
                    <CurrencyWidget />
                </div>
                
                {/* Column 2: Changelog (System Updates) */}
                <div className="md:col-span-5 h-[calc(2*140px+6*4px+220px)] md:h-[650px]">
                    <DirectivesWidget updates={updates} isLoading={isLoading} />
                </div>
                
                {/* Column 3: Notes */}
                <div className="md:col-span-4 space-y-6">
                    <ScratchpadWidget />
                </div>
            </div>
            
            <RedirectsSection modules={visibleModules} />
            
            <footer className="mt-12 py-6 border-t border-terminal-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-[9px] font-mono text-terminal-muted uppercase tracking-widest opacity-40">
                    Neural Uplink: Stable | Connection: Encrypted
                </div>
                <div className="flex items-center gap-4 text-[9px] font-mono text-terminal-muted uppercase tracking-widest opacity-40">
                    <span>Region: EU-WEST-1</span>
                    <span>Node ID: SN-ADMIN-829</span>
                </div>
            </footer>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ff003c;
                }
            `}</style>
        </div>
    );
};

