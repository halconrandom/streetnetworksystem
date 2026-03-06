import React, { useState } from 'react';
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
    ArrowRight,
    X,
    Plus,
} from '@/components/Icons';
import { LiveUpdateManager } from './LiveUpdateManager';

interface HomeCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    path: string;
    color?: string;
}

interface ChangelogEntry {
    id?: number;
    hash?: string;
    message?: string;
    msg?: string; // for backward compatibility
    date: string;
    type: string;
    description?: string;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    const renderText = (text: string) => {
        // Parse inline formatting: **bold**, *italic*, `code`
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="text-terminal-accent italic">{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-white/10 px-1.5 py-0.5 rounded text-terminal-accent font-mono text-[11px]">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
            elements.push(<div key={`empty-${i}`} className="h-2" />);
            i++;
            continue;
        }

        // Headers: ###, ##, #
        if (trimmedLine.startsWith('### ')) {
            elements.push(
                <h4 key={`h3-${i}`} className="text-sm font-bold text-white/90 mb-1 mt-3">
                    {renderText(trimmedLine.slice(4))}
                </h4>
            );
            i++;
            continue;
        }
        if (trimmedLine.startsWith('## ')) {
            elements.push(
                <h3 key={`h2-${i}`} className="text-base font-bold text-white mb-1 mt-4">
                    {renderText(trimmedLine.slice(3))}
                </h3>
            );
            i++;
            continue;
        }
        if (trimmedLine.startsWith('# ')) {
            elements.push(
                <h2 key={`h1-${i}`} className="text-lg font-black text-white mb-2 mt-4">
                    {renderText(trimmedLine.slice(2))}
                </h2>
            );
            i++;
            continue;
        }

        // Horizontal rule
        if (trimmedLine === '---' || trimmedLine === '***') {
            elements.push(<hr key={`hr-${i}`} className="border-t border-white/10 my-3" />);
            i++;
            continue;
        }

        // List detection
        const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
        const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)/);

        if (ulMatch || olMatch) {
            const listType = ulMatch ? 'ul' : 'ol';
            const baseIndent = (ulMatch || olMatch)![1].length;
            const listItems: React.ReactNode[] = [];

            while (i < lines.length) {
                const currentLine = lines[i];
                const mU = currentLine.match(/^(\s*)([-*+])\s+(.*)/);
                const mO = currentLine.match(/^(\s*)(\d+\.)\s+(.*)/);

                if (!mU && !mO) break;

                const indent = (mU || mO)![1].length;
                if (indent < baseIndent) break;

                const itemContent = (mU || mO)![3];
                listItems.push(
                    <li key={`li-${i}`} className={`pl-1 mb-1 ${indent > baseIndent ? 'ml-4' : ''}`}>
                        {renderText(itemContent)}
                    </li>
                );
                i++;
            }

            const ListTag = listType;
            elements.push(
                <ListTag
                    key={`list-${i}`}
                    className={`my-2 ml-5 space-y-0.5 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-terminal-accent/50`}
                >
                    {listItems}
                </ListTag>
            );
        } else {
            elements.push(
                <p key={`p-${i}`} className="mb-1.5 text-[11px] leading-relaxed text-terminal-muted/90">
                    {renderText(line)}
                </p>
            );
            i++;
        }
    }

    return <div className="markdown-content break-words whitespace-pre-wrap selection:bg-terminal-accent/20">{elements}</div>;
};

const DetailModal: React.FC<{ entry: ChangelogEntry; onClose: () => void }> = ({ entry, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in shadow-2xl">
            <div className="bg-terminal-panel border border-terminal-border rounded-3xl p-8 max-w-3xl w-full relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-terminal-muted hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${entry.type === 'feat' ? 'bg-terminal-accent/10 text-terminal-accent' :
                        entry.type === 'fix' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-terminal-muted'
                        }`}>
                        {entry.type === 'feat' ? 'MEJORA' : entry.type === 'fix' ? 'PARCHE' : entry.type === 'refactor' ? 'OPTIMIZACIÓN' : entry.type === 'security' ? 'SEGURIDAD' : entry.type}
                    </span>
                    <span className="text-[10px] font-mono text-terminal-muted/40 font-bold">{entry.date}</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-6 capitalize leading-tight tracking-tight">
                    {entry.message || entry.msg}
                </h2>

                <div className="space-y-4">
                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                        <h4 className="text-[9px] uppercase font-bold text-terminal-accent mb-2 tracking-widest">Novedades y Detalles</h4>
                        <div className="text-[13px] text-terminal-muted leading-relaxed opacity-80">
                            {entry.description ? (
                                <MarkdownRenderer content={entry.description} />
                            ) : (
                                `Esta mejora optimiza el funcionamiento general y la estabilidad de ${(entry.message || entry.msg || '').split(' ')[0]}.`
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="block text-[8px] uppercase font-bold text-white/20 mb-1">Estado</span>
                            <span className="text-[10px] text-terminal-accent font-bold">PUBLICADO</span>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="block text-[8px] uppercase font-bold text-white/20 mb-1">Seguridad</span>
                            <span className="text-[10px] text-green-400 font-bold">VERIFICADO</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-4 bg-white/[0.03] hover:bg-terminal-accent hover:text-black hover:font-bold text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5 active:scale-95"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

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
    role: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ flags, role }) => {
    const [selectedUpdate, setSelectedUpdate] = useState<ChangelogEntry | null>(null);
    const [updates, setUpdates] = useState<ChangelogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    const modules = [
        // ... (modules remain same)
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

    React.useEffect(() => {
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
        <div className="p-8 max-w-[1800px] mx-auto animate-fade-in relative min-h-screen">
            <div className="mb-12 border-l-4 border-terminal-accent pl-6 py-2">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                    Control Center
                </h1>
                <p className="text-terminal-muted uppercase tracking-[0.3em] text-xs font-bold opacity-60">
                    Street Network Hub — Central Operations Node
                </p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT COLUMN: ACCESS MODULES */}
                <div className="col-span-12 xl:col-span-8 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <LayoutDashboard size={18} className="text-terminal-accent" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-terminal-muted/80">Available Uplinks</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* RIGHT COLUMN: CHANGELOG */}
                <div className="col-span-12 xl:col-span-4 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Activity size={18} className="text-terminal-accent" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-terminal-muted/80">Historial de Actualizaciones</h2>
                        </div>
                        {role === 'admin' && (
                            <button
                                onClick={() => setIsManagerOpen(true)}
                                className="text-[8px] font-black uppercase tracking-widest text-terminal-accent/40 hover:text-terminal-accent transition-colors flex items-center gap-1.5 px-2 py-1 border border-terminal-accent/10 rounded-md hover:bg-terminal-accent/5"
                            >
                                <Plus size={10} /> Gestionar Novedades
                            </button>
                        )}
                    </div>

                    <div className="bg-terminal-panel border border-terminal-border/50 rounded-3xl p-6 min-h-[600px] relative overflow-hidden">
                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-terminal-accent animate-pulse" />
                                <span className="text-[9px] font-bold text-terminal-accent uppercase tracking-widest">Live Updates</span>
                            </div>
                            <span className="text-[9px] font-mono text-terminal-muted opacity-40">v2.4.0-build.829</span>
                        </div>

                        <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
                            {isLoading ? (
                                <div className="flex flex-col gap-4 animate-pulse">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 bg-white/5 rounded-2xl" />
                                    ))}
                                </div>
                            ) : updates.length > 0 ? (
                                updates.map((entry, idx) => {
                                    const typeConfig: Record<string, { bg: string; text: string; border: string; label: string; glow: string }> = {
                                        feat: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-l-emerald-500/60', label: 'MEJORA', glow: 'group-hover:shadow-emerald-500/10' },
                                        fix: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-l-red-500/60', label: 'PARCHE', glow: 'group-hover:shadow-red-500/10' },
                                        refactor: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-l-blue-500/60', label: 'OPTIMIZACIÓN', glow: 'group-hover:shadow-blue-500/10' },
                                        security: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-l-amber-500/60', label: 'SEGURIDAD', glow: 'group-hover:shadow-amber-500/10' },
                                    };
                                    const cfg = typeConfig[entry.type] || { bg: 'bg-white/5', text: 'text-terminal-muted', border: 'border-l-white/10', label: entry.type?.toUpperCase() || 'INFO', glow: 'group-hover:shadow-white/5' };
                                    const descPreview = entry.description ? entry.description.replace(/[*#\-_]/g, '').slice(0, 80) + (entry.description.length > 80 ? '...' : '') : null;

                                    return (
                                        <div
                                            key={entry.id || entry.hash}
                                            onClick={() => setSelectedUpdate(entry)}
                                            className={`group relative border-l-[3px] ${cfg.border} rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-white/[0.04] hover:shadow-lg ${cfg.glow} bg-white/[0.015]`}
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            {/* Hover glow */}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            <div className="relative z-10 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-terminal-muted/40 group-hover:text-terminal-muted/60 transition-colors">
                                                        {new Date(entry.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                <h4 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors capitalize leading-snug">
                                                    {entry.message || entry.msg}
                                                </h4>

                                                {descPreview && (
                                                    <p className="text-[10px] text-terminal-muted/50 group-hover:text-terminal-muted/70 transition-colors leading-relaxed line-clamp-2">
                                                        {descPreview}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-terminal-accent/60">Ver detalles</span>
                                                    <ArrowRight size={10} className="text-terminal-accent/60" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 opacity-30 text-[10px] uppercase font-bold tracking-[0.3em]">
                                    No activity detected in the nexus
                                </div>
                            )}
                        </div>

                        {/* Decoration */}
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-terminal-accent/5 blur-[100px] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {selectedUpdate && (
                <DetailModal
                    entry={selectedUpdate}
                    onClose={() => setSelectedUpdate(null)}
                />
            )}

            {/* LIVE UPDATE MANAGER */}
            {isManagerOpen && (
                <LiveUpdateManager
                    onClose={() => setIsManagerOpen(false)}
                    onUpdate={() => {
                        // Refresh updates list
                        const fetchUpdatedList = async () => {
                            try {
                                const response = await fetch('/api/live-updates');
                                if (response.ok) {
                                    const data = await response.json();
                                    setUpdates(data);
                                }
                            } catch (err) {
                                console.error('Failed to refresh updates:', err);
                            }
                        };
                        fetchUpdatedList();
                    }}
                />
            )}

            <div className="mt-16 pt-8 border-t border-terminal-border/30 flex justify-between items-center text-[10px] uppercase tracking-widest text-terminal-muted opacity-40 font-mono">
                <div>Node ID: STREET_HUB_01</div>
                <div>Uplink Status: [ESTABLISHED]</div>
                <div>Atmosphere Level: [OPTIMAL]</div>
            </div>
        </div>
    );
};
