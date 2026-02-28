import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Lock, Globe, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, HelpCircle, ShieldCheck, MessageSquare } from 'lucide-react';

export default function SettingsForm() {
    const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';

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

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${apiBase}/auth/me`, { credentials: 'include' });
                if (!res.ok) throw new Error('Error al cargar datos de usuario');
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || ''
                }));
            } catch (err: any) {
                setError(err.message || 'Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        const fetchReviewChannel = async () => {
            try {
                const res = await fetch(`${apiBase}/users/me/review-channel`, { credentials: 'include' });
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
    }, [apiBase]);

    const handleSaveReviewChannel = async () => {
        setSavingChannel(true);
        setChannelError(null);
        setChannelSuccess(null);
        try {
            const res = await fetch(`${apiBase}/users/me/review-channel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ discord_review_channel_id: reviewChannelId.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');
            setChannelSuccess('Canal de revisión guardado correctamente.');
            setTimeout(() => setChannelSuccess(null), 4000);
        } catch (err: any) {
            setChannelError(err.message || 'Error al guardar el canal');
        } finally {
            setSavingChannel(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setError('La nueva contraseña y la confirmación no coinciden.');
                setSaving(false);
                return;
            }
            if (!formData.oldPassword) {
                setError('Debes ingresar tu contraseña actual para establecer una nueva.');
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

            const res = await fetch(`${apiBase}/users/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fallo en la actualización');

            setSuccess('Configuración guardada correctamente');
            setFormData(prev => ({
                ...prev,
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (err: any) {
            setError(err.message || 'Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const InputBlock = ({ label, name, type = "text", value, onChange, placeholder, required = false, mono = false }: any) => (
        <div className="group space-y-3">
            <label className="text-[11px] text-white/50 uppercase font-black tracking-[0.2em] px-1 group-focus-within:text-terminal-accent transition-colors duration-300">
                {label}
            </label>
            <div className="relative">
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    className={`w-full bg-[#050505] border-2 border-terminal-border rounded-2xl h-16 px-6 text-base text-white focus:border-terminal-accent focus:bg-[#080808] outline-none transition-all duration-300 placeholder:text-white/20 shadow-inner ${mono ? 'font-mono tracking-widest' : 'font-semibold'}`}
                />
                <div className="absolute inset-0 rounded-2xl ring-4 ring-terminal-accent/0 group-focus-within:ring-terminal-accent/5 transition-all duration-500 pointer-events-none" />
            </div>
        </div>
    );

    const BlockHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-terminal-border">
            <div className="w-16 h-16 rounded-[2rem] bg-terminal-accent/10 border-2 border-terminal-accent/30 flex items-center justify-center text-terminal-accent shadow-[0_0_30px_rgba(var(--terminal-accent-rgb),0.15)]">
                <Icon size={32} strokeWidth={2.5} />
            </div>
            <div>
                <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white">{title}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] mt-2 font-black">{subtitle}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-40 text-terminal-muted space-y-10">
                <div className="relative w-24 h-24">
                    <RefreshCw size={96} className="animate-spin text-terminal-accent/10" style={{ animationDuration: '4s' }} />
                    <RefreshCw size={48} className="animate-spin absolute inset-0 m-auto text-terminal-accent" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                </div>
                <div className="text-center space-y-2">
                    <span className="block text-xs uppercase tracking-[1em] font-black text-terminal-accent">Cargando</span>
                    <span className="block text-[10px] uppercase tracking-[0.5em] text-white/40">Sincronizando datos...</span>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-16 animate-fade-in max-w-full">
            <div className="space-y-4">
                {error && (
                    <div className="flex items-center gap-6 p-8 bg-red-950/30 border-2 border-red-500 text-red-500 rounded-3xl animate-shake backdrop-blur-xl">
                        <AlertCircle size={28} />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-6 p-8 bg-terminal-accent/10 border-2 border-terminal-accent text-terminal-accent rounded-3xl animate-fade-in backdrop-blur-xl">
                        <CheckCircle2 size={28} />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">{success}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                {/* COLUMNA 1: PERFIL */}
                <div className="space-y-12">
                    <section className="bg-[#0c0c0d] p-12 rounded-[3rem] border-2 border-terminal-border shadow-2xl relative overflow-hidden group/card shadow-[0_20px_100px_rgba(0,0,0,0.8)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-terminal-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover/card:bg-terminal-accent/10 transition-all duration-1000" />

                        <BlockHeader icon={User} title="Perfil" subtitle="Datos de Usuario" />

                        <div className="space-y-10">
                            <InputBlock
                                label="Nombre de Usuario"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Tu nombre..."
                            />

                            <InputBlock
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="usuario@correo.com"
                            />

                            <div className="group space-y-3">
                                <label className="text-[11px] text-white/50 uppercase font-black tracking-[0.2em] px-1 group-focus-within:text-terminal-accent transition-colors">
                                    Idioma del Sistema
                                </label>
                                <div className="relative">
                                    <select
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border-2 border-terminal-border rounded-2xl h-16 px-6 text-base text-white focus:border-terminal-accent focus:bg-[#080808] outline-none appearance-none transition-all duration-300 cursor-pointer font-semibold"
                                    >
                                        <option value="es">Español</option>
                                        <option value="en">Inglés</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-focus-within:text-terminal-accent transition-colors">
                                        <ChevronRight size={24} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN DISCORD */}
                    <section className="bg-[#0c0c0d] p-12 rounded-[3rem] border-2 border-terminal-border shadow-2xl relative overflow-hidden group/card shadow-[0_20px_100px_rgba(0,0,0,0.8)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5865F2]/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover/card:bg-[#5865F2]/10 transition-all duration-1000" />

                        <BlockHeader icon={MessageSquare} title="Discord" subtitle="Integración de Revisión" />

                        <div className="space-y-8">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-bold leading-relaxed">
                                ID del canal de Discord donde se enviarán tus screenshots para revisión. El bot debe estar instalado en ese servidor.
                            </p>

                            {channelError && (
                                <div className="flex items-center gap-4 p-6 bg-red-950/30 border border-red-500/50 text-red-400 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                                    <AlertCircle size={16} />
                                    {channelError}
                                </div>
                            )}
                            {channelSuccess && (
                                <div className="flex items-center gap-4 p-6 bg-emerald-950/30 border border-emerald-500/50 text-emerald-400 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={16} />
                                    {channelSuccess}
                                </div>
                            )}

                            <div className="group space-y-3">
                                <label className="text-[11px] text-white/50 uppercase font-black tracking-[0.2em] px-1 group-focus-within:text-[#5865F2] transition-colors duration-300">
                                    Canal de Revisión (ID)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={reviewChannelId}
                                        onChange={e => setReviewChannelId(e.target.value)}
                                        placeholder="Ej: 1234567890123456789"
                                        className="w-full bg-[#050505] border-2 border-terminal-border rounded-2xl h-16 px-6 text-base text-white focus:border-[#5865F2] focus:bg-[#080808] outline-none transition-all duration-300 placeholder:text-white/20 font-mono tracking-widest shadow-inner"
                                    />
                                    <div className="absolute inset-0 rounded-2xl ring-4 ring-[#5865F2]/0 group-focus-within:ring-[#5865F2]/5 transition-all duration-500 pointer-events-none" />
                                </div>
                                <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-bold px-1">
                                    Clic derecho en el canal en Discord → Copiar ID (activa Modo Desarrollador en Ajustes → Avanzado)
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSaveReviewChannel}
                                disabled={savingChannel}
                                className="flex items-center gap-3 px-8 py-4 bg-[#5865F2]/10 border-2 border-[#5865F2]/30 text-[#5865F2] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#5865F2]/20 hover:border-[#5865F2]/60 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {savingChannel ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <Save size={14} />
                                )}
                                {savingChannel ? 'Guardando...' : 'Guardar Canal'}
                            </button>
                        </div>
                    </section>
                </div>

                {/* COLUMNA 2: SEGURIDAD */}
                <div className="space-y-12">
                    <section className="bg-[#0c0c0d] p-12 rounded-[3rem] border-2 border-terminal-border shadow-2xl relative overflow-hidden group/card h-full shadow-[0_20px_100px_rgba(0,0,0,0.8)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-terminal-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover/card:bg-terminal-accent/10 transition-all duration-1000" />

                        <BlockHeader icon={ShieldCheck} title="Seguridad" subtitle="Cambio de Contraseña" />

                        <div className="space-y-10">
                            <InputBlock
                                label="Contraseña Actual"
                                name="oldPassword"
                                type="password"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                placeholder="Ingresa tu clave actual..."
                                mono
                            />

                            <div className="pt-6">
                                <div className="h-px bg-terminal-border/20 w-full mb-10" />

                                <InputBlock
                                    label="Nueva Contraseña"
                                    name="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Nueva clave..."
                                    mono
                                />
                            </div>

                            <InputBlock
                                label="Confirmar Nueva Contraseña"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repite la nueva clave..."
                                mono
                            />

                            <div className="mt-8 p-8 bg-terminal-accent/5 rounded-[2rem] border-2 border-terminal-accent/20 flex items-start gap-6">
                                <div className="p-3 bg-terminal-accent/10 rounded-2xl text-terminal-accent shadow-lg shadow-terminal-accent/20">
                                    <Lock size={24} strokeWidth={3} />
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-black text-terminal-accent">Seguridad de la Cuenta</p>
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/50 mt-2 font-bold leading-relaxed">Usa una contraseña fuerte con letras, números y símbolos para mayor protección.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* BARRA DE ACCIÓN FINAL */}
            <div className="pt-20 border-t-2 border-terminal-border flex flex-col xl:flex-row justify-between items-center gap-12">
                <div className="flex items-center gap-8 text-center xl:text-left">
                    <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-[0.5em] text-white">Hub Center — System</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black mt-2">Versión 2.4.0 — Conexión Segura</span>
                    </div>
                </div>

                <div className="relative group/btn-container w-full xl:w-auto">
                    <div className="absolute -inset-1 bg-terminal-accent blur opacity-40 group-hover/btn-container:opacity-70 transition duration-1000" />
                    <button
                        type="submit"
                        disabled={saving}
                        className="relative w-full xl:w-[450px] flex justify-center items-center gap-6 px-16 py-8 bg-terminal-accent text-white rounded-[2rem] text-[16px] font-black uppercase tracking-[0.4em] hover:bg-terminal-accent/90 transition-all duration-500 shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {saving ? (
                            <RefreshCw size={28} className="animate-spin" />
                        ) : (
                            <Save size={32} className="group-hover:translate-x-1 transition-transform duration-500" />
                        )}
                        <span>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </span>
                    </button>
                </div>
            </div>
        </form>
    );
}
