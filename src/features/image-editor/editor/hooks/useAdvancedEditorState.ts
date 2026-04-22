import { useState, useCallback } from 'react';
import { useHistory } from '@features/screenshot-editor/editor/hooks/useHistory';
import type {
  AdvancedLayer, DrawItem, DrawLayerData,
  EditorSnapshot, ImageLayerData, LayerType,
  Selection, TextLayerData, ToolOptions, ToolType,
} from '../../types';
import { defaultToolOptions } from '../../types';

const generateId = () => Math.random().toString(36).slice(2, 10);

const defaultSnapshot: EditorSnapshot = {
  layers: [],
  canvasWidth: 1920,
  canvasHeight: 1080,
};

export function useAdvancedEditorState() {
  const history = useHistory<EditorSnapshot>(defaultSnapshot);

  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [zoom, setZoom] = useState(0.5);
  const [toolOptions, setToolOptions] = useState<ToolOptions>(defaultToolOptions);
  const [isDragging, setIsDragging] = useState(false);

  const { layers, canvasWidth, canvasHeight } = history.state;

  const pushSnapshot = useCallback(
    (next: Partial<EditorSnapshot>) => history.push({ ...history.state, ...next }),
    [history]
  );

  const makeLayer = useCallback(
    (type: LayerType, name: string, data: AdvancedLayer['data']): AdvancedLayer => ({
      id: generateId(),
      name,
      type,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      data,
    }),
    []
  );

  // ── Layer creation (manual) ──────────────────────────────────────────────────

  const createDrawLayer = useCallback(() => {
    const count = layers.filter(l => l.type === 'draw').length + 1;
    const layer = makeLayer('draw', `Layer ${count}`, { items: [] } as DrawLayerData);
    const next = [...layers, layer];
    pushSnapshot({ layers: next });
    setActiveLayerId(layer.id);
    return layer.id;
  }, [layers, makeLayer, pushSnapshot]);

  const createImageLayer = useCallback(
    (dataUrl: string, name: string, width: number, height: number) => {
      const data: ImageLayerData = { dataUrl, x: 0, y: 0, width, height, scale: 1, rotation: 0 };
      const layer = makeLayer('image', name, data);
      const next = [...layers, layer];
      pushSnapshot({ layers: next });
      setActiveLayerId(layer.id);
    },
    [layers, makeLayer, pushSnapshot]
  );

  const createTextLayer = useCallback(
    (data: TextLayerData) => {
      const count = layers.filter(l => l.type === 'text').length + 1;
      const layer = makeLayer('text', `Text ${count}`, data);
      const next = [...layers, layer];
      pushSnapshot({ layers: next });
      setActiveLayerId(layer.id);
    },
    [layers, makeLayer, pushSnapshot]
  );

  // ── Drawing into the active layer ───────────────────────────────────────────

  const activeDrawLayer = layers.find(l => l.id === activeLayerId && l.type === 'draw') ?? null;

  const addItemToActiveLayer = useCallback(
    (item: DrawItem) => {
      const target = layers.find(l => l.id === activeLayerId && l.type === 'draw');
      if (!target) return;
      const data = target.data as DrawLayerData;
      const updated = { ...target, data: { items: [...data.items, item] } };
      pushSnapshot({ layers: layers.map(l => l.id === target.id ? updated : l) });
    },
    [activeLayerId, layers, pushSnapshot]
  );

  // ── Layer management ─────────────────────────────────────────────────────────

  const removeLayer = useCallback(
    (id: string) => {
      pushSnapshot({ layers: layers.filter(l => l.id !== id) });
      if (activeLayerId === id) setActiveLayerId(null);
    },
    [activeLayerId, layers, pushSnapshot]
  );

  const updateLayer = useCallback(
    (id: string, update: Partial<Omit<AdvancedLayer, 'id' | 'type' | 'data'>>) => {
      pushSnapshot({ layers: layers.map(l => l.id === id ? { ...l, ...update } : l) });
    },
    [layers, pushSnapshot]
  );

  const updateLayerData = useCallback(
    (id: string, dataUpdate: Partial<AdvancedLayer['data']>) => {
      pushSnapshot({
        layers: layers.map(l =>
          l.id === id
            ? { ...l, data: { ...l.data, ...dataUpdate } as AdvancedLayer['data'] }
            : l
        ),
      });
    },
    [layers, pushSnapshot]
  );

  const moveLayerUp = useCallback(
    (id: string) => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx >= layers.length - 1) return;
      const next = [...layers];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      pushSnapshot({ layers: next });
    },
    [layers, pushSnapshot]
  );

  const moveLayerDown = useCallback(
    (id: string) => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx <= 0) return;
      const next = [...layers];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      pushSnapshot({ layers: next });
    },
    [layers, pushSnapshot]
  );

  const toggleVisible = useCallback(
    (id: string) =>
      pushSnapshot({ layers: layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l) }),
    [layers, pushSnapshot]
  );

  const toggleLocked = useCallback(
    (id: string) =>
      pushSnapshot({ layers: layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l) }),
    [layers, pushSnapshot]
  );

  const duplicateLayer = useCallback(
    (id: string) => {
      const src = layers.find(l => l.id === id);
      if (!src) return;
      const copy = { ...src, id: generateId(), name: `${src.name} copy` };
      const idx = layers.findIndex(l => l.id === id);
      const next = [...layers.slice(0, idx + 1), copy, ...layers.slice(idx + 1)];
      pushSnapshot({ layers: next });
      setActiveLayerId(copy.id);
    },
    [layers, pushSnapshot]
  );

  // ── Tool options ─────────────────────────────────────────────────────────────

  const updateToolOptions = useCallback(
    (opts: Partial<ToolOptions>) => setToolOptions(prev => ({ ...prev, ...opts })),
    []
  );

  // ── Canvas ───────────────────────────────────────────────────────────────────

  const setCanvasSize = useCallback(
    (w: number, h: number) => pushSnapshot({ canvasWidth: w, canvasHeight: h }),
    [pushSnapshot]
  );

  // ── Selection operations ─────────────────────────────────────────────────────

  const cropToSelection = useCallback(
    (canvasEl: HTMLCanvasElement) => {
      if (!selection || selection.type !== 'rect') return;
      const { x, y, width, height } = selection;
      const temp = document.createElement('canvas');
      temp.width = width; temp.height = height;
      const ctx = temp.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(canvasEl, x, y, width, height, 0, 0, width, height);
      const dataUrl = temp.toDataURL('image/png');
      pushSnapshot({
        layers: [makeLayer('image', 'Cropped', { dataUrl, x: 0, y: 0, width, height, scale: 1, rotation: 0 })],
        canvasWidth: width,
        canvasHeight: height,
      });
      setSelection(null);
    },
    [makeLayer, pushSnapshot, selection]
  );

  const copySelectionAsLayer = useCallback(
    (canvasEl: HTMLCanvasElement) => {
      if (!selection || selection.type !== 'rect') return;
      const { x, y, width, height } = selection;
      const temp = document.createElement('canvas');
      temp.width = width; temp.height = height;
      const ctx = temp.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(canvasEl, x, y, width, height, 0, 0, width, height);
      const dataUrl = temp.toDataURL('image/png');
      const data: ImageLayerData = { dataUrl, x, y, width, height, scale: 1, rotation: 0 };
      const layer = makeLayer('image', 'Selection Copy', data);
      pushSnapshot({ layers: [...layers, layer] });
      setActiveLayerId(layer.id);
      setSelection(null);
    },
    [layers, makeLayer, pushSnapshot, selection]
  );

  // ── Export / reset ───────────────────────────────────────────────────────────

  const exportCanvas = useCallback((canvasEl: HTMLCanvasElement) => {
    const dataUrl = canvasEl.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `halcon-dev-advanced-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const clearAll = useCallback(() => {
    history.reset(defaultSnapshot);
    setActiveLayerId(null);
    setSelection(null);
  }, [history]);

  return {
    layers,
    canvasWidth,
    canvasHeight,
    activeTool,
    activeLayerId,
    activeDrawLayer,
    selection,
    zoom,
    toolOptions,
    isDragging,
    canUndo: history.canUndo,
    canRedo: history.canRedo,

    setActiveTool,
    setActiveLayerId,
    setSelection,
    clearSelection: () => setSelection(null),
    setZoom,
    setIsDragging,
    updateToolOptions,
    setCanvasSize,

    createDrawLayer,
    createImageLayer,
    createTextLayer,
    addItemToActiveLayer,
    removeLayer,
    updateLayer,
    updateLayerData,
    moveLayerUp,
    moveLayerDown,
    toggleVisible,
    toggleLocked,
    duplicateLayer,

    cropToSelection,
    copySelectionAsLayer,
    exportCanvas,
    clearAll,

    undo: history.undo,
    redo: history.redo,
  };
}

export type AdvancedEditorHandle = ReturnType<typeof useAdvancedEditorState>;
