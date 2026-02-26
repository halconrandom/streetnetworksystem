import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Lock, Globe, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsForm() {
    const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        language: 'es'
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${apiBase}/auth/me`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load user data');
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || ''
                }));
            } catch (err: any) {
                setError(err.message || 'Connection error');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [apiBase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const payload: any = {};
            if (formData.name) payload.name = formData.name;
            if (formData.email) payload.email = formData.email;
            if (formData.password) payload.password = formData.password;

            const res = await fetch(`${apiBase}/users/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update settings');

            setSuccess('Configuración actualizada correctamente.');
            setFormData(prev => ({ ...prev, password: '' })); // Clear password after save
        } catch (err: any) {
            setError(err.message || 'Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12 text-terminal-muted">
                <RefreshCw size={24} className="animate-spin" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-mono">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-3 bg-terminal-accent/10 border border-terminal-accent/20 text-terminal-accent rounded-lg text-sm font-mono">
                    <CheckCircle2 size={16} />
                    {success}
                </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
                <label className="text-[10px] text-terminal-muted uppercase font-bold tracking-widest flex items-center gap-2">
                    <User size={12} /> Operator Name
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your operator alias..."
                    className="w-full bg-terminal-dark/50 border border-terminal-border rounded-lg px-4 py-2.5 text-white focus:border-terminal-accent outline-none font-mono transition-colors"
                />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
                <label className="text-[10px] text-terminal-muted uppercase font-bold tracking-widest flex items-center gap-2">
                    <Mail size={12} /> Uplink Address (Email)
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="operator@network.local"
                    className="w-full bg-terminal-dark/50 border border-terminal-border rounded-lg px-4 py-2.5 text-white focus:border-terminal-accent outline-none font-mono transition-colors"
                />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <label className="text-[10px] text-terminal-muted uppercase font-bold tracking-widest flex items-center gap-2">
                    <Lock size={12} /> Security Key (Password)
                </label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current key..."
                    className="w-full bg-terminal-dark/50 border border-terminal-border rounded-lg px-4 py-2.5 text-white focus:border-terminal-accent outline-none font-mono placeholder:text-terminal-muted/40 transition-colors"
                />
            </div>

            {/* Language Field - Visual Only */}
            <div className="space-y-2">
                <label className="text-[10px] text-terminal-muted uppercase font-bold tracking-widest flex items-center gap-2">
                    <Globe size={12} /> Interface Protocol
                </label>
                <div className="relative">
                    <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full bg-terminal-dark/50 border border-terminal-border rounded-lg px-4 py-2.5 text-white focus:border-terminal-accent outline-none font-mono appearance-none transition-colors"
                    >
                        <option value="es">ES - Spanish Protocol</option>
                        <option value="en">EN - English Protocol</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-terminal-muted">
                        ▼
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-terminal-border">
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-terminal-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-terminal-accent/80 transition-all shadow-lg shadow-terminal-accent/20 active:scale-95 disabled:opacity-50"
                >
                    {saving ? (
                        <RefreshCw size={16} className="animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    {saving ? 'Transmitting...' : 'Commit Changes'}
                </button>
            </div>
        </form>
    );
}
