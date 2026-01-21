import React from 'react';
import { Users, MessageSquare, Activity, CheckCircle, ArrowRight } from '../components/Icons';

const StatCard: React.FC<{ title: string; value: string; trend: string; icon: any }> = ({ title, value, trend, icon: Icon }) => (
  <div className="bg-terminal-panel border border-terminal-border p-5 rounded-lg">
    <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-terminal-accent/10 rounded-md">
            <Icon size={20} className="text-terminal-accent" />
        </div>
        <span className="text-xs font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{trend}</span>
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-terminal-muted">{title}</p>
  </div>
);

export const DashboardView: React.FC = () => {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in-up">
        
        {/* Welcome Section */}
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back, Admin.</h1>
            <p className="text-terminal-muted">Here is the system overview for today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Tickets" value="1,284" trend="+12%" icon={MessageSquare} />
            <StatCard title="Active Members" value="45.2k" trend="+5.4%" icon={Users} />
            <StatCard title="Tickets Closed" value="892" trend="+8%" icon={CheckCircle} />
            <StatCard title="Avg Response" value="12m" trend="-2m" icon={Activity} />
        </div>

        {/* Recent Activity / Quick Actions Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-terminal-panel border border-terminal-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">Recent System Logs</h3>
                    <button className="text-xs text-terminal-accent hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-terminal-border last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-terminal-accent"></div>
                                <span className="text-terminal-muted font-mono">10:4{i} AM</span>
                                <span className="text-white">System backup completed successfully.</span>
                            </div>
                            <span className="text-terminal-muted text-xs">System</span>
                        </div>
                    ))}
                </div>
            </div>

             <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
                <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-terminal-dark hover:bg-white/5 border border-terminal-border rounded flex items-center justify-between group transition-colors">
                        <span className="text-sm text-white">Export Monthly Report</span>
                        <ArrowRight size={16} className="text-terminal-muted group-hover:text-terminal-accent" />
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-terminal-dark hover:bg-white/5 border border-terminal-border rounded flex items-center justify-between group transition-colors">
                        <span className="text-sm text-white">Manage Roles</span>
                        <ArrowRight size={16} className="text-terminal-muted group-hover:text-terminal-accent" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};