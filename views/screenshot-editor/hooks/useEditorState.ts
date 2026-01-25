import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CACHE_KEY, DEFAULT_COLOR, defaultSettings, defaultTextSettings } from '../constants';
import type { CacheItem, ChatLine, EditorSettings, OverlayImage, TextBlock, TextBlockSettings } from '../types';
import { buildLinesFromBlocks, getCombinedText, readCache, writeCache } from '../utils';
import { useHistory } from './useHistory';

export type EditorSnapshot = {
    textBlocks: TextBlock[];
    overlays: OverlayImage[];
    settings: EditorSettings;
    layerOrder: string[];
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
    // We keep these for reactive UI, but we must ensure they are ALWAYS in sync with historyState
    const [textBlocks, setTextBlocks] = useState<TextBlock[]>(initialSnapshot.textBlocks);
    const [overlays, setOverlays] = useState<OverlayImage[]>(initialSnapshot.overlays);
    const [settings, setSettings] = useState<EditorSettings>(initialSnapshot.settings);
    const [layerOrder, setLayerOrder] = useState<string[]>(initialSnapshot.layerOrder);

    const [lines, setLines] = useState<ChatLine[]>([]);
    const [filterText, setFilterText] = useState<string>('');

    // Sync local state from history (Undo/Redo or Pushes)
    useEffect(() => {
        setTextBlocks(historyState.textBlocks);
        setOverlays(historyState.overlays);
        setSettings(historyState.settings);
        setLayerOrder(historyState.layerOrder);
    }, [historyState]);

    /**
     * Commits the current local state to history.
     * This should be used for CONTINUOUS updates (like dragging) AFTER they finish.
     */
    const commitHistory = useCallback(() => {
        // We use functional style or just hope closure is fresh enough.
        // During a drag, closures might be stale if we don't re-render.
        // But drag updates trigger re-renders, so closure should be fresh on MouseUp.
        pushHistory({
            textBlocks,
            overlays,
            settings,
            layerOrder,
        });
    }, [textBlocks, overlays, settings, layerOrder, pushHistory]);

    /**
     * Atomically updates state and pushes to history.
     * Prevents race conditions with the sync useEffect.
     */
    const performAction = useCallback((update: (prev: EditorSnapshot) => EditorSnapshot) => {
        const next = update({
            textBlocks,
            overlays,
            settings,
            layerOrder
        });
        // Update local state immediately for UI snappiness
        setTextBlocks(next.textBlocks);
        setOverlays(next.overlays);
        setSettings(next.settings);
        setLayerOrder(next.layerOrder);
        // Push to history
        pushHistory(next);
    }, [textBlocks, overlays, settings, layerOrder, pushHistory]);

    const [zoom, setZoom] = useState<number>(1);
    const [autoFit, setAutoFit] = useState<boolean>(true);
    const [colorPicker, setColorPicker] = useState<string>('#ffffff');
    const [colorAlpha, setColorAlpha] = useState<number>(1);
    const [selectedTemplateColor, setSelectedTemplateColor] = useState<string | null>(null);
    const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
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
        setCacheItems(readCache(CACHE_KEY));
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

    const addToCache = () => {
        if (!imageDataUrl) return;
        const item: CacheItem = {
            id: `${Date.now()}`,
            name: imageName,
            createdAt: Date.now(),
            imageDataUrl,
            textBlocks,
            overlays,
            chatInput: getCombinedText(textBlocks),
            lines,
            settings,
            layerOrder,
        };
        const next = [item, ...cacheItems].slice(0, 5);
        setCacheItems(next);
        writeCache(CACHE_KEY, next);
    };

    const loadCache = (item: CacheItem) => {
        setImageDataUrl(item.imageDataUrl);
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

        const nextSettings = { ...defaultSettings, ...item.settings };

        const nextOrder = (item.layerOrder && item.layerOrder.length > 0)
            ? item.layerOrder
            : [...nextOverlays.map(o => o.id), ...nextBlocks.map(b => b.id)];

        const snapshot: EditorSnapshot = {
            textBlocks: nextBlocks,
            overlays: nextOverlays,
            settings: nextSettings,
            layerOrder: nextOrder
        };

        resetHistory(snapshot);
        // Explicitly sync local state to avoid waiting for useEffect
        setTextBlocks(snapshot.textBlocks);
        setOverlays(snapshot.overlays);
        setSettings(snapshot.settings);
        setLayerOrder(snapshot.layerOrder);
        setLines(item.lines);
        setAutoFit(true);
    };

    const removeCache = (id: string) => {
        const next = cacheItems.filter((item) => item.id !== id);
        setCacheItems(next);
        writeCache(CACHE_KEY, next);
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
        setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...update } : o));
    };

    const updateTextBlock = (id: string, update: Partial<TextBlock>) => {
        setTextBlocks(prev => prev.map(b => b.id === id ? { ...b, ...update } : b));
    };

    const updateTextBlockSettings = (id: string, settingsUpdate: Partial<TextBlock['settings']>) => {
        setTextBlocks(prev => prev.map(b => b.id === id ? {
            ...b,
            settings: { ...defaultTextSettings, ...(b.settings ?? {}), ...settingsUpdate }
        } : b));
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
        }));
    };

    const addNameInput = () => setNameInputs(prev => [...prev, { id: `${Date.now()}`, name: '' }]);
    const removeNameInput = (id: string) => setNameInputs(prev => prev.filter(n => n.id !== id));
    const updateNameInput = (id: string, name: string) => setNameInputs(prev => prev.map(n => n.id === id ? { ...n, name } : n));

    return {
        state: {
            imageDataUrl, setImageDataUrl,
            imageName, setImageName,
            imageSize, setImageSize,
            rawTextFile, setRawTextFile,
            overlays, setOverlays,
            textBlocks, setTextBlocks,
            layerOrder, setLayerOrder,
            lines, setLines,
            filterText, setFilterText,
            settings, setSettings,
            zoom, setZoom,
            autoFit, setAutoFit,
            colorPicker, setColorPicker,
            colorAlpha, setColorAlpha,
            selectedTemplateColor, setSelectedTemplateColor,
            cacheItems, setCacheItems,
            isDragging, setIsDragging,
            activeBlockId, setActiveBlockId,
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
            canUndo, canRedo
        },
        computed: { visibleLines },
        actions: {
            addToCache, loadCache, removeCache,
            addOverlay, removeOverlay, updateOverlay,
            addTextBlock, removeTextBlock, updateTextBlock, updateTextBlockSettings,
            reorderLayers, toggleLayerVisibility, toggleLayerLock,
            addNameInput, removeNameInput, updateNameInput,
            undo, redo, commitHistory, togglePanel, clearAll
        }
    };
};
