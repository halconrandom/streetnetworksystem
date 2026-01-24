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
    const [textBlocks, setTextBlocks] = useState<TextBlock[]>(initialSnapshot.textBlocks);
    const [overlays, setOverlays] = useState<OverlayImage[]>(initialSnapshot.overlays);
    const [settings, setSettings] = useState<EditorSettings>(initialSnapshot.settings);
    const [layerOrder, setLayerOrder] = useState<string[]>(initialSnapshot.layerOrder);

    const [lines, setLines] = useState<ChatLine[]>([]);
    const [filterText, setFilterText] = useState<string>('');

    // Sync from history when undo/redo occurs
    useEffect(() => {
        setTextBlocks(historyState.textBlocks);
        setOverlays(historyState.overlays);
        setSettings(historyState.settings);
        setLayerOrder(historyState.layerOrder);
    }, [historyState]);

    const commitHistory = useCallback(() => {
        pushHistory({
            textBlocks,
            overlays,
            settings,
            layerOrder,
        });
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
        if (item.textBlocks && item.textBlocks.length > 0) {
            setTextBlocks(
                item.textBlocks.map((block) => ({
                    ...block,
                    settings: { ...defaultTextSettings, ...(block.settings ?? {}) },
                    collapsed: false,
                    settingsOpen: block.settingsOpen ?? false,
                    advancedOpen: block.advancedOpen ?? false,
                    visible: block.visible ?? true,
                    locked: block.locked ?? false,
                    name: block.name || `Text Block`,
                }))
            );
        } else {
            const fallback = item.chatInput ?? '';
            const newId = `${Date.now()}`;
            setTextBlocks([
                {
                    id: newId,
                    text: fallback,
                    settings: { ...defaultTextSettings },
                    collapsed: false,
                    settingsOpen: false,
                    advancedOpen: false,
                    visible: true,
                    locked: false,
                    name: 'Text Block 1',
                },
            ]);
            // If we are falling back, we might need to reset layerOrder, but likely item.layerOrder exists
        }
        setLines(item.lines);
        setSettings({ ...defaultSettings, ...item.settings });
        const loadedOverlays = item.overlays ?? [];
        setOverlays(loadedOverlays.map(o => ({ ...o, visible: o.visible ?? true, locked: o.locked ?? false })));

        // Restore layerOrder or rebuild it
        if (item.layerOrder && item.layerOrder.length > 0) {
            setLayerOrder(item.layerOrder);
        } else {
            // Rebuild simplistic order: Text on top, Overlays below
            const blockIds = (item.textBlocks || []).map(b => b.id);
            if (blockIds.length === 0 && item.chatInput) {
                // We created a fallback block with newId, but we didn't capture it easily above. 
                // Actually the `setTextBlocks` above uses state setter, we don't have the value immediately.
                // This is a bit tricky. For now, valid cache should have layerOrder. 
                // If invalid, the next render cycle might be slightly off or we just rely on future updates.
                // Let's iterate the *source* item blocks
            }
            const overlayIds = (item.overlays || []).map(o => o.id);
            setLayerOrder([...overlayIds, ...((item.textBlocks || []).map(b => b.id))]);
        }

        setAutoFit(true);
    };

    const removeCache = (id: string) => {
        const next = cacheItems.filter((item) => item.id !== id);
        setCacheItems(next);
        writeCache(CACHE_KEY, next);
    };

    // Actions
    const addOverlay = (newOverlay: OverlayImage) => {
        setOverlays(prev => [...prev, newOverlay]);
        setLayerOrder(prev => [...prev, newOverlay.id]); // Add to top
    };

    const removeOverlay = (id: string) => {
        setOverlays(prev => prev.filter(o => o.id !== id));
        setLayerOrder(prev => prev.filter(lid => lid !== id));
    };

    const addTextBlock = () => {
        const id = `${Date.now()}-${textBlocks.length}`;
        const newBlock: TextBlock = {
            id,
            text: '',
            settings: { ...defaultTextSettings },
            collapsed: false,
            settingsOpen: false,
            advancedOpen: false,
            visible: true,
            locked: false,
            name: `Text Block ${textBlocks.length + 1}`,
        };
        setTextBlocks(prev => [...prev, newBlock]);
        setLayerOrder(prev => [...prev, id]);
    };

    const removeTextBlock = (id: string) => {
        setTextBlocks(prev => prev.filter(b => b.id !== id));
        setLayerOrder(prev => prev.filter(lid => lid !== id));
    };

    const reorderLayers = (startIndex: number, endIndex: number) => {
        setLayerOrder(prev => {
            const result = Array.from(prev);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return result;
        });
    };

    const toggleLayerVisibility = (id: string, type: 'text' | 'overlay') => {
        if (type === 'text') {
            setTextBlocks(prev => prev.map(b => b.id === id ? { ...b, visible: !(b.visible ?? true) } : b));
        } else {
            setOverlays(prev => prev.map(o => o.id === id ? { ...o, visible: !(o.visible ?? true) } : o));
        }
    };

    const toggleLayerLock = (id: string, type: 'text' | 'overlay') => {
        if (type === 'text') {
            setTextBlocks(prev => prev.map(b => b.id === id ? { ...b, locked: !(b.locked ?? false) } : b));
        } else {
            setOverlays(prev => prev.map(o => o.id === id ? { ...o, locked: !(o.locked ?? false) } : o));
        }
    };

    const updateOverlay = (id: string, update: Partial<OverlayImage>) => {
        setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...update } : o));
    };

    const updateTextBlock = (id: string, update: Partial<TextBlock>) => {
        setTextBlocks(prev => prev.map(b => b.id === id ? { ...b, ...update } : b));
    };

    // Helper for updating settings specifically, though updateTextBlock could handle it if we passed the whole settings object
    const updateTextBlockSettings = (id: string, settingsUpdate: Partial<TextBlock['settings']>) => {
        setTextBlocks(prev => prev.map(b => b.id === id ? {
            ...b,
            settings: { ...defaultTextSettings, ...(b.settings ?? {}), ...settingsUpdate }
        } : b));
    };

    const addNameInput = () => {
        setNameInputs(prev => [...prev, { id: `${Date.now()}`, name: '' }]);
    };

    const removeNameInput = (id: string) => {
        setNameInputs(prev => prev.filter(n => n.id !== id));
    };

    const updateNameInput = (id: string, name: string) => {
        setNameInputs(prev => prev.map(n => n.id === id ? { ...n, name } : n));
    };

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
            panStateRef,
            dragState, setDragState,
            overlayDragState, setOverlayDragState,
            imageDragState, setImageDragState,
            canUndo, canRedo
        },
        computed: {
            visibleLines
        },
        actions: {
            addToCache,
            loadCache,
            removeCache,
            addOverlay,
            removeOverlay,
            updateOverlay,
            addTextBlock,
            removeTextBlock,
            updateTextBlock,
            updateTextBlockSettings,
            reorderLayers,
            toggleLayerVisibility,
            toggleLayerLock,
            addNameInput,
            removeNameInput,
            updateNameInput,
            undo,
            redo,
            commitHistory
        }
    };
};
