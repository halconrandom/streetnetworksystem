'use client';

import {
    Capsule,
    Component,
    ComponentType,
    ContainerComponent,
    PassProps,
    SectionComponent,
    TextDisplayComponent,
} from '@integrations/components-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions, DisplaySliceManager, RootState } from './state';
import { BetterInput } from './BetterInput';
import { EmojiPicker } from './EmojiPicker';
import { EmojiShow } from './EmojiShow';
import { ColorPicker } from './ColorPicker';
import { webhookImplementation } from './webhook.impl';
import { ErrorBoundary } from 'react-error-boundary';

function getThreadId(webhookUrl: string) {
    try {
        const parsed_url = new URL(webhookUrl);
        const parsed_query = new URLSearchParams(parsed_url.search);
        return parsed_query.get('thread_id') || null;
    } catch {
        return null;
    }
}

// ── Small reusable UI primitives ────────────────────────────────────────────

function NbButton({
    children,
    onClick,
    disabled,
    variant = 'default',
    className = '',
    type = 'button',
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'primary' | 'danger' | 'ghost';
    className?: string;
    type?: 'button' | 'submit';
}) {
    const base =
        'inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold border-2 border-black transition-all select-none whitespace-nowrap';
    const variants = {
        default:
            'bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed',
        primary:
            'bg-violet-500 text-white shadow-[2px_2px_0px_#000] hover:bg-violet-600 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed',
        danger:
            'bg-[#ED4245] text-white shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
        ghost:
            'bg-transparent border-black hover:bg-black hover:text-[#fdfbf7] transition-colors',
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

function NbInput({
    value,
    onChange,
    placeholder,
    type = 'text',
    className = '',
    autoFocus,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    className?: string;
    autoFocus?: boolean;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`bg-[#fdfbf7] border-2 border-black px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black w-full ${className}`}
        />
    );
}

function NbSelect({
    value,
    onChange,
    children,
    className = '',
}: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`bg-[#fdfbf7] border-2 border-black px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black ${className}`}
        >
            {children}
        </select>
    );
}

function NbLabel({ children }: { children: React.ReactNode }) {
    return <label className="block text-xs font-bold uppercase tracking-wide mb-1">{children}</label>;
}

function NbModal({
    open,
    onClose,
    title,
    subtitle,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-[#fdfbf7] border-2 border-black shadow-[6px_6px_0px_#000] w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between p-4 border-b-2 border-black">
                    <div>
                        <h3 className="text-lg font-black tracking-tight">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-4 w-7 h-7 border-2 border-black flex items-center justify-center font-black text-sm hover:bg-black hover:text-[#fdfbf7] transition-colors shrink-0"
                    >
                        ✕
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

function NbSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-2 border-black p-3">
            <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-500">{title}</p>
            {children}
        </div>
    );
}

function NbEmpty({ title, sub }: { title: string; sub: string }) {
    return (
        <div className="text-center py-6 border-2 border-dashed border-gray-300">
            <p className="font-bold text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
    );
}

// ── Main App ─────────────────────────────────────────────────────────────────

function App() {
    const dispatch = useDispatch();
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);
    const state = useSelector((s: RootState) => s.display.data);
    const webhookUrl = useSelector((s: RootState) => s.display.webhookUrl);
    const response = useSelector((s: RootState) => s.display.webhookResponse);
    const showThread = useSelector((s: RootState) => s.display.showThread);

    const [postTitle, setPostTitle] = useState('');
    const [showJson, setShowJson] = useState(false);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    // — Modal visibility
    const [targetsOpen, setTargetsOpen] = useState(false);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [mentionsOpen, setMentionsOpen] = useState(false);
    const [postTitleOpen, setPostTitleOpen] = useState(false);

    // — Webhook targets
    const [targets, setTargets] = useState<Array<{
        id: string; name: string; value: string; kind: 'webhook' | 'channel';
        isThreadEnabled?: boolean; threadId?: string;
    }>>([]);
    const [newTargetName, setNewTargetName] = useState('');
    const [newTargetValue, setNewTargetValue] = useState('');
    const [newTargetKind, setNewTargetKind] = useState<'webhook' | 'channel'>('webhook');
    const [newTargetThreadEnabled, setNewTargetThreadEnabled] = useState(false);
    const [newTargetThreadId, setNewTargetThreadId] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
    const [editingTarget, setEditingTarget] = useState({ name: '', value: '' });

    // — Templates
    const [templates, setTemplates] = useState<Array<{ id: string; name: string; data: typeof state }>>([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState('');

    // — Mentions
    const [mentions, setMentions] = useState<Array<{
        id: string; keyword: string; kind: 'role' | 'user' | 'channel' | 'mentionable';
        targetId: string; displayName?: string;
    }>>([]);
    const [newMentionKeyword, setNewMentionKeyword] = useState('');
    const [newMentionKind, setNewMentionKind] = useState<'role' | 'user' | 'channel' | 'mentionable'>('role');
    const [newMentionId, setNewMentionId] = useState('');
    const [newMentionName, setNewMentionName] = useState('');
    const [editingMentionId, setEditingMentionId] = useState<string | null>(null);
    const [editingMention, setEditingMention] = useState({ keyword: '', displayName: '', targetId: '' });

    // — API config
    const apiBase = useMemo(() => {
        const env = process.env.NEXT_PUBLIC_MESSAGE_BUILDER_API;
        if (typeof env === 'string' && env.trim()) return env.replace(/\/$/, '');
        return '/api/message-builder';
    }, []);
    const isLocalApi = apiBase === '/api/message-builder';

    const proxyKey = useMemo(() => {
        const env = process.env.NEXT_PUBLIC_BACKEND_PROXY_KEY;
        if (typeof env === 'string' && env.trim()) return env;
        if (typeof window !== 'undefined') {
            const w = (window as any)?.__VITE_BACKEND_PROXY_KEY__;
            if (typeof w === 'string' && w.trim()) return w;
        }
        return '';
    }, []);

    const requestUrl = useMemo(() => webhookImplementation.buildRequestUrl(webhookUrl), [webhookUrl]);
    const errors = useMemo(() => webhookImplementation.getErrors(response), [response]);
    const lastErrorRef = useRef('');
    const threadId = useMemo(() => getThreadId(webhookUrl), [webhookUrl]);

    // — Container accent / spoiler
    const primaryContainerIndex = useMemo(
        () => state.findIndex((item) => item.type === ComponentType.CONTAINER),
        [state]
    );
    const primaryContainer = primaryContainerIndex >= 0 ? state[primaryContainerIndex] : null;
    const accentColor = primaryContainer && 'accent_color' in primaryContainer ? primaryContainer.accent_color ?? null : null;
    const spoilerEnabled = primaryContainer && 'spoiler' in primaryContainer ? !!primaryContainer.spoiler : false;
    const accentHex = useMemo(() => {
        const v = typeof accentColor === 'number' ? accentColor : 0;
        return `#${v.toString(16).padStart(6, '0')}`;
    }, [accentColor]);

    // — PassProps for the SDK Capsule
    const setFile = useCallback(webhookImplementation.setFile, []);
    const getFile = useCallback(webhookImplementation.getFile, []);
    const getFileName = useCallback(webhookImplementation.getFileName, []);
    const passProps = useMemo((): PassProps => ({
        getFile, getFileName, setFile,
        BetterInput, EmojiPicker, ColorPicker, EmojiShow,
        interactiveDisabled: false,
    }), []);

    const stateKey = useMemo(() => ['data'], []);

    // — Lifecycle
    useEffect(() => {
        if (typeof window !== 'undefined') webhookImplementation.init();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => localStorage.setItem('discord.builders__webhookToken', webhookUrl), 1000);
        return () => clearTimeout(t);
    }, [webhookUrl]);

    useEffect(() => {
        if (threadId) dispatch(actions.setShowThread());
    }, [threadId]);

    useEffect(() => {
        if (!response || typeof response !== 'object') return;
        const r = response as any;
        if (r.status === '204 Success') return;
        const msg = r?.message || r?.error || r?.code;
        if (typeof msg !== 'string' || !msg.trim()) return;
        if (lastErrorRef.current === msg) return;
        lastErrorRef.current = msg;
        window.alert(msg);
    }, [response]);

    useEffect(() => {
        if (!colorPickerOpen) return;
        const handle = (e: MouseEvent) => {
            if (!colorPickerRef.current?.contains(e.target as Node)) setColorPickerOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [colorPickerOpen]);

    // — Load data from API
    useEffect(() => {
        if (!apiBase) return;
        const load = async () => {
            try {
                const [wRes, tRes, mRes] = await Promise.all([
                    fetch(`${apiBase}/webhooks`),
                    fetch(`${apiBase}/templates`),
                    fetch(`${apiBase}/mentions`),
                ]);
                if (wRes.ok) {
                    const rows = await wRes.json();
                    if (Array.isArray(rows)) setTargets(rows.map((r) => ({
                        id: r.id, name: r.name, value: r.value, kind: r.kind,
                        isThreadEnabled: r.is_thread_enabled, threadId: r.thread_id ?? undefined,
                    })));
                }
                if (tRes.ok) {
                    const rows = await tRes.json();
                    if (Array.isArray(rows)) setTemplates(rows.map((r) => ({ id: r.id, name: r.name, data: r.data })));
                }
                if (mRes.ok) {
                    const rows = await mRes.json();
                    if (Array.isArray(rows)) setMentions(rows.map((r) => ({
                        id: r.id, keyword: r.keyword, kind: r.kind,
                        targetId: r.target_id, displayName: r.display_name ?? undefined,
                    })));
                }
            } catch (err) {
                console.error('Failed to load message builder data', err);
            }
        };
        load();
    }, [apiBase]);

    // — Share state via URL hash (gzip + base64)
    const shareState = async () => {
        try {
            const cs = new CompressionStream('gzip');
            const writer = cs.writable.getWriter();
            writer.write(new TextEncoder().encode(JSON.stringify(state)));
            writer.close();
            const data = await new Response(cs.readable).bytes();
            let binary = '';
            for (const b of data) binary += String.fromCharCode(b);
            const encoded = `1$${btoa(binary)}`;
            const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                window.alert('Share link copied to clipboard.');
            } else {
                window.alert('Share link ready in the address bar.');
            }
        } catch {
            window.alert('Failed to generate share link.');
        }
    };

    // — Send message
    const sendMessage = async () => {
        if (!requestUrl) return;
        if (!proxyKey) {
            dispatch(actions.setWebhookResponse({ message: 'Missing BACKEND_PROXY_KEY' }));
            return;
        }
        const prepared = applyMentionsToState(state);
        const init = webhookImplementation.prepareRequest(prepared);
        const headers = new Headers(init.headers || {});
        headers.set('x-api-key', proxyKey);
        const req = await fetch(requestUrl, { ...init, headers });
        if (req.status === 204) {
            dispatch(actions.setWebhookResponse({ status: '204 Success' }));
            return;
        }
        const errData = await req.json();
        if (errData?.code === 220001) {
            setPostTitleOpen(true);
            dispatch(actions.setWebhookResponse(null));
            return;
        }
        dispatch(actions.setWebhookResponse(errData));
    };

    const sendMessageWithTitle = async () => {
        if (!postTitle || !requestUrl) return;
        setPostTitleOpen(false);
        if (!proxyKey) { dispatch(actions.setWebhookResponse({ message: 'Missing BACKEND_PROXY_KEY' })); return; }
        const prepared = applyMentionsToState(state);
        const init = webhookImplementation.prepareRequest(prepared, postTitle);
        const headers = new Headers(init.headers || {});
        headers.set('x-api-key', proxyKey);
        const req = await fetch(requestUrl, { ...init, headers });
        if (req.status === 204) { dispatch(actions.setWebhookResponse({ status: '204 Success' })); return; }
        dispatch(actions.setWebhookResponse(await req.json()));
    };

    // — Targets CRUD
    const threadIdIsValid = useMemo(() => {
        if (!newTargetThreadEnabled) return true;
        return /^\d+$/.test(newTargetThreadId.trim());
    }, [newTargetThreadEnabled, newTargetThreadId]);

    const addTarget = async () => {
        const name = newTargetName.trim(), value = newTargetValue.trim();
        if (!name || !value || !threadIdIsValid) return;
        try {
            const res = await fetch(`${apiBase}/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, value, kind: newTargetKind, is_thread_enabled: newTargetThreadEnabled, thread_id: newTargetThreadEnabled ? newTargetThreadId.trim() : null }),
            });
            if (!res.ok) throw new Error();
            const row = await res.json();
            setTargets((p) => [{ id: row.id, name: row.name, value: row.value, kind: row.kind, isThreadEnabled: row.is_thread_enabled, threadId: row.thread_id ?? undefined }, ...p]);
        } catch { window.alert('Failed to save webhook.'); return; }
        setNewTargetName(''); setNewTargetValue(''); setNewTargetKind('webhook');
        setNewTargetThreadEnabled(false); setNewTargetThreadId('');
    };

    const useTarget = (targetId: string) => {
        const target = targets.find((t) => t.id === targetId);
        if (!target) return;
        if (target.kind === 'webhook' && target.isThreadEnabled && target.threadId) {
            try {
                const parsed = new URL(target.value);
                const q = new URLSearchParams(parsed.search);
                q.set('thread_id', target.threadId);
                parsed.search = q.toString();
                dispatch(actions.setWebhookUrl(parsed.toString()));
            } catch { dispatch(actions.setWebhookUrl(target.value)); }
        } else {
            dispatch(actions.setWebhookUrl(target.value));
        }
        setSelectedTargetId(target.id);
        setTargetsOpen(false);
    };

    const removeTarget = async (id: string) => {
        try {
            const res = await fetch(`${apiBase}/webhooks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
        } catch { window.alert('Failed to delete webhook.'); return; }
        setTargets((p) => p.filter((t) => t.id !== id));
    };

    const saveEditTarget = async (id: string) => {
        const name = editingTarget.name.trim(), value = editingTarget.value.trim();
        if (!name || !value) return;
        try {
            const res = await fetch(`${apiBase}/webhooks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, value }),
            });
            if (!res.ok) throw new Error();
        } catch { window.alert('Failed to update target.'); return; }
        setTargets((p) => p.map((t) => t.id === id ? { ...t, name, value } : t));
        setEditingTargetId(null);
    };

    // — Templates CRUD
    const addTemplate = async () => {
        const name = newTemplateName.trim();
        if (!name) return;
        try {
            const res = await fetch(`${apiBase}/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, data: state }),
            });
            if (!res.ok) throw new Error();
            const row = await res.json();
            setTemplates((p) => [{ id: row.id, name: row.name, data: row.data }, ...p]);
        } catch { window.alert('Failed to save template.'); return; }
        setNewTemplateName('');
    };

    const applyTemplate = (id: string) => {
        const t = templates.find((t) => t.id === id);
        if (!t) return;
        dispatch(actions.setKey({ key: ['data'], value: t.data }));
        setTemplatesOpen(false);
    };

    const removeTemplate = async (id: string) => {
        try {
            const res = await fetch(`${apiBase}/templates/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
        } catch { window.alert('Failed to delete template.'); return; }
        setTemplates((p) => p.filter((t) => t.id !== id));
    };

    const saveEditTemplate = async (id: string) => {
        const name = editingTemplateName.trim();
        if (!name) return;
        try {
            const res = await fetch(`${apiBase}/templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error();
        } catch { window.alert('Failed to update template.'); return; }
        setTemplates((p) => p.map((t) => t.id === id ? { ...t, name } : t));
        setEditingTemplateId(null);
    };

    // — Mentions CRUD
    const mentionIdIsValid = useMemo(() => /^\d+$/.test(newMentionId.trim()), [newMentionId]);

    const addMention = async () => {
        const keyword = newMentionKeyword.trim(), targetId = newMentionId.trim();
        if (!keyword || !targetId || !mentionIdIsValid) return;
        try {
            const res = await fetch(`${apiBase}/mentions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, kind: newMentionKind, target_id: targetId, display_name: newMentionName.trim() || null }),
            });
            if (!res.ok) throw new Error();
            const row = await res.json();
            setMentions((p) => [{ id: row.id, keyword: row.keyword, kind: row.kind, targetId: row.target_id, displayName: row.display_name ?? undefined }, ...p]);
        } catch { window.alert('Failed to save mention.'); return; }
        setNewMentionKeyword(''); setNewMentionId(''); setNewMentionKind('role'); setNewMentionName('');
    };

    const removeMention = async (id: string) => {
        try {
            const res = await fetch(`${apiBase}/mentions/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
        } catch { window.alert('Failed to delete mention.'); return; }
        setMentions((p) => p.filter((m) => m.id !== id));
    };

    const saveEditMention = async (id: string) => {
        const keyword = editingMention.keyword.trim(), targetId = editingMention.targetId.trim();
        if (!keyword || !/^\d+$/.test(targetId)) return;
        try {
            const res = await fetch(`${apiBase}/mentions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, target_id: targetId, display_name: editingMention.displayName.trim() || null }),
            });
            if (!res.ok) throw new Error();
        } catch { window.alert('Failed to update mention.'); return; }
        setMentions((p) => p.map((m) => m.id === id ? { ...m, keyword, targetId, displayName: editingMention.displayName.trim() || undefined } : m));
        setEditingMentionId(null);
    };

    // — Mention substitution
    const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const buildMentionTag = (entry: typeof mentions[number]) => {
        switch (entry.kind) {
            case 'role': return `<@&${entry.targetId}>`;
            case 'channel': return `<#${entry.targetId}>`;
            default: return `<@${entry.targetId}>`;
        }
    };
    const buildMentionVariants = (keyword: string) => {
        const trimmed = keyword.trim();
        if (!trimmed) return [];
        const base = trimmed.replace(/^[@#]/, '');
        const variants = new Set<string>();
        if (trimmed.startsWith('@') || trimmed.startsWith('#')) {
            variants.add(trimmed);
            if (base) variants.add(`{${base}}`);
        } else {
            variants.add(`@${base}`); variants.add(`#${base}`); variants.add(`{${base}}`);
        }
        return Array.from(variants).filter(Boolean);
    };
    const replaceMentionsInText = (text: string) => {
        let output = text;
        for (const entry of mentions) {
            const variants = buildMentionVariants(entry.keyword);
            if (!variants.length) continue;
            const tag = buildMentionTag(entry);
            for (const variant of variants) output = output.replace(new RegExp(escapeRegex(variant), 'g'), tag);
        }
        return output;
    };
    const isTextDisplay = (v: Component): v is TextDisplayComponent => v.type === ComponentType.TEXT_DISPLAY;
    const isSection = (v: Component): v is SectionComponent => v.type === ComponentType.SECTION;
    const isContainer = (v: Component): v is ContainerComponent => v.type === ComponentType.CONTAINER;
    const applyMentionsToState = useCallback((components: Component[]) => {
        const map = (items: Component[]): Component[] => items.map((item) => {
            if (isTextDisplay(item)) return { ...item, content: replaceMentionsInText(item.content) };
            if (isSection(item)) return { ...item, components: item.components.map((inner) => ({ ...inner, content: replaceMentionsInText(inner.content) })) };
            if (isContainer(item)) return { ...item, components: map(item.components) };
            return item;
        });
        return map(components);
    }, [mentions]);

    const updateContainerAccent = (value: number | null) => {
        if (primaryContainerIndex < 0) return;
        stateManager.setKey({ key: ['data', primaryContainerIndex, 'accent_color'], value });
    };
    const toggleContainerSpoiler = () => {
        if (primaryContainerIndex < 0) return;
        stateManager.setKey({ key: ['data', primaryContainerIndex, 'spoiler'], value: !spoilerEnabled });
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b-2 border-black bg-[#fdfbf7] flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="font-black text-base tracking-tight">Message Builder</span>
                    {selectedTargetId && (
                        <span className="text-xs font-bold border-2 border-black px-2 py-0.5 bg-black text-[#fdfbf7]">
                            {targets.find((t) => t.id === selectedTargetId)?.name || 'Selected'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <NbButton onClick={() => setShowJson((p) => !p)}>
                        {showJson ? 'Hide JSON' : 'Show JSON'}
                    </NbButton>

                    {/* Color picker popover */}
                    <div className="relative" ref={colorPickerRef}>
                        <NbButton
                            disabled={primaryContainerIndex < 0}
                            onClick={() => setColorPickerOpen((p) => !p)}
                            className={accentColor != null ? 'ring-2 ring-black' : ''}
                        >
                            {accentColor != null && (
                                <span
                                    className="w-3 h-3 rounded-full border border-black mr-1.5 inline-block"
                                    style={{ backgroundColor: accentHex }}
                                />
                            )}
                            Color
                        </NbButton>
                        {colorPickerOpen && (
                            <div className="absolute right-0 top-full mt-1 z-20">
                                <ColorPicker hexColor={accentHex} onChange={updateContainerAccent} />
                            </div>
                        )}
                    </div>

                    <NbButton
                        disabled={primaryContainerIndex < 0}
                        onClick={toggleContainerSpoiler}
                        className={spoilerEnabled ? 'bg-black text-[#fdfbf7]' : ''}
                    >
                        Incognito
                    </NbButton>
                    <NbButton onClick={shareState}>Share</NbButton>
                    <NbButton onClick={() => setMentionsOpen(true)}>Mentions</NbButton>
                    <NbButton onClick={() => setTemplatesOpen(true)}>Saved Containers</NbButton>
                    <NbButton onClick={() => setTargetsOpen(true)}>Saved Webhooks</NbButton>
                    <NbButton variant="primary" disabled={requestUrl == null} onClick={sendMessage}>
                        Send
                    </NbButton>
                </div>
            </div>

            {/* Main layout: builder + optional right panel */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Capsule — Discord component builder */}
                <div className="flex-1 overflow-auto p-4">
                    <ErrorBoundary fallback={<div className="p-4 border-2 border-red-500 text-red-700 font-bold">Builder error — check console</div>}>
                        <Capsule
                            state={state}
                            stateManager={stateManager}
                            stateKey={stateKey}
                            passProps={passProps}
                            errors={errors}
                        />
                    </ErrorBoundary>
                </div>

                {/* Right panel: thread input + JSON */}
                {(showThread || showJson) && (
                    <div className="w-72 shrink-0 border-l-2 border-black overflow-y-auto p-4 space-y-4 bg-[#fdfbf7]">
                        <p className="text-xs text-gray-500 font-medium">
                            Select a saved webhook to send messages. Saved Webhooks can include Channel IDs for bot mode.
                        </p>

                        {showThread && (
                            <div>
                                <NbLabel>Thread ID</NbLabel>
                                <NbInput
                                    value={threadId || ''}
                                    onChange={(v) => dispatch(actions.setThreadId(v))}
                                    placeholder="123456789012345678"
                                />
                            </div>
                        )}

                        {showJson && (
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-2">JSON</p>
                                <pre className="text-xs font-mono bg-black text-green-400 p-3 overflow-x-auto border-2 border-black">
                                    {JSON.stringify(state, undefined, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}

            {/* Post title modal */}
            <NbModal open={postTitleOpen} onClose={() => setPostTitleOpen(false)} title="Thread Post Title" subtitle="This message will be sent as a forum post.">
                <NbLabel>Post title</NbLabel>
                <NbInput value={postTitle} onChange={setPostTitle} placeholder="My announcement" autoFocus />
                <div className="flex justify-end">
                    <NbButton variant="primary" onClick={sendMessageWithTitle}>Send Post</NbButton>
                </div>
            </NbModal>

            {/* Saved Webhooks modal */}
            <NbModal open={targetsOpen} onClose={() => setTargetsOpen(false)} title="Saved Webhooks" subtitle="Configure and manage destinations for 1-click publishing.">
                <NbSection title="New target">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <NbLabel>Name</NbLabel>
                            <NbInput value={newTargetName} onChange={setNewTargetName} placeholder="Spider OpenClaw Channel" />
                        </div>
                        <div>
                            <NbLabel>Target</NbLabel>
                            <NbInput value={newTargetValue} onChange={setNewTargetValue} placeholder="Webhook URL or Channel ID" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                            <button
                                type="button"
                                onClick={() => setNewTargetThreadEnabled((p) => !p)}
                                className={`w-10 h-5 border-2 border-black relative transition-colors ${newTargetThreadEnabled ? 'bg-black' : 'bg-[#fdfbf7]'}`}
                            >
                                <span className={`absolute top-0.5 w-3 h-3 bg-white border border-black transition-all ${newTargetThreadEnabled ? 'left-5' : 'left-0.5'}`} />
                            </button>
                            Send to Thread
                        </label>
                        <span className="text-xs text-gray-500">Use when target is a forum/thread.</span>
                    </div>
                    {newTargetThreadEnabled && (
                        <div className="mb-2">
                            <NbInput value={newTargetThreadId} onChange={setNewTargetThreadId} placeholder="123456789012345678" />
                            {!threadIdIsValid && <p className="text-xs text-red-600 font-bold mt-1">Thread ID must be numeric.</p>}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <NbSelect value={newTargetKind} onChange={(v) => setNewTargetKind(v as 'webhook' | 'channel')}>
                            <option value="webhook">Webhook URL</option>
                            <option value="channel">Channel ID (bot)</option>
                        </NbSelect>
                        <NbButton variant="primary" disabled={!threadIdIsValid} onClick={addTarget}>Add Target</NbButton>
                    </div>
                </NbSection>

                <NbSection title="Configured targets">
                    {targets.length === 0
                        ? <NbEmpty title="No saved targets yet." sub="Add your first webhook or channel above" />
                        : targets.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-2 border-2 border-black p-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    {editingTargetId === item.id ? (
                                        <div className="space-y-1">
                                            <NbInput value={editingTarget.name} onChange={(v) => setEditingTarget((p) => ({ ...p, name: v }))} />
                                            <NbInput value={editingTarget.value} onChange={(v) => setEditingTarget((p) => ({ ...p, value: v }))} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-bold text-sm flex items-center gap-1">
                                                {item.name}
                                                {item.threadId && <span className="text-xs border border-black px-1">{item.threadId.slice(0, 3)}…{item.threadId.slice(-3)}</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{item.value}</div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {editingTargetId === item.id ? (
                                        <>
                                            <NbButton variant="ghost" onClick={() => saveEditTarget(item.id)}>Save</NbButton>
                                            <NbButton variant="ghost" onClick={() => setEditingTargetId(null)}>Cancel</NbButton>
                                        </>
                                    ) : (
                                        <>
                                            <NbButton variant="ghost" onClick={() => useTarget(item.id)}>Use</NbButton>
                                            <NbButton variant="ghost" onClick={() => { setEditingTargetId(item.id); setEditingTarget({ name: item.name, value: item.value }); }}>Edit</NbButton>
                                            <NbButton variant="danger" onClick={() => removeTarget(item.id)}>✕</NbButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </NbSection>
            </NbModal>

            {/* Saved Containers modal */}
            <NbModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} title="Saved Containers" subtitle="Save and load reusable builder states.">
                <NbSection title="Create container preset">
                    <div className="flex gap-2">
                        <NbInput value={newTemplateName} onChange={setNewTemplateName} placeholder="Container name" className="flex-1" />
                        <NbButton variant="primary" onClick={addTemplate}>Save</NbButton>
                    </div>
                </NbSection>

                <NbSection title="Library">
                    {templates.length === 0
                        ? <NbEmpty title="No saved containers yet." sub="Save your first container above" />
                        : templates.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-2 border-2 border-black p-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    {editingTemplateId === item.id ? (
                                        <NbInput value={editingTemplateName} onChange={setEditingTemplateName} />
                                    ) : (
                                        <>
                                            <div className="font-bold text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-500">Components: {item.data?.length ?? 0}</div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {editingTemplateId === item.id ? (
                                        <>
                                            <NbButton variant="ghost" onClick={() => saveEditTemplate(item.id)}>Save</NbButton>
                                            <NbButton variant="ghost" onClick={() => setEditingTemplateId(null)}>Cancel</NbButton>
                                        </>
                                    ) : (
                                        <>
                                            <NbButton variant="ghost" onClick={() => applyTemplate(item.id)}>Load</NbButton>
                                            <NbButton variant="ghost" onClick={() => { setEditingTemplateId(item.id); setEditingTemplateName(item.name); }}>Edit</NbButton>
                                            <NbButton variant="danger" onClick={() => removeTemplate(item.id)}>✕</NbButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </NbSection>
            </NbModal>

            {/* Mention Aliases modal */}
            <NbModal open={mentionsOpen} onClose={() => setMentionsOpen(false)} title="Mention Aliases" subtitle="Define shortcuts for roles, users and channels.">
                <NbSection title="Create alias">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <NbLabel>Alias</NbLabel>
                            <NbInput value={newMentionKeyword} onChange={setNewMentionKeyword} placeholder="@staff, #support, {vip}" />
                        </div>
                        <div>
                            <NbLabel>Display name (optional)</NbLabel>
                            <NbInput value={newMentionName} onChange={setNewMentionName} placeholder="Readable label" />
                        </div>
                        <div>
                            <NbLabel>Discord ID</NbLabel>
                            <NbInput value={newMentionId} onChange={setNewMentionId} placeholder="123456789012345678" />
                            {!mentionIdIsValid && newMentionId.trim() && (
                                <p className="text-xs text-red-600 font-bold mt-1">ID must be numeric.</p>
                            )}
                        </div>
                        <div>
                            <NbLabel>Type</NbLabel>
                            <NbSelect value={newMentionKind} onChange={(v) => setNewMentionKind(v as typeof newMentionKind)}>
                                <option value="role">Role</option>
                                <option value="user">User</option>
                                <option value="channel">Channel</option>
                                <option value="mentionable">Mentionable</option>
                            </NbSelect>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Aliases replace tokens in Text Display when sending.</span>
                        <NbButton variant="primary" disabled={!mentionIdIsValid} onClick={addMention}>Add Alias</NbButton>
                    </div>
                </NbSection>

                <NbSection title="Saved aliases">
                    {mentions.length === 0
                        ? <NbEmpty title="No mention aliases yet." sub="Add your first alias above" />
                        : mentions.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-2 border-2 border-black p-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    {editingMentionId === item.id ? (
                                        <div className="space-y-1">
                                            <NbInput value={editingMention.keyword} onChange={(v) => setEditingMention((p) => ({ ...p, keyword: v }))} />
                                            <NbInput value={editingMention.displayName} onChange={(v) => setEditingMention((p) => ({ ...p, displayName: v }))} placeholder="Display name" />
                                            <NbInput value={editingMention.targetId} onChange={(v) => setEditingMention((p) => ({ ...p, targetId: v }))} placeholder="Discord ID" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-bold text-sm flex items-center gap-1">
                                                {item.keyword}
                                                <span className="text-xs border border-black px-1">{item.kind}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{item.displayName ? `${item.displayName} · ` : ''}{item.targetId}</div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {editingMentionId === item.id ? (
                                        <>
                                            <NbButton variant="ghost" onClick={() => saveEditMention(item.id)}>Save</NbButton>
                                            <NbButton variant="ghost" onClick={() => setEditingMentionId(null)}>Cancel</NbButton>
                                        </>
                                    ) : (
                                        <>
                                            <NbButton variant="ghost" onClick={() => { setEditingMentionId(item.id); setEditingMention({ keyword: item.keyword, targetId: item.targetId, displayName: item.displayName || '' }); }}>Edit</NbButton>
                                            <NbButton variant="danger" onClick={() => removeMention(item.id)}>✕</NbButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </NbSection>
            </NbModal>
        </div>
    );
}

export default App;
