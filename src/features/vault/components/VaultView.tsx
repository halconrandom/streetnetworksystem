import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Search as SearchIcon,
    Plus,
    Trash2,
    Phone,
    Mail,
    RefreshCw,
    Clock,
    ExternalLink,
    Shield,
    UserPlus,
    AlertCircle,
    Hash,
    Activity
} from '@/components/Icons';

type VaultClient = {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    tier: 'standard' | 'premium' | 'vip' | 'blacklisted';
    loyalty_points: number;
    internal_notes: string | null;
    metadata: any;
    last_interaction: string | null;
    created_at: string;
};

export default function VaultView() {
    const [clients, setClients] = useState<VaultClient[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        tier: 'standard' as 'standard' | 'premium' | 'vip' | 'blacklisted',
        internal_notes: ''
    });

    const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/vault/clients`, { credentials: 'include' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Query failed (${res.status}): ${errorData.error || res.statusText}`);
            }
            const data = await res.json();
            setClients(data);
        } catch (err) {
            console.error('Failed to load vault data:', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/vault/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
                credentials: 'include'
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Creation failed (${res.status}): ${errorData.error || res.statusText}`);
            }
            setShowModal(false);
            loadData();
            setForm({ full_name: '', email: '', phone: '', tier: 'standard', internal_notes: '' });
        } catch (err) {
            console.error('Failed to create:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete profile: ${name}?`)) return;
        try {
            const res = await fetch(`${apiBase}/vault/clients/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error('Delete failed');
            loadData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-terminal-dark/30 relative">
            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-terminal-panel border border-terminal-border w-full max-w-xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-terminal-border bg-gradient-to-r from-terminal-accent/5 to-transparent flex items-center justify-between">
                            <div>
                                <h2 className="text-white font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                                    <UserPlus className="text-terminal-accent" size={20} />
                                    New Client Inscription
                                </h2>
                                <p className="text-[10px] text-terminal-muted uppercase tracking-widest mt-1">Establishing neural network link...</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-terminal-muted hover:text-white transition-colors">
                                <Hash size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-terminal-muted uppercase tracking-widest font-bold flex items-center gap-2">
                                        <Users size={12} /> Full Name
                                    </label>
                                    <input
                                        required
                                        autoFocus
                                        value={form.full_name}
                                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                                        placeholder="Enter entity designation..."
                                        className="w-full bg-terminal-dark/50 border border-terminal-border rounded-xl px-4 py-3 text-sm text-white focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 outline-none transition-all placeholder:text-terminal-muted/20"
                                    />
                                </div>

                                {/* Tier Selection */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-terminal-muted uppercase tracking-widest font-bold flex items-center gap-2">
                                        <Shield size={12} /> Priority Tier
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['standard', 'premium', 'vip', 'blacklisted'] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setForm({ ...form, tier: t })}
                                                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter border transition-all ${form.tier === t
                                                    ? 'bg-terminal-accent/10 border-terminal-accent text-terminal-accent shadow-sm shadow-terminal-accent/10'
                                                    : 'bg-terminal-dark/30 border-terminal-border text-terminal-muted hover:border-terminal-muted/30'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-terminal-muted uppercase tracking-widest font-bold flex items-center gap-2">
                                        <Mail size={12} /> Communication Node (Email)
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="entity@network.db"
                                        className="w-full bg-terminal-dark/50 border border-terminal-border rounded-xl px-4 py-3 text-sm text-white focus:border-terminal-accent/50 outline-none transition-all placeholder:text-terminal-muted/20 font-mono"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-terminal-muted uppercase tracking-widest font-bold flex items-center gap-2">
                                        <Phone size={12} /> Direct Uplink (Phone)
                                    </label>
                                    <input
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+X XX XXXX-XXXX"
                                        className="w-full bg-terminal-dark/50 border border-terminal-border rounded-xl px-4 py-3 text-sm text-white focus:border-terminal-accent/50 outline-none transition-all placeholder:text-terminal-muted/20 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-terminal-muted uppercase tracking-widest font-bold flex items-center gap-2">
                                    <Activity size={12} /> Operational Intelligence
                                </label>
                                <textarea
                                    value={form.internal_notes}
                                    onChange={e => setForm({ ...form, internal_notes: e.target.value })}
                                    placeholder="Record relevant data for future interactions..."
                                    rows={3}
                                    className="w-full bg-terminal-dark/50 border border-terminal-border rounded-xl px-4 py-3 text-sm text-white focus:border-terminal-accent/50 outline-none transition-all placeholder:text-terminal-muted/20 resize-none h-32"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 border border-terminal-border text-terminal-muted font-bold uppercase text-xs rounded-xl hover:bg-white/5 transition-all tracking-widest"
                                >
                                    Terminate
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] px-6 py-4 bg-terminal-accent text-white font-bold uppercase text-xs rounded-xl shadow-lg shadow-terminal-accent/20 hover:scale-[1.02] active:scale-95 transition-all tracking-widest"
                                >
                                    {loading ? 'Processing...' : 'Finalize Inscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-8 py-8 border-b border-terminal-border bg-terminal-panel/30 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black text-white uppercase tracking-[0.3em] flex items-center gap-4">
                            <Shield className="text-terminal-accent" size={32} />
                            The Vault
                        </h1>
                        <p className="text-[10px] text-terminal-muted uppercase tracking-[0.4em] mt-2 ml-12">Centralized Corporate Client Database</p>
                    </div>
                    <div className="flex items-center gap-4 ml-12 md:ml-0">
                        <button
                            onClick={() => loadData()}
                            className="p-3 border border-terminal-border rounded-xl text-terminal-muted hover:text-white transition-all active:scale-90"
                            title="Sync Database"
                        >
                            <RefreshCw size={18} className={loading && !showModal ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-3 px-6 py-3 bg-terminal-accent text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-terminal-accent/20"
                        >
                            <UserPlus size={16} />
                            New Inscription
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8">
                {/* Search & Stats Bar */}
                <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-0 bg-terminal-accent/5 blur-xl group-focus-within:bg-terminal-accent/10 transition-all rounded-2xl" />
                        <SearchIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-terminal-muted pointer-events-none group-focus-within:text-terminal-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by designation, neural link (email), or uplink (phone)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-terminal-panel/50 border border-terminal-border rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-terminal-accent/50 transition-all placeholder:text-terminal-muted/40 font-mono relative z-10"
                        />
                    </div>

                    <div className="flex items-center gap-4 px-6 py-4 bg-terminal-panel/30 border border-terminal-border rounded-2xl">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-terminal-muted uppercase tracking-widest font-bold">Total Profiles</span>
                            <span className="text-lg font-black text-white font-mono">{clients.length}</span>
                        </div>
                        <div className="w-[1px] h-8 bg-terminal-border mx-2" />
                        <div className="flex flex-col">
                            <span className="text-[9px] text-terminal-muted uppercase tracking-widest font-bold">VIP Tier</span>
                            <span className="text-lg font-black text-terminal-accent font-mono">{clients.filter(c => c.tier === 'vip').length}</span>
                        </div>
                    </div>
                </div>

                {/* Client Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredClients.length === 0 ? (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 opacity-50 grayscale">
                            <AlertCircle size={48} className="text-terminal-muted" />
                            <div className="text-center">
                                <p className="text-xs font-bold text-terminal-muted uppercase tracking-[0.3em]">{loading ? 'Decrypting Neural Network...' : 'Empty client matrix'}</p>
                                {!loading && <p className="text-[10px] text-terminal-muted/50 mt-1 uppercase">Establish new connections to populate the vault</p>}
                            </div>
                        </div>
                    ) : (
                        filteredClients.map(client => (
                            <div key={client.id} className="bg-terminal-panel border border-terminal-border rounded-2xl p-6 hover:border-terminal-accent/30 transition-all group relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-terminal-accent/5">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-terminal-accent/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-terminal-accent/10 transition-colors pointer-events-none" />

                                <div className="flex items-start justify-between relative z-10 mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-terminal-dark border border-terminal-border flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:border-terminal-accent/50 transition-all">
                                            {client.full_name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-lg text-white font-black uppercase tracking-tight group-hover:text-terminal-accent transition-colors">{client.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${client.tier === 'vip' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' :
                                                    client.tier === 'premium' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' :
                                                        client.tier === 'blacklisted' ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                                            'bg-terminal-dark/50 text-terminal-muted border-terminal-border'
                                                    }`}>
                                                    {client.tier}
                                                </span>
                                                <span className="text-[10px] text-terminal-accent font-black flex items-center gap-1.5">
                                                    <Activity size={10} /> {client.loyalty_points} LP
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button
                                            onClick={() => handleDelete(client.id, client.full_name)}
                                            className="p-2 text-terminal-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center gap-3 text-terminal-muted hover:text-white transition-colors group/link p-2 bg-terminal-dark/30 rounded-lg border border-transparent hover:border-terminal-border/50">
                                        <Mail size={14} className="group-hover/link:text-terminal-accent transition-colors" />
                                        <span className="text-xs font-mono truncate">{client.email || 'NO_EMAIL_RECORDED'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-terminal-muted hover:text-white transition-colors group/link p-2 bg-terminal-dark/30 rounded-lg border border-transparent hover:border-terminal-border/50">
                                        <Phone size={14} className="group-hover/link:text-terminal-accent transition-colors" />
                                        <span className="text-xs font-mono truncate">{client.phone || 'NO_UP_LINK'}</span>
                                    </div>
                                </div>

                                {client.internal_notes && (
                                    <div className="mt-6 p-4 bg-terminal-dark/50 border border-terminal-border/30 rounded-xl relative z-10 flex-1">
                                        <p className="text-[11px] text-terminal-muted leading-relaxed line-clamp-3 italic">
                                            "{client.internal_notes}"
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 pt-5 border-t border-terminal-border/40 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-terminal-muted font-black relative z-10">
                                    <span className="flex items-center gap-2 italic">
                                        <Clock size={10} /> {new Date(client.created_at).toLocaleDateString()}
                                    </span>
                                    <button className="text-terminal-accent hover:text-white flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-terminal-accent/10">
                                        DETAILED CORE <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
