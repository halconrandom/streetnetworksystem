import { Capsule, Component, ComponentType, ContainerComponent, PassProps, SectionComponent, TextDisplayComponent } from 'components-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions, DisplaySliceManager, RootState } from './state';
import { BetterInput } from './BetterInput';
import { EmojiPicker } from './EmojiPicker';
import { EmojiShow } from './EmojiShow';
import Styles from './App.module.css';
import { webhookImplementation } from './webhook.impl';
import { ErrorBoundary } from 'react-error-boundary';
import { ColorPicker } from './ColorPicker';
import { useRouter } from './useRouter';
import { Trans, useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { supportedLngs } from '../libs.config';

function getThreadId(webhookUrl: string) {
    try {
        const parsed_url = new URL(webhookUrl);
        const parsed_query = new URLSearchParams(parsed_url.search);
        const thread_id = parsed_query.get('thread_id');
        return thread_id || null;
    } catch (e) {
        return null;
    }
}

function App() {
    const dispatch = useDispatch();
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);
    const state = useSelector((state: RootState) => state.display.data)
    const webhookUrl = useSelector((state: RootState) => state.display.webhookUrl);
    const response = useSelector((state: RootState) => state.display.webhookResponse);
    const showThread = useSelector((state: RootState) => state.display.showThread);
    const isDefault = useSelector((state: RootState) => state.display.isDefault);
    const [page] = useRouter();
    const [postTitle, setPostTitle] = useState<string>("");
    const [showJson, setShowJson] = useState(false);
    const [targets, setTargets] = useState<Array<{
        id: string;
        name: string;
        value: string;
        kind: 'webhook' | 'channel';
        isThreadEnabled?: boolean;
        threadId?: string;
    }>>([]);
    const [newTargetName, setNewTargetName] = useState('');
    const [newTargetValue, setNewTargetValue] = useState('');
    const [newTargetKind, setNewTargetKind] = useState<'webhook' | 'channel'>('webhook');
    const [newTargetThreadEnabled, setNewTargetThreadEnabled] = useState(false);
    const [newTargetThreadId, setNewTargetThreadId] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Array<{ id: string; name: string; data: typeof state }>>([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [mentions, setMentions] = useState<Array<{
        id: string;
        keyword: string;
        kind: 'role' | 'user' | 'channel' | 'mentionable';
        targetId: string;
        displayName?: string;
    }>>([]);
    const [newMentionKeyword, setNewMentionKeyword] = useState('');
    const [newMentionKind, setNewMentionKind] = useState<'role' | 'user' | 'channel' | 'mentionable'>('role');
    const [newMentionId, setNewMentionId] = useState('');
    const [newMentionName, setNewMentionName] = useState('');
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            webhookImplementation.init();
        }
    }, []);
    const apiBase = useMemo(() => {
        const envBase = process.env.NEXT_PUBLIC_MESSAGE_BUILDER_API;
        if (typeof envBase === 'string' && envBase.trim()) return envBase.replace(/\/$/, '');
        if (typeof window !== 'undefined') {
            const windowBase = (window as any)?.__VITE_MESSAGE_BUILDER_API__;
            if (typeof windowBase === 'string' && windowBase.trim()) return windowBase.replace(/\/$/, '');
        }
        return '';
    }, []);
    const apiKey = useMemo(() => {
        const envKey = process.env.NEXT_PUBLIC_MESSAGE_BUILDER_API_KEY;
        if (typeof envKey === 'string' && envKey.trim().length > 0) return envKey;
        if (typeof window !== 'undefined') {
            const windowKey = (window as any)?.__VITE_MESSAGE_BUILDER_API_KEY__;
            if (typeof windowKey === 'string' && windowKey.trim().length > 0) return windowKey;
        }
        return '';
    }, []);
    useEffect(() => {
        console.log('[MessageBuilder] API base:', apiBase || '(empty)');
        console.log('[MessageBuilder] API key set:', Boolean(apiKey));
    }, [apiBase, apiKey]);
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
            const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${encoded}`;
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                window.alert('Share link copied to clipboard.');
            } else {
                window.alert('Share link ready in the address bar.');
            }
        } catch (error) {
            console.error('Failed to build share link', error);
            window.alert('Failed to generate share link.');
        }
    };
    const proxyKey = useMemo(() => {
        const envKey = process.env.NEXT_PUBLIC_BACKEND_PROXY_KEY;
        if (typeof envKey === 'string' && envKey.trim().length > 0) return envKey;
        if (typeof window !== 'undefined') {
            const windowKey = (window as any)?.__VITE_BACKEND_PROXY_KEY__;
            if (typeof windowKey === 'string' && windowKey.trim().length > 0) return windowKey;
        }
        return '';
    }, []);

    const setFile = useCallback(webhookImplementation.setFile, []);
    const getFile = useCallback(webhookImplementation.getFile, [])
    const getFileName = useCallback(webhookImplementation.getFileName, [])
    const passProps = useMemo((): PassProps => ({
        getFile,
        getFileName,
        setFile,
        BetterInput,
        EmojiPicker,
        ColorPicker,
        // ActionMenu,
        EmojiShow,
        interactiveDisabled: false,
    }), []);

    useEffect(() => {
        const getData = setTimeout(() => localStorage.setItem("discord.builders__webhookToken", webhookUrl), 1000)
        return () => clearTimeout(getData)
    }, [webhookUrl]);


    const requestUrl = useMemo(() => webhookImplementation.buildRequestUrl(webhookUrl), [webhookUrl]);

    const stateKey = useMemo(() => ['data'], [])

    const errors = useMemo(() => webhookImplementation.getErrors(response), [response]);
    const lastErrorRef = useRef<string>('');
    const primaryContainerIndex = useMemo(() => state.findIndex((item) => item.type === ComponentType.CONTAINER), [state]);
    const primaryContainer = primaryContainerIndex >= 0 ? state[primaryContainerIndex] : null;
    const accentColor = (primaryContainer && 'accent_color' in primaryContainer) ? primaryContainer.accent_color ?? null : null;
    const spoilerEnabled = (primaryContainer && 'spoiler' in primaryContainer) ? !!primaryContainer.spoiler : false;
    const accentHex = useMemo(() => {
        const value = typeof accentColor === 'number' ? accentColor : 0;
        return `#${value.toString(16).padStart(6, '0')}`;
    }, [accentColor]);

    const threadId = useMemo(() => getThreadId(webhookUrl), [webhookUrl]);
    useEffect(() => {
        if (threadId) dispatch(actions.setShowThread())
    }, [threadId]);
    useEffect(() => {
        if (apiBase) return;
        try {
            const raw = localStorage.getItem('sn_builder_targets');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setTargets(parsed);
        } catch {
            // ignore invalid storage
        }
    }, []);
    useEffect(() => {
        if (apiBase) return;
        localStorage.setItem('sn_builder_targets', JSON.stringify(targets));
    }, [targets]);
    useEffect(() => {
        if (apiBase) return;
        try {
            const raw = localStorage.getItem('sn_builder_templates');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setTemplates(parsed);
        } catch {
            // ignore invalid storage
        }
    }, []);
    useEffect(() => {
        if (apiBase) return;
        localStorage.setItem('sn_builder_templates', JSON.stringify(templates));
    }, [templates]);
    useEffect(() => {
        if (apiBase) return;
        try {
            const raw = localStorage.getItem('sn_builder_mentions');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setMentions(parsed);
        } catch {
            // ignore invalid storage
        }
    }, []);
    useEffect(() => {
        if (apiBase) return;
        localStorage.setItem('sn_builder_mentions', JSON.stringify(mentions));
    }, [mentions]);
    useEffect(() => {
        if (!apiBase) return;
        const load = async () => {
            try {
                const headers = apiKey ? { 'x-api-key': apiKey } : {};
                const [webhooksRes, templatesRes, mentionsRes] = await Promise.all([
                    fetch(`${apiBase}/webhooks`, { headers }),
                    fetch(`${apiBase}/templates`, { headers }),
                    fetch(`${apiBase}/mentions`, { headers }),
                ]);

                if (webhooksRes.ok) {
                    const rows = await webhooksRes.json();
                    if (Array.isArray(rows)) {
                        setTargets(rows.map((row) => ({
                            id: row.id,
                            name: row.name,
                            value: row.value,
                            kind: row.kind,
                            isThreadEnabled: row.is_thread_enabled,
                            threadId: row.thread_id ?? undefined,
                        })));
                    }
                }

                if (templatesRes.ok) {
                    const rows = await templatesRes.json();
                    if (Array.isArray(rows)) {
                        setTemplates(rows.map((row) => ({
                            id: row.id,
                            name: row.name,
                            data: row.data,
                        })));
                    }
                }

                if (mentionsRes.ok) {
                    const rows = await mentionsRes.json();
                    if (Array.isArray(rows)) {
                        setMentions(rows.map((row) => ({
                            id: row.id,
                            keyword: row.keyword,
                            kind: row.kind,
                            targetId: row.target_id,
                            displayName: row.display_name ?? undefined,
                        })));
                    }
                }
            } catch (err) {
                console.error('Failed to load message builder data', err);
            }
        };
        load();
    }, [apiBase, apiKey]);
    useEffect(() => {
        if (!response || typeof response !== 'object') return;
        const responseAny = response as any;
        if (responseAny.status === '204 Success') return;
        const message = responseAny?.message || responseAny?.error || responseAny?.code;
        if (typeof message !== 'string' || !message.trim()) return;
        if (lastErrorRef.current === message) return;
        lastErrorRef.current = message;
        window.alert(message);
    }, [response]);
    useEffect(() => {
        if (!colorPickerOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (!colorPickerRef.current) return;
            if (colorPickerRef.current.contains(event.target as Node)) return;
            setColorPickerOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [colorPickerOpen]);

    const sendMessage = async () => {
        if (!requestUrl) return;
        if (!proxyKey) {
            dispatch(actions.setWebhookResponse({ message: 'Missing BACKEND_PROXY_KEY' }));
            return;
        }
        const preparedState = applyMentionsToState(state);
        const init = webhookImplementation.prepareRequest(preparedState);
        const headers = new Headers(init.headers || {});
        headers.set('x-api-key', proxyKey);
        const req = await fetch(requestUrl, { ...init, headers })

        const status_code = req.status;
        if (status_code === 204) return dispatch(actions.setWebhookResponse({"status": "204 Success"}));

        const error_data = await req.json();

        if (error_data?.code === 220001 && dialog.current !== null) {
            dialog.current.showModal();
            dispatch(actions.setWebhookResponse(null))
            return;
        }

        dispatch(actions.setWebhookResponse(error_data))
    }

    const sendMessageWithTitle = async () => {
        if (!postTitle) return;
        dialog.current?.close();

        if (!requestUrl) return;
        if (!proxyKey) {
            dispatch(actions.setWebhookResponse({ message: 'Missing BACKEND_PROXY_KEY' }));
            return;
        }
        const preparedState = applyMentionsToState(state);
        const init = webhookImplementation.prepareRequest(preparedState, postTitle);
        const headers = new Headers(init.headers || {});
        headers.set('x-api-key', proxyKey);
        const req = await fetch(requestUrl, { ...init, headers })

        const status_code = req.status;
        if (status_code === 204) return dispatch(actions.setWebhookResponse({"status": "204 Success"}));

        const error_data = await req.json();
        dispatch(actions.setWebhookResponse(error_data))
    }

    const dialog = useRef<HTMLDialogElement>(null);
    const targetsDialog = useRef<HTMLDialogElement>(null);
    const templatesDialog = useRef<HTMLDialogElement>(null);
    const mentionsDialog = useRef<HTMLDialogElement>(null);

    if (page === '404.not-found') {
        if (typeof window !== 'undefined' && !window.location.href.includes('/not-found')) {
            window.location.href = '/not-found';
        }
        return <div><meta name="robots" content="noindex" /><h1>404 — Page not found</h1></div>;
    }
    
    const { t } = useTranslation('website');
    const openTargetsDialog = () => targetsDialog.current?.showModal();
    const closeTargetsDialog = () => targetsDialog.current?.close();
    const openTemplatesDialog = () => templatesDialog.current?.showModal();
    const closeTemplatesDialog = () => templatesDialog.current?.close();
    const openMentionsDialog = () => mentionsDialog.current?.showModal();
    const closeMentionsDialog = () => mentionsDialog.current?.close();
    const threadIdIsValid = useMemo(() => {
        if (!newTargetThreadEnabled) return true;
        return /^\d+$/.test(newTargetThreadId.trim());
    }, [newTargetThreadEnabled, newTargetThreadId]);
    const mentionIdIsValid = useMemo(() => /^\d+$/.test(newMentionId.trim()), [newMentionId]);
    const addTarget = async () => {
        const name = newTargetName.trim();
        const value = newTargetValue.trim();
        if (!name || !value) return;
        if (!threadIdIsValid) return;
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/webhooks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(apiKey ? { 'x-api-key': apiKey } : {}),
                    },
                    body: JSON.stringify({
                        name,
                        value,
                        kind: newTargetKind,
                        is_thread_enabled: newTargetThreadEnabled,
                        thread_id: newTargetThreadEnabled ? newTargetThreadId.trim() : null,
                    }),
                });
                if (!res.ok) throw new Error('Failed to save webhook');
                const row = await res.json();
                setTargets((prev) => [
                    {
                        id: row.id,
                        name: row.name,
                        value: row.value,
                        kind: row.kind,
                        isThreadEnabled: row.is_thread_enabled,
                        threadId: row.thread_id ?? undefined,
                    },
                    ...prev,
                ]);
            } catch (err) {
                console.error(err);
                window.alert('Failed to save webhook.');
                return;
            }
        } else {
            const entry = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                value,
                kind: newTargetKind,
                isThreadEnabled: newTargetThreadEnabled,
                threadId: newTargetThreadEnabled ? newTargetThreadId.trim() : undefined,
            };
            setTargets((prev) => [entry, ...prev]);
        }
        setNewTargetName('');
        setNewTargetValue('');
        setNewTargetKind('webhook');
        setNewTargetThreadEnabled(false);
        setNewTargetThreadId('');
    };
    const useTarget = (targetId: string) => {
        const target = targets.find((item) => item.id === targetId);
        if (!target) return;
        if (target.kind === 'webhook' && target.isThreadEnabled && target.threadId) {
            try {
                const parsed = new URL(target.value);
                const query = new URLSearchParams(parsed.search);
                query.set('thread_id', target.threadId);
                parsed.search = query.toString();
                dispatch(actions.setWebhookUrl(parsed.toString()));
            } catch {
                dispatch(actions.setWebhookUrl(target.value));
            }
        } else {
            dispatch(actions.setWebhookUrl(target.value));
        }
        setSelectedTargetId(target.id);
        closeTargetsDialog();
    };
    const removeTarget = async (id: string) => {
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/webhooks/${id}`, {
                    method: 'DELETE',
                    headers: apiKey ? { 'x-api-key': apiKey } : {},
                });
                if (!res.ok) throw new Error('Failed to delete webhook');
            } catch (err) {
                console.error(err);
                window.alert('Failed to delete webhook.');
                return;
            }
        }
        setTargets((prev) => prev.filter((item) => item.id !== id));
    };
    const addTemplate = async () => {
        const name = newTemplateName.trim();
        if (!name) return;
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/templates`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(apiKey ? { 'x-api-key': apiKey } : {}),
                    },
                    body: JSON.stringify({ name, data: state }),
                });
                if (!res.ok) throw new Error('Failed to save template');
                const row = await res.json();
                setTemplates((prev) => [
                    { id: row.id, name: row.name, data: row.data },
                    ...prev,
                ]);
            } catch (err) {
                console.error(err);
                window.alert('Failed to save template.');
                return;
            }
        } else {
            const entry = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                data: state,
            };
            setTemplates((prev) => [entry, ...prev]);
        }
        setNewTemplateName('');
    };
    const applyTemplate = (templateId: string) => {
        const template = templates.find((item) => item.id === templateId);
        if (!template) return;
        dispatch(actions.setKey({ key: ['data'], value: template.data }));
        closeTemplatesDialog();
    };
    const removeTemplate = async (id: string) => {
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/templates/${id}`, {
                    method: 'DELETE',
                    headers: apiKey ? { 'x-api-key': apiKey } : {},
                });
                if (!res.ok) throw new Error('Failed to delete template');
            } catch (err) {
                console.error(err);
                window.alert('Failed to delete template.');
                return;
            }
        }
        setTemplates((prev) => prev.filter((item) => item.id !== id));
    };
    const addMention = async () => {
        const keyword = newMentionKeyword.trim();
        const targetId = newMentionId.trim();
        if (!keyword || !targetId || !mentionIdIsValid) return;
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/mentions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(apiKey ? { 'x-api-key': apiKey } : {}),
                    },
                    body: JSON.stringify({
                        keyword,
                        kind: newMentionKind,
                        target_id: targetId,
                        display_name: newMentionName.trim() || null,
                    }),
                });
                if (!res.ok) throw new Error('Failed to save mention');
                const row = await res.json();
                setMentions((prev) => [
                    {
                        id: row.id,
                        keyword: row.keyword,
                        kind: row.kind,
                        targetId: row.target_id,
                        displayName: row.display_name ?? undefined,
                    },
                    ...prev,
                ]);
            } catch (err) {
                console.error(err);
                window.alert('Failed to save mention.');
                return;
            }
        } else {
            const entry = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                keyword,
                kind: newMentionKind,
                targetId,
                displayName: newMentionName.trim() || undefined,
            };
            setMentions((prev) => [entry, ...prev]);
        }
        setNewMentionKeyword('');
        setNewMentionId('');
        setNewMentionKind('role');
        setNewMentionName('');
    };
    const removeMention = async (id: string) => {
        if (apiBase) {
            try {
                const res = await fetch(`${apiBase}/mentions/${id}`, {
                    method: 'DELETE',
                    headers: apiKey ? { 'x-api-key': apiKey } : {},
                });
                if (!res.ok) throw new Error('Failed to delete mention');
            } catch (err) {
                console.error(err);
                window.alert('Failed to delete mention.');
                return;
            }
        }
        setMentions((prev) => prev.filter((item) => item.id !== id));
    };
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const buildMentionTag = (entry: typeof mentions[number]) => {
        switch (entry.kind) {
            case 'role':
                return `<@&${entry.targetId}>`;
            case 'channel':
                return `<#${entry.targetId}>`;
            case 'user':
            case 'mentionable':
            default:
                return `<@${entry.targetId}>`;
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
            variants.add(`@${base}`);
            variants.add(`#${base}`);
            variants.add(`{${base}}`);
        }
        return Array.from(variants).filter(Boolean);
    };
    const replaceMentionsInText = (text: string) => {
        let output = text;
        for (const entry of mentions) {
            const variants = buildMentionVariants(entry.keyword);
            if (!variants.length) continue;
            const tag = buildMentionTag(entry);
            for (const variant of variants) {
                const re = new RegExp(escapeRegex(variant), 'g');
                output = output.replace(re, tag);
            }
        }
        return output;
    };
    const isTextDisplay = (value: Component): value is TextDisplayComponent =>
        value.type === ComponentType.TEXT_DISPLAY;
    const isSection = (value: Component): value is SectionComponent =>
        value.type === ComponentType.SECTION;
    const isContainer = (value: Component): value is ContainerComponent =>
        value.type === ComponentType.CONTAINER;
    const applyMentionsToState = useCallback((components: Component[]) => {
        const mapComponents = (items: Component[]): Component[] => {
            return items.map((item) => {
                if (isTextDisplay(item)) {
                    return {
                        ...item,
                        content: replaceMentionsInText(item.content),
                    };
                }
                if (isSection(item)) {
                    return {
                        ...item,
                        components: item.components.map((inner) => ({
                            ...inner,
                            content: replaceMentionsInText(inner.content),
                        })),
                    };
                }
                if (isContainer(item)) {
                    return {
                        ...item,
                        components: mapComponents(item.components),
                    };
                }
                return item;
            });
        };
        return mapComponents(components);
    }, [mentions]);
    const updateContainerAccent = (value: number | null) => {
        if (primaryContainerIndex < 0) return;
        stateManager.setKey({
            key: ['data', primaryContainerIndex, 'accent_color'],
            value,
        });
    };
    const toggleContainerSpoiler = () => {
        if (primaryContainerIndex < 0) return;
        stateManager.setKey({
            key: ['data', primaryContainerIndex, 'spoiler'],
            value: !spoilerEnabled,
        });
    };

    return <>
        <div className={Styles.app}>
            <div className={Styles.builderToolbar}>
                <div className={Styles.builderTitle}>
                    <span className={Styles.builderAccent} />
                    <div className={Styles.jsonToolbarTitle}>
                        Message Builder
                        {selectedTargetId && (
                            <span className={Styles.builderTarget}>
                                {targets.find((item) => item.id === selectedTargetId)?.name || 'Selected'}
                            </span>
                        )}
                    </div>
                </div>
                <div className={Styles.jsonToolbarActions}>
                    <button className={Styles.toolbarButton} onClick={() => setShowJson((prev) => !prev)}>
                        {showJson ? 'Hide JSON' : 'Show JSON'}
                    </button>
                    <div className={Styles.toolbarPopover} ref={colorPickerRef}>
                        <button
                            className={`${Styles.toolbarButton} ${accentColor != null ? Styles.toolbarButtonActive : ''}`}
                            disabled={primaryContainerIndex < 0}
                            onClick={() => setColorPickerOpen((prev) => !prev)}
                        >
                            Color
                        </button>
                        {colorPickerOpen && (
                            <div className={Styles.colorPopover}>
                                <ColorPicker
                                    hexColor={accentHex}
                                    onChange={(value: number | null) => updateContainerAccent(value)}
                                />
                            </div>
                        )}
                    </div>
                    <button
                        className={`${Styles.toolbarButton} ${spoilerEnabled ? Styles.toolbarButtonActive : ''}`}
                        disabled={primaryContainerIndex < 0}
                        onClick={toggleContainerSpoiler}
                    >
                        Incognito
                    </button>
                    <button className={Styles.toolbarButton} onClick={shareState}>Share</button>
                    <button className={Styles.toolbarButton} onClick={openMentionsDialog}>Mentions</button>
                    <button className={Styles.toolbarButton} onClick={openTemplatesDialog}>Saved Containers</button>
                    <button className={Styles.toolbarButton} onClick={openTargetsDialog}>Saved Webhooks</button>
                    <button className={Styles.toolbarPrimary} disabled={requestUrl == null} onClick={sendMessage}>
                        {t('webhook.send')}
                    </button>
                </div>
            </div>
            <ErrorBoundary fallback={<></>}>
                <Capsule state={state}
                     stateManager={stateManager}
                     stateKey={stateKey}
                     passProps={passProps}
                     className={Styles.preview}
                     errors={errors}
            />
            </ErrorBoundary>
        <div className={Styles.json}>
            <p style={{marginTop: '2rem', marginBottom: '2rem', color: 'grey'}}>
                Select a saved webhook to send messages. Saved Webhooks can include Channel IDs for bot mode.
            </p>

            {showThread && <div style={{marginBottom: '2rem'}}>
                <p style={{marginBottom: '0.5rem'}}>{t('thread.id')}</p>
                <input className={Styles.input} type="text" value={threadId || ""} onChange={ev => dispatch(actions.setThreadId(ev.target.value))} placeholder={t('thread.placeholder')}/>
            </div>}

            <dialog ref={dialog} className={Styles.dialog}>
                <form method="dialog"><button className={Styles.close}>x</button></form>
                <div>
                    <p className={Styles.input_name}>{t('thread.post.label')}</p>
                    <input className={Styles.input} autoFocus={true} type="text" value={postTitle} onChange={ev => setPostTitle(ev.target.value)} placeholder={t('thread.post.placeholder')}/>
                </div>
                <div className={Styles.button} onClick={sendMessageWithTitle}>{t('thread.post.button')}</div>
            </dialog>

            {showJson && (
                <>
                    <p style={{marginBottom: '0.5rem', marginTop: '8rem'}}>JSON</p>
                    <pre className={Styles.data}>{JSON.stringify(state, undefined, 4)}</pre>
                </>
            )}
        </div>
        </div>
        <dialog ref={targetsDialog} className={Styles.dialog}>
            <form method="dialog"><button className={Styles.close} onClick={closeTargetsDialog}>x</button></form>
            <div className={Styles.dialogSection}>
                <p className={Styles.input_name}>Add target</p>
                <div className={Styles.dialogRow}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="Name"
                        value={newTargetName}
                        onChange={(ev) => setNewTargetName(ev.target.value)}
                    />
                </div>
                <div className={Styles.dialogRow}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="Webhook URL or Channel ID"
                        value={newTargetValue}
                        onChange={(ev) => setNewTargetValue(ev.target.value)}
                    />
                </div>
                <div className={Styles.dialogRow}>
                    <span className={Styles.toggleLabel}>Send to Thread</span>
                    <button
                        type="button"
                        className={`${Styles.toggle} ${newTargetThreadEnabled ? Styles.toggleOn : ''}`}
                        onClick={() => setNewTargetThreadEnabled((prev) => !prev)}
                    >
                        <span className={Styles.toggleThumb} />
                    </button>
                </div>
                <div className={Styles.helperText}>Target a specific thread in the channel</div>
                <div className={`${Styles.threadInput} ${newTargetThreadEnabled ? Styles.threadInputOpen : ''}`}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="123456789012345678"
                        value={newTargetThreadId}
                        onChange={(ev) => setNewTargetThreadId(ev.target.value)}
                    />
                    {!threadIdIsValid && (
                        <div className={Styles.inlineError}>Thread ID must be numeric.</div>
                    )}
                    <div className={Styles.helperText}>
                        Right-click on thread → Copy ID (Developer Mode required)
                    </div>
                </div>
                <div className={Styles.dialogRow}>
                    <select
                        className={Styles.select}
                        value={newTargetKind}
                        onChange={(ev) => setNewTargetKind(ev.target.value === 'channel' ? 'channel' : 'webhook')}
                    >
                        <option value="webhook">Webhook URL</option>
                        <option value="channel">Channel ID (bot)</option>
                    </select>
                    <button className={Styles.button} type="button" onClick={addTarget} disabled={!threadIdIsValid}>
                        Add Target
                    </button>
                </div>
            </div>
            <div className={Styles.dialogSection}>
                <p className={Styles.input_name}>Saved webhooks</p>
                {targets.length === 0 && (
                    <div className={Styles.dialogEmpty}>
                        <div>No saved targets yet.</div>
                        <div className={Styles.dialogEmptySub}>Add your first webhook or channel above</div>
                    </div>
                )}
                {targets.map((item) => (
                    <div key={item.id} className={Styles.targetRow}>
                        <div className={Styles.targetInfo}>
                            <div className={Styles.targetName}>
                                {item.name}
                                {item.threadId && (
                                    <span className={Styles.threadBadge}>
                                        Thread: {item.threadId.slice(0, 3)}...{item.threadId.slice(-3)}
                                    </span>
                                )}
                            </div>
                            <div className={Styles.targetValue}>{item.value}</div>
                        </div>
                        <div className={Styles.targetActions}>
                            <button className={Styles.topbarButton} type="button" onClick={() => useTarget(item.id)}>Use</button>
                            <button className={Styles.dangerButton} type="button" onClick={() => removeTarget(item.id)}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </dialog>
        <dialog ref={templatesDialog} className={Styles.dialog}>
            <form method="dialog"><button className={Styles.close} onClick={closeTemplatesDialog}>x</button></form>
            <div className={Styles.dialogSection}>
                <p className={Styles.input_name}>Save container</p>
                <div className={Styles.dialogRow}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="Container name"
                        value={newTemplateName}
                        onChange={(ev) => setNewTemplateName(ev.target.value)}
                    />
                    <button className={Styles.button} type="button" onClick={addTemplate}>
                        Save
                    </button>
                </div>
            </div>
            <div className={Styles.dialogSection}>
                <p className={Styles.input_name}>Saved containers</p>
                {templates.length === 0 && (
                    <div className={Styles.dialogEmpty}>
                        <div>No saved containers yet.</div>
                        <div className={Styles.dialogEmptySub}>Save your first container above</div>
                    </div>
                )}
                {templates.map((item) => (
                    <div key={item.id} className={Styles.targetRow}>
                        <div className={Styles.targetInfo}>
                            <div className={Styles.targetName}>{item.name}</div>
                            <div className={Styles.targetValue}>Components: {item.data?.length ?? 0}</div>
                        </div>
                        <div className={Styles.targetActions}>
                            <button className={Styles.topbarButton} type="button" onClick={() => applyTemplate(item.id)}>Load</button>
                            <button className={Styles.dangerButton} type="button" onClick={() => removeTemplate(item.id)}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </dialog>
        <dialog ref={mentionsDialog} className={Styles.dialog}>
            <form method="dialog"><button className={Styles.close} onClick={closeMentionsDialog}>x</button></form>
            <div className={Styles.dialogSection}>
                <p className={Styles.input_name}>Add mention alias</p>
                <div className={Styles.dialogRow}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="@staff, #soporte, {vip}"
                        value={newMentionKeyword}
                        onChange={(ev) => setNewMentionKeyword(ev.target.value)}
                    />
                </div>
                <div className={Styles.dialogRow}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="Display name (optional)"
                        value={newMentionName}
                        onChange={(ev) => setNewMentionName(ev.target.value)}
                    />
                </div>
                <div className={Styles.dialogRow}>
                    <input
                        className={Styles.input}
                        type="text"
                        placeholder="Discord ID"
                        value={newMentionId}
                        onChange={(ev) => setNewMentionId(ev.target.value)}
                    />
                </div>
                {!mentionIdIsValid && newMentionId.trim() && (
                    <div className={Styles.inlineError}>ID must be numeric.</div>
                )}
                <div className={Styles.dialogRow}>
                    <select
                        className={Styles.select}
                        value={newMentionKind}
                        onChange={(ev) => setNewMentionKind(ev.target.value as typeof newMentionKind)}
                    >
                        <option value="role">Role</option>
                        <option value="user">User</option>
                        <option value="channel">Channel</option>
                        <option value="mentionable">Mentionable</option>
                    </select>
                    <button className={Styles.button} type="button" onClick={addMention} disabled={!mentionIdIsValid}>
                        Add Alias
                    </button>
                </div>
                <div className={Styles.helperText}>
                    Aliases replace in Text Display only when sending.
                </div>
            </div>
            <div className={Styles.dialogSection}>
                <p className={Styles.input_name}>Saved mentions</p>
                {mentions.length === 0 && (
                    <div className={Styles.dialogEmpty}>
                        <div>No mention aliases yet.</div>
                        <div className={Styles.dialogEmptySub}>Add your first alias above</div>
                    </div>
                )}
                {mentions.map((item) => (
                    <div key={item.id} className={Styles.targetRow}>
                        <div className={Styles.targetInfo}>
                            <div className={Styles.targetName}>
                                {item.keyword}
                                <span className={Styles.threadBadge}>{item.kind}</span>
                            </div>
                            <div className={Styles.targetValue}>
                                {item.displayName ? `${item.displayName} · ` : ''}{item.targetId}
                            </div>
                        </div>
                        <div className={Styles.targetActions}>
                            <button className={Styles.dangerButton} type="button" onClick={() => removeMention(item.id)}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </dialog>
    </>
}

export default App;
