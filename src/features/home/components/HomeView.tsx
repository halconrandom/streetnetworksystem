import React from 'react';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    MessageSquare,
    PenTool,
    Image as ImageIcon,
    Activity,
    Shield,
    Users,
    Settings,
    ArrowRight
} from '@/components/Icons';

interface HomeCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    path: string;
    color?: string;
}

const HomeCard: React.FC<HomeCardProps> = ({ title, description, icon: Icon, path, color = 'terminal-accent' }) => {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(path)}
            className="group relative bg-terminal-panel border border-terminal-border/50 rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:border-terminal-accent/40 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
            {/* Glow Effect */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-terminal-accent/5 blur-3xl group-hover:bg-terminal-accent/15 transition-all duration-700" />

            <div className="relative z-10 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-xl bg-terminal-dark border border-terminal-border flex items-center justify-center mb-6 group-hover:border-terminal-accent/30 transition-colors duration-500`}>
                    <Icon size={28} className="text-terminal-muted group-hover:text-terminal-accent transition-colors duration-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider group-hover:text-terminal-accent transition-colors duration-500">
                    {title}
                </h3>

                <p className="text-terminal-muted text-sm leading-relaxed mb-8 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    {description}
                </p>

                <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-muted group-hover:text-white transition-colors duration-500">
                    Access Module <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
};

interface HomeViewProps {
    flags: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({ flags }) => {
    const modules = [
        {
            id: 'dashboard',
            label: 'System Dashboard',
            description: 'Historical data, real-time telemetry, and overall platform health metrics.',
            icon: LayoutDashboard,
            path: '/dashboard',
            flag: 'dashboard'
        },
        {
            id: 'tickets',
            label: 'Ticket Transcripts',
            description: 'Encrypted archives of all Discord support interactions and system tickets.',
            icon: MessageSquare,
            path: '/tickets',
            flag: 'transcripts'
        },
        {
            id: 'message_builder',
            label: 'Message Builder',
            description: 'Advanced visual editor for creating complex Discord embeds and templates.',
            icon: PenTool,
            path: '/message-builder',
            flag: 'message_builder'
        },
        {
            id: 'screenshot_editor',
            label: 'Screenshot Editor',
            description: 'Enhance and refine visual assets with cinematic post-processing tools.',
            icon: ImageIcon,
            path: '/screenshot-editor',
            flag: 'screenshot_editor'
        },
        {
            id: 'nexus',
            label: 'The Nexus',
            description: 'Central mapping node for system-wide connections and visual mapping.',
            icon: Activity,
            path: '/nexus',
            flag: 'nexus'
        },
        {
            id: 'audit',
            label: 'Security Audit',
            description: 'Immutable branch history of all administrative actions and security events.',
            icon: Activity,
            path: '/audit',
            flag: 'audit_logs'
        },
        {
            id: 'vault',
            label: 'The Vault',
            description: 'Ultra-secure encrypted storage for sensitive client keys and credentials.',
            icon: Shield,
            path: '/vault',
            flag: 'vault'
        },
        {
            id: 'users',
            label: 'Personnel Profile',
            description: 'Node management and authorization level control for system members.',
            icon: Users,
            path: '/users',
            flag: 'users'
        },
        {
            id: 'settings',
            label: 'Identity Settings',
            description: 'Personalized system preferences, neural profile, and access sequences.',
            icon: Settings,
            path: '/settings',
            flag: 'ALWAYS_VISIBLE'
        },
    ];

    const visibleModules = modules.filter(m => m.flag === 'ALWAYS_VISIBLE' || flags.includes(m.flag));

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-fade-in">
            <div className="mb-12 border-l-4 border-terminal-accent pl-6 py-2">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                    Control Center
                </h1>
                <p className="text-terminal-muted uppercase tracking-[0.3em] text-xs font-bold opacity-60">
                    Street Network Hub — Central Operations Node
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleModules.map((mod) => (
                    <HomeCard
                        key={mod.id}
                        title={mod.label}
                        description={mod.description}
                        icon={mod.icon}
                        path={mod.path}
                    />
                ))}
            </div>

            <div className="mt-16 pt-8 border-t border-terminal-border/30 flex justify-between items-center text-[10px] uppercase tracking-widest text-terminal-muted opacity-40 font-mono">
                <div>Node ID: STREET_HUB_01</div>
                <div>Uplink Status: [ESTABLISHED]</div>
                <div>Atmosphere Level: [OPTIMAL]</div>
            </div>
        </div>
    );
};
