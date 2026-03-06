'use client';

import React, { useState, useEffect } from 'react';
import {
    User,
    Shield,
    MessageSquare,
    Eye,
    Bell,
    Lock,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    X,
    Copy,
    Check,
    Clock,
    Globe,
    Zap,
    Activity,
    Terminal,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from '@clerk/nextjs';
import ToggleSwitch from './ToggleSwitch';
import SettingsSection, { SettingsRow, SettingsDivider } from './SettingsSection';
import AvatarUpload from './AvatarUpload';
import PremiumInput from '@/shared/ui/PremiumInput';
import PremiumTextarea from '@/shared/ui/PremiumTextarea';
import PremiumSelect from '@/shared/ui/PremiumSelect';

type Tab = 'profile' | 'notifications' | 'security' | 'integrations' | 'privacy';

const TABS: { id: Tab; label: string; icon: React.ElementType; disabled?: boolean }[] = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, disabled: true },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'integrations', label: 'Integraciones', icon: MessageSquare },
    { id: 'privacy', label: 'Privacidad', icon: Eye, disabled: true },
];

interface Notification {
    type: 'error' | 'success';
    message: string;
}

export default function SettingsForm() {
    const { user, isLoaded } = useUser();
    const { signOut, openUserProfile } = useClerk();

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
    const [discordData, setDiscordData] = useState<{
        id: string | null;
        username: string | null;
        avatar: string | null;
    }>({ id: null, username: null, avatar: null });

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [savingAvatar, setSavingAvatar] = useState(false);

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
                    setAvatarUrl(data.avatarUrl || null);
                }
            } catch { /* non-fatal */ }
        };
        if (isLoaded && user) fetchUserData();
    }, [isLoaded, user]);

    const handleAvatarChange = async (url: string | null) => {
        setSavingAvatar(true);
        try {
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ avatar_url: url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');
            setAvatarUrl(url);
            showNotification('success', url ? 'Avatar actualizado correctamente' : 'Avatar restaurado a Discord');
            // Notify AppShell to refresh user data
            window.dispatchEvent(new CustomEvent('user-avatar-updated'));
        } catch (err) {
            showNotification('error', (err as Error).message || 'Error al guardar el avatar');
            throw err;
        } finally {
            setSavingAvatar(false);
        }
    };

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
                        const isDisabled = tab.disabled;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => !isDisabled && setActiveTab(tab.id)}
                                disabled={isDisabled}
                                className={`
                                    relative flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider
                                    transition-all duration-200
                                    ${isDisabled
                                        ? 'text-terminal-muted/30 cursor-not-allowed'
                                        : isActive
                                            ? 'text-terminal-accent cursor-pointer'
                                            : 'text-terminal-muted hover:text-white cursor-pointer'
                                    }
                                `}
                            >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {isDisabled && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider">
                                        Pronto
                                    </span>
                                )}
                                {isActive && !isDisabled && (
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
                                            customAvatarUrl={avatarUrl}
                                            discordAvatarUrl={discordData.avatar || user?.imageUrl}
                                            userName={formData.name || user?.username || 'U'}
                                            onAvatarChange={handleAvatarChange}
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
                                        <div className="relative">
                                            <PremiumSelect
                                                label="Idioma de Interfaz"
                                                options={languageOptions}
                                                value={languageOptions.find(opt => opt.value === formData.language)}
                                                onChange={() => {}}
                                                isDisabled
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-terminal-dark/80 rounded-lg pointer-events-none">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                                                    En Desarrollo
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <PremiumSelect
                                                label="Zona Horaria"
                                                options={timezoneOptions}
                                                value={timezoneOptions.find(opt => opt.value === formData.timezone)}
                                                onChange={() => {}}
                                                isDisabled
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-terminal-dark/80 rounded-lg pointer-events-none">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                                                    En Desarrollo
                                                </span>
                                            </div>
                                        </div>
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
                                <SettingsSection title="Portal de Seguridad" description="Gestión de cuenta y autenticación" icon={Shield}>
                                    <div className="flex items-start gap-4 p-5 bg-terminal-dark/50 rounded-xl border border-terminal-border/50">
                                        <div className="w-12 h-12 rounded-xl bg-terminal-accent/10 border border-terminal-accent/20 flex items-center justify-center flex-shrink-0">
                                            <Shield size={22} className="text-terminal-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white mb-2">Seguridad gestionada por Clerk</p>
                                            <p className="text-xs text-terminal-muted leading-relaxed mb-4">
                                                Accede al portal de seguridad para gestionar tu contraseña, autenticación de dos factores, sesiones activas y métodos de inicio de sesión.
                                            </p>
                                            <button 
                                                onClick={() => openUserProfile()}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-terminal-accent hover:bg-terminal-accent/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] shadow-[0_4px_20px_rgba(255,0,60,0.2)]"
                                            >
                                                <Lock size={14} />
                                                Abrir Portal de Seguridad
                                            </button>
                                        </div>
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
