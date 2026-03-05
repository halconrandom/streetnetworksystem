import React, { useState, useEffect } from 'react';
import {
    User,
    Shield,
    MessageSquare,
    Globe,
    Terminal,
    Eye,
    Palette,
    LogOut,
    ChevronRight,
    Save,
    Check,
    Search,
    Bell,
    Lock,
    Smartphone,
    CreditCard,
    HelpCircle,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Trash2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = 'profile' | 'security' | 'integrations' | 'privacy';

export default function SettingsForm() {
    // API routes are now local - no external backend needed

    // Navigation State
    const [activeCategory, setActiveCategory] = useState<Category>('profile');
    const [searchQuery, setSearchQuery] = useState('');

    // Logic States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        language: 'es'
    });

    // Discord integration state
    const [reviewChannelId, setReviewChannelId] = useState('');
    const [savingChannel, setSavingChannel] = useState(false);
    const [channelError, setChannelError] = useState<string | null>(null);
    const [channelSuccess, setChannelSuccess] = useState<string | null>(null);
    const [discordData, setDiscordData] = useState<{ id: string | null, username: string | null, avatar: string | null }>({ id: null, username: null, avatar: null });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (!res.ok) throw new Error('Error al cargar datos de usuario');
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || ''
                }));
                setDiscordData({
                    id: data.discordId || null,
                    username: data.discordUsername || null,
                    avatar: data.discordAvatar || null
                });
            } catch (err: any) {
                setError(err.message || 'Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        const fetchReviewChannel = async () => {
            try {
                const res = await fetch('/api/users/me/review-channel', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setReviewChannelId(data.discord_review_channel_id || '');
                }
            } catch {
                // Non-fatal: silently ignore
            }
        };

        fetchUser();
        fetchReviewChannel();
    }, []);

    const handleLinkDiscord = async () => {
        try {
            const res = await fetch('/api/auth/discord', { credentials: 'include' });
            if (!res.ok) throw new Error('Error al iniciar vinculación');
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch (err: any) {
            setError(err.message || 'Error al conectar con Discord');
        }
    };

    const handleSaveReviewChannel = async () => {
        setSavingChannel(true);
        setChannelError(null);
        setChannelSuccess(null);
        try {
            const res = await fetch('/api/users/me/review-channel', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ discord_review_channel_id: reviewChannelId.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');
            setChannelSuccess('Cambiado correctamente');
            setTimeout(() => setChannelSuccess(null), 3000);
        } catch (err: any) {
            setChannelError(err.message || 'Error al guardar');
        } finally {
            setSavingChannel(false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setError('Contraseñas no coinciden');
                setSaving(false);
                return;
            }
            if (!formData.oldPassword) {
                setError('Ingrese contraseña actual');
                setSaving(false);
                return;
            }
        }

        try {
            const payload: any = {};
            if (formData.name) payload.name = formData.name;
            if (formData.email) payload.email = formData.email;
            if (formData.newPassword) {
                payload.password = formData.newPassword;
                payload.oldPassword = formData.oldPassword;
            }

            const res = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fallo en la actualización');

            setSuccess('Cambios aplicados');
            setFormData(prev => ({
                ...prev,
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const navItems = [
        { id: 'profile', label: 'Perfil', icon: User },
        { id: 'security', label: 'Seguridad', icon: Shield },
        { id: 'integrations', label: 'Integraciones', icon: MessageSquare },
        { id: 'privacy', label: 'Privacidad', icon: Eye },
    ];

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
                <RefreshCw size={24} className="animate-spin text-[#ff003c]" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[#0a0a0a] text-slate-300 antialiased selection:bg-[#ff003c]/20">
            {/* Sidebar Navigation */}
            <nav className="w-64 flex flex-col border-r border-white-[0.05] bg-[#0a0a0a]">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-2 h-2 rounded-full bg-[#ff003c] shadow-[0_0_8px_rgba(255,0,60,0.4)]" />
                        <span className="text-sm font-semibold tracking-tight text-white uppercase">Street Network</span>
                    </div>

                    <div className="relative mb-8 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-[#ff003c]" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveCategory(item.id as Category)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all group ${activeCategory === item.id
                                        ? 'bg-[#ff003c]/10 text-[#ff003c]'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 transition-colors ${activeCategory === item.id ? 'text-[#ff003c]' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-8 border-t border-white-[0.05]">
                    <div className="flex items-center gap-3 mb-6">
                        <img
                            src={discordData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=1a1a1a&color=666`}
                            className="w-8 h-8 rounded-lg grayscale opacity-70 border border-white/[0.05]"
                            alt="Avatar"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{formData.name}</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Nivel 4</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] text-slate-600 hover:text-[#ff003c] transition-colors uppercase font-bold tracking-wider">
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
                <header className="px-12 py-8 flex items-center justify-between border-b border-white-[0.05]">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Configuración</h1>
                        <p className="text-xs text-slate-600 mt-1">Gestión de cuenta y sistema operativo</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Descartar</button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-[#ff003c] hover:bg-[#ff1a4d] text-white px-6 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,0,60,0.15)] active:scale-[0.98]"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar">
                    <div className="max-w-3xl space-y-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategory}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 5 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Feedback Notifications */}
                                <AnimatePresence>
                                    {(error || success) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`mb-10 p-4 rounded-xl flex items-center justify-between border ${error ? 'bg-red-500/[0.02] border-red-500/20 text-red-400' : 'bg-emerald-500/[0.02] border-emerald-500/20 text-emerald-400'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                                <span className="text-xs font-medium">{error || success}</span>
                                            </div>
                                            <button onClick={() => { setError(null); setSuccess(null); }} className="opacity-40 hover:opacity-100 transition-opacity">
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {activeCategory === 'profile' && (
                                    <div className="space-y-12">
                                        <section>
                                            <h3 className="text-sm font-semibold text-white mb-8">Información de Usuario</h3>
                                            <div className="grid grid-cols-2 gap-10">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nombre Completo</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Correo Electrónico</label>
                                                    <input
                                                        type="email"
                                                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all opacity-60"
                                                        value={formData.email}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-sm font-semibold text-white mb-6">Región</h3>
                                            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                                                <div>
                                                    <p className="text-xs font-semibold text-white">Idioma de Interfaz</p>
                                                    <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">Ajuste global de localización</p>
                                                </div>
                                                <select
                                                    className="bg-[#1a1a1a] border border-white/[0.05] rounded-lg px-4 py-2 text-[10px] text-white font-bold uppercase tracking-wider outline-none focus:border-[#ff003c]/30 cursor-pointer"
                                                    value={formData.language}
                                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                                >
                                                    <option value="es">Castellano</option>
                                                    <option value="en">English (US)</option>
                                                </select>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeCategory === 'security' && (
                                    <div className="space-y-12">
                                        <section>
                                            <h3 className="text-sm font-semibold text-white mb-8">Credenciales de Acceso</h3>
                                            <div className="max-w-md space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Contraseña Actual</label>
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all"
                                                        value={formData.oldPassword}
                                                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nueva Clave</label>
                                                        <input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all"
                                                            value={formData.newPassword}
                                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Repetir</label>
                                                        <input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all"
                                                            value={formData.confirmPassword}
                                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="opacity-30">
                                            <h3 className="text-sm font-semibold text-white mb-6">Seguridad Avanzada</h3>
                                            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.05]">
                                                        <Smartphone className="w-5 h-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-white uppercase tracking-wider">Hardware Key (MFA)</p>
                                                        <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest font-bold">Modulo no inicializado</p>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-5 bg-white/[0.05] rounded-full" />
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeCategory === 'integrations' && (
                                    <div className="space-y-12">
                                        <section>
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-sm font-semibold text-white">Discord Nexus</h3>
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${discordData.id ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                                    }`}>
                                                    {discordData.id ? 'Online' : 'Offline'}
                                                </span>
                                            </div>

                                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                                                <div className="p-8 flex items-center justify-between border-b border-white/[0.05]">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${discordData.id ? 'border-[#5865F2]/30 bg-[#5865F2]/10 shadow-[0_4px_30px_rgba(88,101,242,0.15)]' : 'border-white-[0.05] bg-white/[0.03]'}`}>
                                                            {discordData.avatar ? (
                                                                <img src={discordData.avatar} className="w-full h-full rounded-2xl object-cover" alt="Discord" />
                                                            ) : (
                                                                <MessageSquare className="w-6 h-6 text-slate-700" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white uppercase tracking-tight">Discord Integration</p>
                                                            <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest mt-1">
                                                                {discordData.username ? `@${discordData.username}` : 'No vinculado'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleLinkDiscord}
                                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${discordData.id
                                                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                                                : 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-[0_4px_20px_rgba(88,101,242,0.2)]'
                                                            }`}
                                                    >
                                                        {discordData.id ? 'Revincular' : 'Vincular Cuenta'}
                                                    </button>
                                                </div>

                                                <div className="p-8 bg-white/[0.01]">
                                                    <div className="space-y-3 max-w-lg">
                                                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Review Channel ID</label>
                                                        <div className="flex gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="ID del canal..."
                                                                className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff003c]/20 transition-all font-mono"
                                                                value={reviewChannelId}
                                                                onChange={(e) => setReviewChannelId(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={handleSaveReviewChannel}
                                                                disabled={savingChannel}
                                                                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-white px-6 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                                                            >
                                                                {savingChannel ? '...' : (channelSuccess ? 'Ok' : 'Save')}
                                                            </button>
                                                        </div>
                                                        <p className="text-[9px] text-slate-600 uppercase font-medium tracking-wider">Canal de destino para notificaciones de revisión</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeCategory === 'privacy' && (
                                    <div className="space-y-12">
                                        <section>
                                            <h3 className="text-sm font-semibold text-white mb-8">Protocolos de Privacidad</h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { id: 'vis', label: 'Visibilidad Hub', desc: 'Permite visibilidad de estado para otros operadores del sistema.', enabled: true },
                                                    { id: 'tel', label: 'Telemetría', desc: 'Envío automático de logs de error anónimos para depuración.', enabled: false },
                                                    { id: 'act', label: 'Logger de Actividad', desc: 'Historial local persistente de comandos ejecutados en el terminal.', enabled: true },
                                                ].map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between p-6 hover:bg-white/[0.01] transition-colors rounded-2xl group border border-transparent hover:border-white/[0.03]">
                                                        <div className="max-w-md">
                                                            <p className="text-xs font-semibold text-white uppercase tracking-tight">{item.label}</p>
                                                            <p className="text-[10px] text-slate-600 mt-1 leading-relaxed uppercase tracking-wider font-medium">{item.desc}</p>
                                                        </div>
                                                        <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-all ${item.enabled ? 'bg-[#ff003c]/80' : 'bg-white/[0.05]'}`}>
                                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <footer className="px-12 py-8 border-t border-white-[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-700 uppercase tracking-widest">
                        <span>SNC: KERNEL_2.4.0</span>
                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                        <span>State: Optimal</span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                        <span className="hover:text-slate-400 cursor-pointer transition-colors">Support</span>
                        <span className="hover:text-slate-400 cursor-pointer transition-colors">System Policy</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
