'use client';

import React, { useState, useEffect } from 'react';
import {
    User,
    Shield,
    MessageSquare,
    Eye,
    Bell,
    Palette,
    Lock,
    Smartphone,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    X,
    Copy,
    Check,
    Clock,
    Globe,
    Monitor,
    Moon,
    Zap,
    Activity,
    Key,
    Terminal,
    ChevronRight,
    Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from '@clerk/nextjs';
import ToggleSwitch from './ToggleSwitch';
import SettingsSection, { SettingsRow, SettingsDivider } from './SettingsSection';
import AvatarUpload from './AvatarUpload';
import PremiumInput from '@/shared/ui/PremiumInput';
import PremiumTextarea from '@/shared/ui/PremiumTextarea';
import PremiumSelect from '@/shared/ui/PremiumSelect';

type Tab = 'profile' | 'appearance' | 'notifications' | 'security' | 'integrations' | 'privacy';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'integrations', label: 'Integraciones', icon: MessageSquare },
    { id: 'privacy', label: 'Privacidad', icon: Eye },
];

interface Notification {
    type: 'error' | 'success';
    message: string;
}

export default function SettingsForm() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();

    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [copiedId, setCopiedId] = useState(false);

    // Profile state
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        language: 'es',
        timezone: 'Europe/Madrid',
    });

    // Appearance state
    const [appearance, setAppearance] = useState({
        theme: 'dark' as 'dark' | 'darker' | 'midnight',
        fontSize: 'md' as 'sm' | 'md' | 'lg',
        animations: true,
        compactMode: false,
        showAvatars: true,
    });

    // Notifications state
    const [notifPrefs, setNotifPrefs] = useState({
        systemAlerts: true,
        ticketUpdates: true,
        discordPings: true,
        auditAlerts: false,
        weeklyDigest: false,
        soundEnabled: false,
    });

    // Privacy state
    const [privacy, setPrivacy] = useState({
        showOnlineStatus: true,
        telemetry: false,
        activityLog: true,
        publicProfile: false,
    });

    // Discord integration state
    const [reviewChannelId, setReviewChannelId] = useState('');
    const [savingChannel, setSavingChannel] = useState(false);
    const [discordData, setDiscordData] = useState<{
        id: string | null;
        username: string | null;
        avatar: string | null;
    }>({ id: null, username: null, avatar: null });

    // Sessions mock data
    const sessions = [
        { id: '1', device: 'Chrome · Windows 11', location: 'Madrid, ES', lastSeen: 'Ahora mismo', current: true },
        { id: '2', device: 'Firefox · macOS', location: 'Barcelona, ES', lastSeen: 'Hace 2 días', current: false },
    ];

    const showNotification = (type: 'error' | 'success', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3500);
    };

    useEffect(() => {
        if (isLoaded && user) {
            setFormData(prev => ({
                ...prev,
                name: user.firstName || user.username || '',
            }));
        }
    }, [isLoaded, user]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/users/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setDiscordData({
                        id: data.discordId || null,
                        username: data.discordUsername || null,
                        avatar: data.discordAvatar || null,
                    });
                    setReviewChannelId(data.discord_review_channel_id || '');
                }
            } catch { /* non-fatal */ }
        };
        if (isLoaded && user) fetchUserData();
    }, [isLoaded, user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const currentName = user.firstName || user.username || '';
            if (formData.name && formData.name !== currentName) {
                await user.update({ firstName: formData.name });
            }
            showNotification('success', 'Perfil actualizado correctamente');
        } catch (err) {
            showNotification('error', (err as Error).message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveReviewChannel = async () => {
        setSavingChannel(true);
        try {
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ discord_review_channel_id: reviewChannelId.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');
            showNotification('success', 'Canal de revisión actualizado');
        } catch (err) {
            showNotification('error', (err as Error).message || 'Error al guardar');
        } finally {
            setSavingChannel(false);
        }
    };

    const handleCopyUserId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-terminal-dark">
                <RefreshCw size={24} className="animate-spin text-terminal-accent opacity-50" />
            </div>
        );
    }

    const languageOptions = [
        { value: 'es', label: 'Castellano' },
        { value: 'en', label: 'English (US)' },
        { value: 'ca', label: 'Català' },
    ];

    const timezoneOptions = [
        { value: 'Europe/Madrid', label: 'Europe/Madrid (CET)' },
        { value: 'Europe/London', label: 'Europe/London (GMT)' },
        { value: 'America/New_York', label: 'America/New_York (EST)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
        { value: 'UTC', label: 'UTC' },
    ];

    return (
        <div className="h-full flex flex-col bg-terminal-dark overflow-hidden">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="px-8 pt-8 pb-0 flex-shrink-0">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white uppercase tracking-widest">
                            User Settings
                        </h1>
                        <p className="text-xs text-terminal-muted mt-1 uppercase tracking-widest font-mono">
                            Gestión de cuenta y preferencias del sistema
                        </p>
                    </div>

                    {/* Save button — only shown on profile tab */}
                    <AnimatePresence>
                        {activeTab === 'profile' && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-terminal-accent hover:bg-terminal-accent/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_20px_rgba(255,0,60,0.2)]"
                            >
                                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Tab Navigation ─────────────────────────────────────── */}
                <div className="flex items-center gap-1 border-b border-terminal-border">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider
                                    transition-all duration-200 cursor-pointer
                                    ${isActive
                                        ? 'text-terminal-accent'
                                        : 'text-terminal-muted hover:text-white'
                                    }
                                `}
                            >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-accent shadow-[0_0_8px_rgba(255,0,60,0.5)]"
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Global Notification ─────────────────────────────────────── */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`mx-8 mt-4 flex-shrink-0 flex items-center justify-between px-4 py-3 rounded-lg border text-xs font-medium ${notification.type === 'error'
                                ? 'bg-red-500/5 border-red-500/20 text-red-400'
                                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {notification.type === 'error'
                                ? <AlertCircle size={14} />
                                : <CheckCircle2 size={14} />
                            }
                            {notification.message}
                        </div>
                        <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Tab Content ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="max-w-3xl space-y-6"
                    >

                        {/* ══════════════════════════════════════════════════
                            TAB: PERFIL
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'profile' && (
                            <>
                                {/* Avatar + Identity */}
                                <SettingsSection title="Identidad" description="Tu información pública en el sistema" icon={User}>
                                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                                        <AvatarUpload
                                            currentAvatarUrl={user?.imageUrl}
                                            userName={formData.name || user?.username || 'U'}
                                        />
                                        <div className="flex-1 space-y-5 w-full">
                                            <PremiumInput
                                                label="Nombre de Operador"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Tu nombre..."
                                            />
                                            <PremiumInput
                                                label="Correo Electrónico"
                                                value={user?.primaryEmailAddress?.emailAddress || ''}
                                                readOnly
                                                disabled
                                                error="Gestionado por Clerk · No editable"
                                            />
                                            <PremiumTextarea
                                                label="Bio / Descripción"
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                placeholder="Describe tu rol en el servidor..."
                                                maxLength={160}
                                                showCount
                                            />
                                        </div>
                                    </div>
                                </SettingsSection>

                                {/* Localización */}
                                <SettingsSection title="Localización" description="Región e idioma del sistema" icon={Globe}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <PremiumSelect
                                            label="Idioma de Interfaz"
                                            options={languageOptions}
                                            value={languageOptions.find(opt => opt.value === formData.language)}
                                            onChange={(opt: any) => setFormData({ ...formData, language: opt?.value })}
                                        />
                                        <PremiumSelect
                                            label="Zona Horaria"
                                            options={timezoneOptions}
                                            value={timezoneOptions.find(opt => opt.value === formData.timezone)}
                                            onChange={(opt: any) => setFormData({ ...formData, timezone: opt?.value })}
                                        />
                                    </div>
                                </SettingsSection>

                                {/* User ID */}
                                <SettingsSection title="Identificador de Sistema" description="Tu ID único en la plataforma" icon={Terminal}>
                                    <div className="flex items-center gap-3">
                                        <code className="flex-1 bg-terminal-dark border border-terminal-border rounded-lg px-4 py-2.5 text-xs text-terminal-muted font-mono truncate">
                                            {user?.id || 'N/A'}
                                        </code>
                                        <button
                                            onClick={handleCopyUserId}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-terminal-panel border border-terminal-border rounded-lg text-xs font-medium text-terminal-muted hover:text-white hover:border-terminal-accent/30 transition-all"
                                        >
                                            {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                            {copiedId ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                </SettingsSection>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB: APARIENCIA
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'appearance' && (
                            <>
                                <SettingsSection title="Tema Visual" description="Personaliza el aspecto del sistema" icon={Monitor}>
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {([
                                            { id: 'dark', label: 'Dark', bg: '#0a0a0a', accent: '#ff003c' },
                                            { id: 'darker', label: 'Darker', bg: '#050505', accent: '#ff003c' },
                                            { id: 'midnight', label: 'Midnight', bg: '#080818', accent: '#6366f1' },
                                        ] as const).map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                                                className={`
                                                    relative p-4 rounded-xl border-2 transition-all cursor-pointer
                                                    ${appearance.theme === theme.id
                                                        ? 'border-terminal-accent shadow-[0_0_16px_rgba(255,0,60,0.15)]'
                                                        : 'border-terminal-border hover:border-terminal-border/80'
                                                    }
                                                `}
                                                style={{ background: theme.bg }}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-3 h-3 rounded-full" style={{ background: theme.accent }} />
                                                        <div className="w-3 h-3 rounded-full bg-white/10" />
                                                        <div className="w-3 h-3 rounded-full bg-white/5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="h-1.5 rounded-full bg-white/20 w-full" />
                                                        <div className="h-1.5 rounded-full bg-white/10 w-3/4" />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-3">
                                                    {theme.label}
                                                </p>
                                                {appearance.theme === theme.id && (
                                                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-terminal-accent flex items-center justify-center">
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <SettingsDivider />

                                    <div className="space-y-1">
                                        <SettingsRow
                                            label="Animaciones del Sistema"
                                            description="Transiciones y efectos de movimiento en la UI"
                                        >
                                            <ToggleSwitch
                                                enabled={appearance.animations}
                                                onChange={(v) => setAppearance({ ...appearance, animations: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Modo Compacto"
                                            description="Reduce el espaciado para mostrar más contenido"
                                        >
                                            <ToggleSwitch
                                                enabled={appearance.compactMode}
                                                onChange={(v) => setAppearance({ ...appearance, compactMode: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Mostrar Avatares"
                                            description="Muestra imágenes de perfil en listas y tablas"
                                        >
                                            <ToggleSwitch
                                                enabled={appearance.showAvatars}
                                                onChange={(v) => setAppearance({ ...appearance, showAvatars: v })}
                                            />
                                        </SettingsRow>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Tipografía" description="Tamaño de fuente del sistema" icon={Moon}>
                                    <div className="flex gap-3">
                                        {([
                                            { id: 'sm', label: 'Pequeño', size: 'text-xs' },
                                            { id: 'md', label: 'Normal', size: 'text-sm' },
                                            { id: 'lg', label: 'Grande', size: 'text-base' },
                                        ] as const).map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setAppearance({ ...appearance, fontSize: opt.id })}
                                                className={`
                                                    flex-1 py-3 rounded-lg border text-center transition-all cursor-pointer
                                                    ${appearance.fontSize === opt.id
                                                        ? 'border-terminal-accent bg-terminal-accent/10 text-terminal-accent'
                                                        : 'border-terminal-border text-terminal-muted hover:border-terminal-border/80 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <span className={`${opt.size} font-medium block`}>Aa</span>
                                                <span className="text-[10px] uppercase tracking-widest mt-1 block">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </SettingsSection>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB: NOTIFICACIONES
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'notifications' && (
                            <>
                                <SettingsSection title="Alertas del Sistema" description="Controla qué notificaciones recibes" icon={Bell}>
                                    <div className="space-y-1">
                                        <SettingsRow
                                            label="Alertas del Sistema"
                                            description="Notificaciones críticas de estado del servidor"
                                        >
                                            <ToggleSwitch
                                                enabled={notifPrefs.systemAlerts}
                                                onChange={(v) => setNotifPrefs({ ...notifPrefs, systemAlerts: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Actualizaciones de Tickets"
                                            description="Notificaciones cuando se actualicen tickets asignados"
                                        >
                                            <ToggleSwitch
                                                enabled={notifPrefs.ticketUpdates}
                                                onChange={(v) => setNotifPrefs({ ...notifPrefs, ticketUpdates: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Pings de Discord"
                                            description="Recibir menciones y pings desde el bot de Discord"
                                        >
                                            <ToggleSwitch
                                                enabled={notifPrefs.discordPings}
                                                onChange={(v) => setNotifPrefs({ ...notifPrefs, discordPings: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Alertas de Auditoría"
                                            description="Notificaciones de eventos en el log de auditoría"
                                        >
                                            <ToggleSwitch
                                                enabled={notifPrefs.auditAlerts}
                                                onChange={(v) => setNotifPrefs({ ...notifPrefs, auditAlerts: v })}
                                            />
                                        </SettingsRow>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Preferencias Adicionales" description="Opciones de entrega de notificaciones" icon={Zap}>
                                    <div className="space-y-1">
                                        <SettingsRow
                                            label="Resumen Semanal"
                                            description="Recibe un resumen de actividad cada lunes"
                                        >
                                            <ToggleSwitch
                                                enabled={notifPrefs.weeklyDigest}
                                                onChange={(v) => setNotifPrefs({ ...notifPrefs, weeklyDigest: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Sonido de Notificación"
                                            description="Reproducir sonido al recibir alertas"
                                        >
                                            <ToggleSwitch
                                                enabled={notifPrefs.soundEnabled}
                                                onChange={(v) => setNotifPrefs({ ...notifPrefs, soundEnabled: v })}
                                            />
                                        </SettingsRow>
                                    </div>
                                </SettingsSection>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB: SEGURIDAD
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'security' && (
                            <>
                                <SettingsSection title="Credenciales de Acceso" description="Gestión de contraseña y autenticación" icon={Lock}>
                                    <div className="flex items-start gap-4 p-4 bg-terminal-dark/50 rounded-lg border border-terminal-border/50">
                                        <div className="w-9 h-9 rounded-lg bg-terminal-accent/10 border border-terminal-accent/20 flex items-center justify-center flex-shrink-0">
                                            <Lock size={16} className="text-terminal-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">Seguridad gestionada por Clerk</p>
                                            <p className="text-xs text-terminal-muted mt-1 leading-relaxed">
                                                El cambio de contraseña, correo electrónico y métodos de autenticación se gestionan directamente desde el portal de Clerk.
                                            </p>
                                            <button className="mt-3 flex items-center gap-1.5 text-xs text-terminal-accent hover:underline font-medium">
                                                Abrir portal de seguridad
                                                <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Autenticación de Dos Factores" description="Capa adicional de seguridad" icon={Smartphone}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-terminal-dark border border-terminal-border flex items-center justify-center">
                                                <Key size={18} className="text-terminal-muted" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">Hardware Key (MFA)</p>
                                                <p className="text-xs text-terminal-muted mt-0.5 uppercase tracking-widest font-mono">
                                                    Módulo no inicializado
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 uppercase tracking-widest">
                                            Pendiente
                                        </span>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Sesiones Activas" description="Dispositivos con acceso a tu cuenta" icon={Activity}>
                                    <div className="space-y-3">
                                        {sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-4 bg-terminal-dark/50 rounded-lg border border-terminal-border/50 hover:border-terminal-border transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-terminal-muted'}`} />
                                                    <div>
                                                        <p className="text-xs font-semibold text-white">{session.device}</p>
                                                        <p className="text-[10px] text-terminal-muted mt-0.5 font-mono">
                                                            {session.location} · {session.lastSeen}
                                                        </p>
                                                    </div>
                                                </div>
                                                {session.current ? (
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                                        Actual
                                                    </span>
                                                ) : (
                                                    <button className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors">
                                                        Revocar
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-terminal-border/50">
                                        <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-1.5">
                                            <X size={14} />
                                            Cerrar todas las demás sesiones
                                        </button>
                                    </div>
                                </SettingsSection>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB: INTEGRACIONES
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'integrations' && (
                            <>
                                <SettingsSection title="Discord Nexus" description="Vinculación con el bot de Discord" icon={MessageSquare}>
                                    {/* Status header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${discordData.id
                                                    ? 'border-[#5865F2]/30 bg-[#5865F2]/10'
                                                    : 'border-terminal-border bg-terminal-dark'
                                                }`}>
                                                {discordData.avatar ? (
                                                    <img src={discordData.avatar} className="w-full h-full rounded-xl object-cover" alt="Discord" />
                                                ) : (
                                                    <MessageSquare size={20} className="text-terminal-muted" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Discord Integration</p>
                                                <p className="text-xs text-terminal-muted mt-0.5 font-mono">
                                                    {discordData.username ? `@${discordData.username}` : 'No vinculado'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${discordData.id
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                            }`}>
                                            {discordData.id ? 'Conectado' : 'Desconectado'}
                                        </span>
                                    </div>

                                    <SettingsDivider />

                                    {/* Review Channel */}
                                    <div className="mt-4">
                                        <PremiumInput
                                            label="Review Channel ID"
                                            icon={Hash}
                                            placeholder="ID del canal de Discord..."
                                            value={reviewChannelId}
                                            onChange={(e) => setReviewChannelId(e.target.value)}
                                            className="font-mono"
                                            error="Canal de destino para notificaciones de revisión automática"
                                        />
                                    </div>
                                </SettingsSection>

                                {/* Futuras integraciones */}
                                <SettingsSection title="Otras Integraciones" description="Próximamente disponibles" icon={Zap}>
                                    {[
                                        { name: 'Webhook Externo', desc: 'Envía eventos a una URL personalizada', status: 'soon' },
                                        { name: 'API Key Personal', desc: 'Acceso programático a la API del sistema', status: 'soon' },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 opacity-40">
                                            <div>
                                                <p className="text-sm font-medium text-white">{item.name}</p>
                                                <p className="text-xs text-terminal-muted mt-0.5">{item.desc}</p>
                                            </div>
                                            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-terminal-border/50 text-terminal-muted uppercase tracking-widest">
                                                Pronto
                                            </span>
                                        </div>
                                    ))}
                                </SettingsSection>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            TAB: PRIVACIDAD
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'privacy' && (
                            <>
                                <SettingsSection title="Visibilidad" description="Controla qué información es visible para otros operadores" icon={Eye}>
                                    <div className="space-y-1">
                                        <SettingsRow
                                            label="Estado Online"
                                            description="Permite que otros operadores vean tu estado de conexión"
                                        >
                                            <ToggleSwitch
                                                enabled={privacy.showOnlineStatus}
                                                onChange={(v) => setPrivacy({ ...privacy, showOnlineStatus: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Perfil Público"
                                            description="Hace visible tu perfil a todos los miembros del hub"
                                        >
                                            <ToggleSwitch
                                                enabled={privacy.publicProfile}
                                                onChange={(v) => setPrivacy({ ...privacy, publicProfile: v })}
                                            />
                                        </SettingsRow>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Datos y Telemetría" description="Control sobre el uso de tus datos" icon={Activity}>
                                    <div className="space-y-1">
                                        <SettingsRow
                                            label="Telemetría Anónima"
                                            description="Envío de logs de error anónimos para mejorar el sistema"
                                        >
                                            <ToggleSwitch
                                                enabled={privacy.telemetry}
                                                onChange={(v) => setPrivacy({ ...privacy, telemetry: v })}
                                            />
                                        </SettingsRow>
                                        <SettingsDivider />
                                        <SettingsRow
                                            label="Logger de Actividad"
                                            description="Historial local persistente de comandos ejecutados"
                                        >
                                            <ToggleSwitch
                                                enabled={privacy.activityLog}
                                                onChange={(v) => setPrivacy({ ...privacy, activityLog: v })}
                                            />
                                        </SettingsRow>
                                    </div>
                                </SettingsSection>

                                {/* Zona de peligro */}
                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-red-500/20">
                                        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                                            Zona de Peligro
                                        </h3>
                                        <p className="text-[10px] text-red-400/60 mt-0.5 uppercase tracking-widest">
                                            Acciones irreversibles sobre tu cuenta
                                        </p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-white">Exportar mis datos</p>
                                                <p className="text-xs text-terminal-muted mt-0.5">
                                                    Descarga un archivo con toda tu información almacenada
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 border border-terminal-border rounded-lg text-xs font-medium text-terminal-muted hover:text-white hover:border-terminal-border/80 transition-all">
                                                Exportar
                                            </button>
                                        </div>
                                        <div className="h-px bg-red-500/10" />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-red-400">Cerrar Sesión Global</p>
                                                <p className="text-xs text-terminal-muted mt-0.5">
                                                    Cierra sesión en todos los dispositivos activos
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => signOut({ redirectUrl: '/sign-in' })}
                                                className="px-4 py-2 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
                                            >
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-8 py-4 border-t border-terminal-border flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-mono text-terminal-muted/50 uppercase tracking-widest">
                    <Clock size={10} />
                    <span>SNC: KERNEL_2.4.0</span>
                    <span>·</span>
                    <span>State: Optimal</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-terminal-muted/50 uppercase tracking-widest">
                    <span className="hover:text-terminal-muted cursor-pointer transition-colors">Support</span>
                    <span className="hover:text-terminal-muted cursor-pointer transition-colors">System Policy</span>
                </div>
            </div>
        </div>
    );
}
