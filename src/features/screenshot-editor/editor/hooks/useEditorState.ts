import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CACHE_KEY, DEFAULT_COLOR, defaultSettings, defaultTextSettings, defaultFilterSettings } from '../constants';
import type { CacheItem, ChatLine, EditorSettings, OverlayImage, RedactionArea, TextBlock, TextBlockSettings } from '../types';
import { buildLinesFromBlocks, getCombinedText } from '../utils';
import { useHistory } from './useHistory';

export type EditorSnapshot = {
    textBlocks: TextBlock[];
    overlays: OverlayImage[];
    settings: EditorSettings;
    layerOrder: string[];
    redactionAreas: RedactionArea[];
};

export const useEditorState = () => {
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [imageName, setImageName] = useState<string>('Untitled');
    const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [rawTextFile, setRawTextFile] = useState<string>('');

    // History-managed state
    const initialBlockId = useMemo(() => `${Date.now()}`, []);
    const initialSnapshot: EditorSnapshot = {
        textBlocks: [
            {
                id: initialBlockId,
                text: '',
                settings: { ...defaultTextSettings },
                collapsed: false,
                settingsOpen: false,
                advancedOpen: false,
                visible: true,
                locked: false,
                name: 'Text Block 1',
            },
        ],
        overlays: [],
        settings: defaultSettings,
        layerOrder: [initialBlockId],
        redactionAreas: [],
    };

    const {
        state: historyState,
        canUndo,
        canRedo,
        undo,
        redo,
        push: pushHistory,
        reset: resetHistory,
    } = useHistory<EditorSnapshot>(initialSnapshot);

    // Snapshot state (synced with history)
    // We derive these directly from historyState to ensure a single source of truth and avoid race conditions.
    const {
        textBlocks,
        overlays,
        settings,
        layerOrder,
        redactionAreas
    } = historyState;

    const [redactIntensity, setRedactIntensity] = useState(10);
    const [activeTool, setActiveTool] = useState<'move' | 'redact'>('move');
    const [lines, setLines] = useState<ChatLine[]>([]);
    const [filterText, setFilterText] = useState<string>('');

    /**
     * Commits the current local state to history.
     * This is useful if we were doing temporary updates (like dragging) 
     * but now want to persist that state into the past.
     */
    const commitHistory = useCallback(() => {
        // Since we are now using historyState directly, we just push the CURRENT state.
        // This effectively creates a point in time. 
        // NOTE: Usually in drag scenarios, we update a "temporary" state and THEN push.
        // But since we are pushing to historyState on every change (via performAction below),
        // we might not even need a separate commitHistory unless we have non-history state we want to include.
        pushHistory({
            textBlocks,
            overlays,
            settings,
            layerOrder,
            redactionAreas,
        });
    }, [textBlocks, overlays, settings, layerOrder, redactionAreas, pushHistory]);

    /**
     * Atomically updates state and pushes to history.
     */
    const performAction = useCallback((update: (prev: EditorSnapshot) => EditorSnapshot) => {
        const next = update({
            textBlocks,
            overlays,
            settings,
            layerOrder,
            redactionAreas,
        });

        // Push directly to history - React will re-render and our derived constants will reflect the new state.
        pushHistory(next);
    }, [textBlocks, overlays, settings, layerOrder, redactionAreas, pushHistory]);

    const [zoom, setZoom] = useState<number>(1);
    const [autoFit, setAutoFit] = useState<boolean>(true);
    const [colorPicker, setColorPicker] = useState<string>('#ffffff');
    const [colorAlpha, setColorAlpha] = useState<number>(1);
    const [selectedTemplateColor, setSelectedTemplateColor] = useState<string | null>(null);
    const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [lastSelection, setLastSelection] = useState<{ start: number; end: number } | null>(null);
    const [spaceDown, setSpaceDown] = useState<boolean>(false);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [isPreviewHover, setIsPreviewHover] = useState<boolean>(false);
    const [nameInputs, setNameInputs] = useState<{ id: string; name: string }[]>([
        { id: 'default', name: '' }
    ]);
    const [activeCropOverlayId, setActiveCropOverlayId] = useState<string | null>(null);

    // Modular Workspace State
    const [visiblePanels, setVisiblePanels] = useState<Record<string, boolean>>({
        source: true,
        textEditor: true,
        layers: true,
        canvas: true,
        colors: true,
        content: true,
        history: true,
        filters: true,
        stripBuilder: false,
    });

    const togglePanel = useCallback((panelId: string) => {
        setVisiblePanels(prev => ({ ...prev, [panelId]: !prev[panelId] }));
    }, []);

    const panStateRef = useRef<{
        startX: number;
        startY: number;
        startScrollLeft: number;
        startScrollTop: number;
    } | null>(null);

    const [dragState, setDragState] = useState<{
        startX: number;
        startY: number;
        baseX: number;
        baseY: number;
        blockId: string;
    } | null>(null);

    const [overlayDragState, setOverlayDragState] = useState<{
        startX: number;
        startY: number;
        baseX: number;
        baseY: number;
        overlayId: string;
    } | null>(null);

    const [imageDragState, setImageDragState] = useState<{
        startX: number;
        startY: number;
        baseX: number;
        baseY: number;
    } | null>(null);

    useEffect(() => {
        const fetchCache = async () => {
            try {
                const res = await fetch('/api/screenshot-editor/load-points', { credentials: 'omit' }); // Actually needs credentials include to work with cookies
            } catch (err) { }
        };
        const fetchCacheActual = async () => {
            try {
                const res = await fetch('/api/screenshot-editor/load-points', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();

                    // Map API responses back to CacheItem shape
                    const mapped = data.rows.map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        createdAt: new Date(r.created_at).getTime(),
                        imageDataUrl: r.image_data_url,
                        textBlocks: r.state_data.textBlocks || [],
                        overlays: r.state_data.overlays || [],
                        chatInput: r.state_data.chatInput || '',
                        lines: r.state_data.lines || [],
                        settings: r.state_data.settings || defaultSettings,
                        layerOrder: r.state_data.layerOrder || [],
                        redactionAreas: r.state_data.redactionAreas || [],
                        bakedImage: r.state_data.bakedImage || r.image_data_url,
                    }));
                    setCacheItems(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch load points", err);
            }
        };
        fetchCacheActual();
    }, []);

    useEffect(() => {
        setLines(buildLinesFromBlocks(textBlocks));
    }, [textBlocks]);

    const visibleLines = useMemo(() => {
        const normalizedFilter = filterText.trim().toLowerCase();
        return lines.filter((line) => {
            if (!line.enabled) return false;
            if (!normalizedFilter) return true;
            return line.text.toLowerCase().includes(normalizedFilter);
        });
    }, [filterText, lines]);

    const addToCache = async (renderedDataUrl?: string) => {
        if (!imageDataUrl) return;
        const stateData = {
            textBlocks,
            overlays,
            chatInput: getCombinedText(textBlocks),
            lines,
            settings,
            layerOrder,
            redactionAreas,
            bakedImage: renderedDataUrl || imageDataUrl, // Pass to backend via stateData
        };

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const item: CacheItem = {
            id: tempId,
            name: imageName,
            createdAt: Date.now(),
            imageDataUrl: imageDataUrl, // Always keep the clean background
            bakedImage: renderedDataUrl || imageDataUrl, // The preview for the UI
            ...stateData
        };

        setCacheItems(prev => [item, ...prev]);

        try {
            const res = await fetch('/api/screenshot-editor/load-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: imageName,
                    imageDataUrl: imageDataUrl, // Send only the clean background to DB
                    stateData
                })
            });
            if (res.ok) {
                const data = await res.json();
                setCacheItems(prev => prev.map(p => p.id === tempId ? { ...item, id: data.id } : p));
            } else {
                // Revert if failed
                setCacheItems(prev => prev.filter(p => p.id !== tempId));

                // Show error message to user
                try {
                    const errorData = await res.json();
                    if (res.status === 403 && errorData.message) {
                        alert(errorData.message);
                    } else {
                        console.error("Failed to save load point:", errorData.error || 'Unknown error');
                    }
                } catch {
                    console.error("Failed to save load point");
                }
            }
        } catch (err) {
            console.error("Failed to save load point", err);
            setCacheItems(prev => prev.filter(p => p.id !== tempId));
        }
    };

    const loadCache = (item: CacheItem) => {
        setImageDataUrl(item.imageDataUrl); // Load the clean background, not the baked one
        setImageName(item.name);

        const nextBlocks = item.textBlocks && item.textBlocks.length > 0
            ? item.textBlocks.map((block) => ({
                ...block,
                settings: { ...defaultTextSettings, ...(block.settings ?? {}) },
                collapsed: block.collapsed ?? false,
                settingsOpen: block.settingsOpen ?? false,
                advancedOpen: block.advancedOpen ?? false,
                visible: block.visible ?? true,
                locked: block.locked ?? false,
                name: block.name || `Text Block`,
            }))
            : [{
                id: `${Date.now()}`,
                text: item.chatInput ?? '',
                settings: { ...defaultTextSettings },
                collapsed: false,
                settingsOpen: false,
                advancedOpen: false,
                visible: true,
                locked: false,
                name: 'Text Block 1',
            }];

        const nextOverlays = (item.overlays ?? []).map(o => ({
            ...o,
            visible: o.visible ?? true,
            locked: o.locked ?? false
        }));

        const nextSettings: EditorSettings = {
            ...defaultSettings,
            ...item.settings,
            filters: {
                ...defaultFilterSettings,
                ...(item.settings?.filters || {})
            }
        };

        const nextOrder = (item.layerOrder && item.layerOrder.length > 0)
            ? item.layerOrder
            : [...nextOverlays.map(o => o.id), ...nextBlocks.map(b => b.id)];

        const snapshot: EditorSnapshot = {
            textBlocks: nextBlocks,
            overlays: nextOverlays,
            settings: nextSettings,
            layerOrder: nextOrder,
            redactionAreas: item.redactionAreas ?? []
        };

        resetHistory(snapshot);
        setLines(item.lines);
        setAutoFit(true);
    };

    const removeCache = async (id: string) => {
        setCacheItems(prev => prev.filter((item) => item.id !== id));
        if (id.startsWith('temp-')) return; // Not yet persisted
        try {
            await fetch(`/api/screenshot-editor/load-points/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (err) {
            console.error("Failed to delete load point", err);
        }
    };

    const renameCacheItem = async (id: string, name: string) => {
        setCacheItems(prev => prev.map(item => item.id === id ? { ...item, name } : item));
        if (id.startsWith('temp-')) return; // Not yet persisted
        try {
            await fetch(`/api/screenshot-editor/load-points/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name })
            });
        } catch (err) {
            console.error("Failed to rename load point", err);
        }
    };

    // Atomic Actions
    const addOverlay = (newOverlay: OverlayImage) => {
        performAction(prev => ({
            ...prev,
            overlays: [...prev.overlays, newOverlay],
            layerOrder: [...prev.layerOrder, newOverlay.id]
        }));
    };

    const removeOverlay = (id: string) => {
        performAction(prev => ({
            ...prev,
            overlays: prev.overlays.filter(o => o.id !== id),
            layerOrder: prev.layerOrder.filter(lid => lid !== id)
        }));
    };

    const addTextBlock = () => {
        performAction(prev => {
            const id = `${Date.now()}-${prev.textBlocks.length}`;
            const newBlock: TextBlock = {
                id,
                text: '',
                settings: { ...defaultTextSettings },
                collapsed: false,
                settingsOpen: false,
                advancedOpen: false,
                visible: true,
                locked: false,
                name: `Text Block ${prev.textBlocks.length + 1}`,
            };
            return {
                ...prev,
                textBlocks: [...prev.textBlocks, newBlock],
                layerOrder: [...prev.layerOrder, id]
            };
        });
    };

    const duplicateTextBlock = (id: string) => {
        performAction(prev => {
            const blockToCopy = prev.textBlocks.find(b => b.id === id);
            if (!blockToCopy) return prev;

            const newId = `${Date.now()}-copy`;
            const newBlock: TextBlock = {
                ...blockToCopy,
                id: newId,
                name: `${blockToCopy.name} (Copy)`,
            };

            const blockIndex = prev.layerOrder.indexOf(id);
            const nextOrder = [...prev.layerOrder];
            if (blockIndex !== -1) {
                nextOrder.splice(blockIndex + 1, 0, newId);
            } else {
                nextOrder.push(newId);
            }

            return {
                ...prev,
                textBlocks: [...prev.textBlocks, newBlock],
                layerOrder: nextOrder
            };
        });
    };

    const applyColorToSelection = (color: string) => {
        if (!activeBlockId || !lastSelection) return;
        performAction(prev => {
            const block = prev.textBlocks.find(b => b.id === activeBlockId);
            if (!block) return prev;

            const { start, end } = lastSelection;
            const text = block.text;
            const selectedText = text.substring(start, end);

            // If no selection, we could potentially just append or do nothing. 
            // The request says "cuando subrayes", so we focus on selection.
            if (start === end) return prev;

            const newText = text.substring(0, start) + `(${color})` + selectedText + text.substring(end);

            return {
                ...prev,
                textBlocks: prev.textBlocks.map(b => b.id === activeBlockId ? { ...b, text: newText } : b)
            };
        });
    };

    const clearColorsInBlock = (id: string) => {
        performAction(prev => ({
            ...prev,
            textBlocks: prev.textBlocks.map(b =>
                b.id === id
                    ? { ...b, text: b.text.replace(/\(#[0-9a-fA-F]{6}\)/g, '') }
                    : b
            )
        }));
    };

    const removeTextBlock = (id: string) => {
        performAction(prev => ({
            ...prev,
            textBlocks: prev.textBlocks.filter(b => b.id !== id),
            layerOrder: prev.layerOrder.filter(lid => lid !== id)
        }));
    };

    const reorderLayers = (startIndex: number, endIndex: number) => {
        performAction(prev => {
            const nextOrder = Array.from(prev.layerOrder);
            const [removed] = nextOrder.splice(startIndex, 1);
            nextOrder.splice(endIndex, 0, removed);
            return { ...prev, layerOrder: nextOrder };
        });
    };

    const toggleLayerVisibility = (id: string, type: 'text' | 'overlay') => {
        performAction(prev => {
            if (type === 'text') {
                return { ...prev, textBlocks: prev.textBlocks.map(b => b.id === id ? { ...b, visible: !(b.visible ?? true) } : b) };
            } else {
                return { ...prev, overlays: prev.overlays.map(o => o.id === id ? { ...o, visible: !(o.visible ?? true) } : o) };
            }
        });
    };

    const toggleLayerLock = (id: string, type: 'text' | 'overlay') => {
        performAction(prev => {
            if (type === 'text') {
                return { ...prev, textBlocks: prev.textBlocks.map(b => b.id === id ? { ...b, locked: !(b.locked ?? false) } : b) };
            } else {
                return { ...prev, overlays: prev.overlays.map(o => o.id === id ? { ...o, locked: !(o.locked ?? false) } : o) };
            }
        });
    };

    const updateOverlay = (id: string, update: Partial<OverlayImage>) => {
        performAction(prev => ({
            ...prev,
            overlays: prev.overlays.map(o => o.id === id ? { ...o, ...update } : o)
        }));
    };

    const updateTextBlock = (id: string, update: Partial<TextBlock>) => {
        performAction(prev => ({
            ...prev,
            textBlocks: prev.textBlocks.map(b => b.id === id ? { ...b, ...update } : b)
        }));
    };

    const updateTextBlockSettings = (id: string, settingsUpdate: Partial<TextBlock['settings']>) => {
        performAction(prev => ({
            ...prev,
            textBlocks: prev.textBlocks.map(b => b.id === id ? {
                ...b,
                settings: { ...defaultTextSettings, ...(b.settings ?? {}), ...settingsUpdate }
            } : b)
        }));
    };

    const clearAll = () => {
        const id = `${Date.now()}`;
        performAction(() => ({
            textBlocks: [
                {
                    id,
                    text: '',
                    settings: { ...defaultTextSettings },
                    collapsed: false,
                    settingsOpen: false,
                    advancedOpen: false,
                    visible: true,
                    locked: false,
                    name: 'Text Block 1',
                },
            ],
            overlays: [],
            settings: defaultSettings,
            layerOrder: [id],
            redactionAreas: [],
        }));
    };

    const addRedactionArea = (area: Omit<RedactionArea, 'id' | 'intensity'>) => {
        const newArea: RedactionArea = { ...area, id: `redact-${Date.now()}`, intensity: redactIntensity };
        performAction(prev => ({
            ...prev,
            redactionAreas: [...prev.redactionAreas, newArea]
        }));
    };

    const removeRedactionArea = (id: string) => {
        performAction(prev => ({
            ...prev,
            redactionAreas: prev.redactionAreas.filter(a => a.id !== id)
        }));
    };

    const addNameInput = () => setNameInputs(prev => [...prev, { id: `${Date.now()}`, name: '' }]);
    const removeNameInput = (id: string) => setNameInputs(prev => prev.filter(n => n.id !== id));
    const updateNameInput = (id: string, name: string) => setNameInputs(prev => prev.map(n => n.id === id ? { ...n, name } : n));

    const updateSettings = (update: Partial<EditorSettings>) => {
        performAction(prev => ({ ...prev, settings: { ...prev.settings, ...update } }));
    };

    const exportWorkspace = useCallback(() => {
        const data = {
            version: '1.0',
            imageName,
            imageDataUrl,
            textBlocks,
            overlays,
            settings,
            layerOrder,
            redactionAreas,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `street-network-workspace-${imageName.replace(/\.[^/.]+$/, '')}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [imageName, imageDataUrl, textBlocks, overlays, settings, layerOrder, redactionAreas]);

    const importWorkspace = useCallback((data: any) => {
        try {
            if (!data.textBlocks || !data.settings) {
                throw new Error('Invalid workspace file');
            }

            if (data.imageDataUrl) setImageDataUrl(data.imageDataUrl);
            if (data.imageName) setImageName(data.imageName);

            const snapshot: EditorSnapshot = {
                textBlocks: data.textBlocks,
                overlays: data.overlays || [],
                settings: data.settings,
                layerOrder: data.layerOrder || [],
                redactionAreas: data.redactionAreas || []
            };

            resetHistory(snapshot);
            setAutoFit(true);
        } catch (err) {
            console.error('Failed to import workspace:', err);
            alert('Error al importar el espacio de trabajo. El archivo podría estar corrupto.');
        }
    }, [resetHistory]);

    return {
        state: {
            imageDataUrl, setImageDataUrl,
            imageName, setImageName,
            imageSize, setImageSize,
            rawTextFile, setRawTextFile,
            overlays,
            textBlocks,
            layerOrder,
            lines, setLines,
            filterText, setFilterText,
            settings,
            zoom, setZoom,
            autoFit, setAutoFit,
            colorPicker, setColorPicker,
            colorAlpha, setColorAlpha,
            selectedTemplateColor, setSelectedTemplateColor,
            cacheItems, setCacheItems,
            isDragging, setIsDragging,
            activeBlockId, setActiveBlockId,
            lastSelection, setLastSelection,
            spaceDown, setSpaceDown,
            isPanning, setIsPanning,
            isPreviewHover, setIsPreviewHover,
            nameInputs, setNameInputs,
            activeCropOverlayId, setActiveCropOverlayId,
            visiblePanels, setVisiblePanels,
            panStateRef,
            dragState, setDragState,
            overlayDragState, setOverlayDragState,
            imageDragState, setImageDragState,
            canUndo, canRedo,
            redactionAreas,
            activeTool, setActiveTool,
            redactIntensity, setRedactIntensity
        },
        computed: { visibleLines },
        actions: {
            addToCache, loadCache, removeCache,
            addOverlay, removeOverlay, updateOverlay,
            addTextBlock, duplicateTextBlock, applyColorToSelection, clearColorsInBlock, removeTextBlock, updateTextBlock, updateTextBlockSettings,
            reorderLayers, toggleLayerVisibility, toggleLayerLock,
            addNameInput, removeNameInput, updateNameInput,
            undo, redo, commitHistory, togglePanel, clearAll,
            addRedactionArea, removeRedactionArea, setActiveTool,
            updateSettings, renameCacheItem,
            exportWorkspace, importWorkspace
        }
    };
};
