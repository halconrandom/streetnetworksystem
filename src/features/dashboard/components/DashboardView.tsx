import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Users, MessageSquare, Activity, CheckCircle, ArrowRight, RefreshCw } from '@/components/Icons';

const StatCard: React.FC<{ title: string; value: string | number; trend?: string; icon: any; loading?: boolean }> = ({ title, value, trend, icon: Icon, loading }) => (
  <div className="bg-terminal-panel border border-terminal-border p-5 rounded-lg shadow-lg hover:border-terminal-accent/30 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-terminal-accent/10 rounded-md">
        <Icon size={20} className="text-terminal-accent" />
      </div>
      {trend && <span className="text-xs font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{trend}</span>}
    </div>
    <div className="min-h-[2rem] flex items-center">
      {loading ? (
        <RefreshCw size={16} className="text-terminal-muted animate-spin" />
      ) : (
        <h3 className="text-2xl font-bold text-white mb-1 font-mono">{value}</h3>
      )}
    </div>
    <p className="text-sm text-terminal-muted lowercase tracking-widest">{title}</p>
  </div>
);

export const DashboardView: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, auditRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/audit?pageSize=5', { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setRecentLogs(auditData.rows || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">System Overview</h1>
          <p className="text-terminal-muted text-sm font-mono uppercase tracking-widest opacity-60">Neural Uplink Status: [OPTIMAL]</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-terminal-border rounded-lg text-terminal-muted hover:text-white transition-all active:scale-95"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? '0'} icon={Users} loading={loading} />
        <StatCard title="Active Members" value={stats?.activeMembers ?? '0'} icon={Activity} loading={loading} />
        <StatCard title="Ticket Archive" value={stats?.totalTickets ?? '0'} icon={MessageSquare} loading={loading} />
        <StatCard title="Open Tickets" value={stats?.openTickets ?? '0'} icon={CheckCircle} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-terminal-panel border border-terminal-border rounded-lg p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
              <Activity size={14} className="text-terminal-accent" />
              Latest Telementry
            </h3>
            <button
              onClick={() => router.push('/audit')}
              className="text-[10px] text-terminal-accent hover:underline uppercase tracking-widest"
            >
              Branch to Audit matrix
            </button>
          </div>
          <div className="space-y-4">
            {recentLogs.length === 0 && !loading ? (
              <div className="py-2 text-terminal-muted text-xs font-mono uppercase">No recent activity found.</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs py-3 border-b border-terminal-border/40 last:border-0 hover:bg-white/[0.02] transition-colors rounded px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-terminal-accent shadow-[0_0_5px_rgba(255,59,59,0.5)]"></div>
                    <span className="text-terminal-muted font-mono">{formatDate(log.created_at)}</span>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{log.action}</span>
                      <span className="text-[10px] text-terminal-muted opacity-50">{log.actor_email || 'System'}</span>
                    </div>
                  </div>
                  <span className="text-terminal-muted text-[10px] font-mono opacity-30">{log.id.slice(0, 8)}</span>
                </div>
              ))
            )}
            {loading && [1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-terminal-dark/50 animate-pulse rounded"></div>
            ))}
          </div>
        </div>

        <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 shadow-xl flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">Quick Commands</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/users')}
                className="w-full text-left px-4 py-3 bg-terminal-dark hover:bg-white/5 border border-terminal-border rounded flex items-center justify-between group transition-colors shadow-inner"
              >
                <span className="text-xs text-white uppercase tracking-wider font-bold">Manage Personnel</span>
                <ArrowRight size={14} className="text-terminal-muted group-hover:text-terminal-accent transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => router.push('/tickets')}
                className="w-full text-left px-4 py-3 bg-terminal-dark hover:bg-white/5 border border-terminal-border rounded flex items-center justify-between group transition-colors shadow-inner"
              >
                <span className="text-xs text-white uppercase tracking-wider font-bold">Review Transcripts</span>
                <ArrowRight size={14} className="text-terminal-muted group-hover:text-terminal-accent transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-terminal-border/40">
            <div className="bg-terminal-dark/50 rounded-lg p-4 border border-terminal-border/30">
              <div className="text-[10px] text-terminal-muted uppercase tracking-widest mb-2 opacity-50">Local Time Node</div>
              <div className="text-xl font-mono text-white tracking-tighter">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
