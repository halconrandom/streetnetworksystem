import { useState, useCallback } from 'react';
import { useHistory } from '@features/screenshot-editor/editor/hooks/useHistory';
import type {
  AdvancedLayer, BrushLayerData, BrushStroke, EditorSnapshot,
  ImageLayerData, LayerType, Selection, ShapeLayerData,
  TextLayerData, ToolOptions, ToolType,
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

  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [zoom, setZoom] = useState(0.5);
  const [toolOptions, setToolOptions] = useState<ToolOptions>(defaultToolOptions);
  const [isDragging, setIsDragging] = useState(false);

  const { layers, canvasWidth, canvasHeight } = history.state;

  const pushSnapshot = useCallback(
    (next: Partial<EditorSnapshot>) => {
      history.push({ ...history.state, ...next });
    },
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

  const addImageLayer = useCallback(
    (dataUrl: string, name: string, width: number, height: number) => {
      const data: ImageLayerData = { dataUrl, x: 0, y: 0, width, height, scale: 1, rotation: 0 };
      const layer = makeLayer('image', name, data);
      pushSnapshot({ layers: [...layers, layer] });
      setActiveLayerId(layer.id);
    },
    [layers, makeLayer, pushSnapshot]
  );

  const addBrushLayer = useCallback(
    (stroke: BrushStroke) => {
      const data: BrushLayerData = { strokes: [stroke] };
      const layer = makeLayer('brush', `Brush ${layers.filter(l => l.type === 'brush').length + 1}`, data);
      pushSnapshot({ layers: [...layers, layer] });
      setActiveLayerId(layer.id);
    },
    [layers, makeLayer, pushSnapshot]
  );

  const appendStrokeToLayer = useCallback(
    (layerId: string, stroke: BrushStroke) => {
      const next = layers.map(l => {
        if (l.id !== layerId || l.type !== 'brush') return l;
        const brushData = l.data as BrushLayerData;
        return { ...l, data: { strokes: [...brushData.strokes, stroke] } };
      });
      pushSnapshot({ layers: next });
    },
    [layers, pushSnapshot]
  );

  const addShapeLayer = useCallback(
    (shape: ShapeLayerData) => {
      const layer = makeLayer('shape', `Shape ${layers.filter(l => l.type === 'shape').length + 1}`, shape);
      pushSnapshot({ layers: [...layers, layer] });
      setActiveLayerId(layer.id);
    },
    [layers, makeLayer, pushSnapshot]
  );

  const addTextLayer = useCallback(
    (data: TextLayerData) => {
      const layer = makeLayer('text', `Text ${layers.filter(l => l.type === 'text').length + 1}`, data);
      pushSnapshot({ layers: [...layers, layer] });
      setActiveLayerId(layer.id);
    },
    [layers, makeLayer, pushSnapshot]
  );

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
          l.id === id ? { ...l, data: { ...l.data, ...dataUpdate } as AdvancedLayer['data'] } : l
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
    (id: string) => {
      pushSnapshot({ layers: layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l) });
    },
    [layers, pushSnapshot]
  );

  const toggleLocked = useCallback(
    (id: string) => {
      pushSnapshot({ layers: layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l) });
    },
    [layers, pushSnapshot]
  );

  const updateToolOptions = useCallback(
    (opts: Partial<ToolOptions>) => {
      setToolOptions(prev => ({ ...prev, ...opts }));
    },
    []
  );

  const setCanvasSize = useCallback(
    (w: number, h: number) => {
      pushSnapshot({ canvasWidth: w, canvasHeight: h });
    },
    [pushSnapshot]
  );

  const cropToSelection = useCallback(
    (canvasEl: HTMLCanvasElement) => {
      if (!selection || selection.type !== 'rect') return;
      const { x, y, width, height } = selection;
      const temp = document.createElement('canvas');
      temp.width = width;
      temp.height = height;
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
      temp.width = width;
      temp.height = height;
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

    addImageLayer,
    addBrushLayer,
    appendStrokeToLayer,
    addShapeLayer,
    addTextLayer,
    removeLayer,
    updateLayer,
    updateLayerData,
    moveLayerUp,
    moveLayerDown,
    toggleVisible,
    toggleLocked,

    cropToSelection,
    copySelectionAsLayer,
    exportCanvas,
    clearAll,

    undo: history.undo,
    redo: history.redo,
  };
}

export type AdvancedEditorHandle = ReturnType<typeof useAdvancedEditorState>;
