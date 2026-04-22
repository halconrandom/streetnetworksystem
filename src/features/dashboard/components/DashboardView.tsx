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
  Image,
  Database,
  Search,
  LayoutDashboard
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-components ---

const DashboardHeader: React.FC = () => {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-terminal-accent/30 transition-colors">
      <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
        <Cloud size={14} className="text-terminal-accent" />
        Local Climate
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white font-mono">7°</span>
          <span className="text-lg text-terminal-muted font-mono">C</span>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[10px] text-terminal-muted font-mono uppercase">
            <Wind size={12} />
            <span>Wind 13.3KM/H</span>
          </div>
        </div>
      </div>
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
      // Play alert sound or notification here
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

const DirectivesWidget: React.FC = () => {
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newTask, setNewTask] = useState('');

  // Initial mock tasks
  useEffect(() => {
    const saved = localStorage.getItem('sn_dashboard_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks([
        { id: '1', text: 'Sync neural uplink with node A7', completed: false },
        { id: '2', text: 'Review encrypted vault protocols', completed: true },
        { id: '3', text: 'Analyze incoming telemetry logs', completed: false },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sn_dashboard_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: crypto.randomUUID(), text: newTask, completed: false }]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const purgeDone = () => {
    setTasks(tasks.filter(t => !t.completed));
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg shadow-xl flex flex-col h-full overflow-hidden group hover:border-terminal-accent/30 transition-colors">
      <div className="p-6 border-b border-terminal-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <CheckCircle size={14} className="text-terminal-accent" />
          Directives [Tasks]
        </div>
        <button 
          onClick={purgeDone}
          className="text-[9px] font-mono text-terminal-muted hover:text-terminal-accent uppercase tracking-widest transition-colors"
        >
          Purge Done
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-xs text-terminal-muted py-20">
              // No active directives found.
            </div>
          ) : (
            tasks.map(task => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 group/item p-2 hover:bg-white/[0.02] rounded transition-colors"
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-terminal-accent border-terminal-accent text-white' : 'border-terminal-border text-transparent hover:border-terminal-accent/50'}`}
                >
                  <CheckCircle size={10} strokeWidth={3} />
                </button>
                <span className={`flex-1 text-xs font-mono transition-all ${task.completed ? 'text-terminal-muted line-through opacity-50' : 'text-white'}`}>
                  {task.text}
                </span>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover/item:opacity-100 text-terminal-muted hover:text-terminal-accent transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-4 bg-terminal-dark/50 border-t border-terminal-border/50">
        <div className="relative">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="+ New directive..."
            className="w-full bg-transparent border-none outline-none text-xs font-mono text-white placeholder:text-terminal-muted/30 py-2 pl-2 pr-10"
          />
          {newTask && (
            <button 
              onClick={addTask}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-terminal-accent hover:scale-110 transition-transform"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ScheduleWidget: React.FC = () => {
  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-terminal-accent/30 transition-colors h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
          <MessageSquare size={14} className="text-terminal-accent" />
          Schedule Overview
        </div>
        <Plus size={14} className="text-terminal-muted cursor-not-allowed opacity-30" />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-white/5 rounded-full border border-terminal-border/30">
          <Activity size={24} className="text-terminal-muted opacity-40" />
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-1">Uplink Required</h4>
          <p className="text-[9px] text-terminal-muted font-mono leading-relaxed max-w-[200px] opacity-60">
            System requires Google Calendar OAuth credentials to sync live telemetry.
          </p>
        </div>
        <button className="px-4 py-2 border border-terminal-accent/30 text-terminal-accent text-[9px] font-bold uppercase tracking-widest hover:bg-terminal-accent/10 transition-all rounded">
          Initialize Connection
        </button>
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
        <button 
          onClick={() => { navigator.clipboard.writeText(notes); }}
          className="p-1 text-terminal-muted hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          <CopyIcon size={12} />
        </button>
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

const CopyIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const RedirectsSection: React.FC = () => {
  const router = useRouter();
  
  const redirects = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: '#ff003c' },
    { id: 'nexus', label: 'The Nexus', icon: Activity, path: '/nexus', color: '#3b82f6' },
    { id: 'transcripts', label: 'Transcripts', icon: MessageSquare, path: '/tickets', color: '#10b981' },
    { id: 'message_builder', label: 'Builder', icon: Code, path: '/message-builder', color: '#f59e0b' },
    { id: 'vault', label: 'The Vault', icon: Shield, path: '/vault', color: '#a855f7' },
    { id: 'users', label: 'Personnel', icon: Users, path: '/users', color: '#ec4899' },
    { id: 'audit', label: 'Audit Matrix', icon: Search, path: '/audit', color: '#64748b' },
    { id: 'editor', label: 'Lens Editor', icon: Image, path: '/screenshot-editor', color: '#06b6d4' },
  ];

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Network Access Nodes</h3>
        <div className="flex-1 h-px bg-gradient-to-right from-terminal-border to-transparent"></div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {redirects.map((node) => (
          <button
            key={node.id}
            onClick={() => router.push(node.path)}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-terminal-panel border border-terminal-border rounded-lg group hover:border-white/20 transition-all active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <div 
              className="p-3 rounded-xl transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(var(--color-rgb),0.3)]"
              style={{ backgroundColor: `${node.color}10`, color: node.color }}
            >
              <node.icon size={20} />
            </div>
            <span className="text-[9px] font-bold text-terminal-muted group-hover:text-white uppercase tracking-widest text-center transition-colors">
              {node.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Main View ---

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-terminal-muted gap-4 font-mono">
        <div className="w-12 h-12 border-2 border-terminal-accent/20 border-t-terminal-accent rounded-full animate-spin" />
        <span className="text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Terminal...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-[1600px] mx-auto">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Column 1: Time, Climate, Timer */}
        <div className="md:col-span-3 space-y-6">
          <ClockWidget />
          <ClimateWidget />
          <TimerWidget />
        </div>
        
        {/* Column 2: Tasks */}
        <div className="md:col-span-5 h-[calc(2*140px+6*4px+220px)] md:h-[650px]">
          <DirectivesWidget />
        </div>
        
        {/* Column 3: Schedule, Notes */}
        <div className="md:col-span-4 space-y-6">
          <ScheduleWidget />
          <ScratchpadWidget />
        </div>
      </div>
      
      <RedirectsSection />
      
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
          background: var(--cyber-red, #ff003c);
        }
      `}</style>
    </div>
  );
};

