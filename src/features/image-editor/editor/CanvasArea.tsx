import React, { useCallback, useRef, useState } from 'react';
import { useAdvancedCanvasPainter } from './hooks/useAdvancedCanvasPainter';
import type {
  AdvancedLayer, DrawItem, ImageLayerData, LiveShape, LiveStroke,
  Selection, ShapeType, TextLayerData, ToolOptions, ToolType,
} from '../types';

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  layers: AdvancedLayer[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  activeTool: ToolType;
  activeLayerId: string | null;
  activeDrawLayer: AdvancedLayer | null;
  toolOptions: ToolOptions;
  selection: Selection;
  isDragging: boolean;

  onSetZoom: (z: number) => void;
  onSetActiveLayerId: (id: string | null) => void;
  onSetSelection: (s: Selection) => void;
  onCreateImageLayer: (dataUrl: string, name: string, w: number, h: number) => void;
  onCreateTextLayer: (data: TextLayerData) => void;
  onAddItemToActiveLayer: (item: DrawItem) => void;
  onMoveActiveLayer: (newX: number, newY: number) => void;
  onSetIsDragging: (v: boolean) => void;
};

export const CanvasArea: React.FC<Props> = ({
  canvasRef, layers, canvasWidth, canvasHeight, zoom,
  activeTool, activeLayerId, activeDrawLayer, toolOptions, selection, isDragging,
  onSetZoom, onSetActiveLayerId, onSetSelection,
  onCreateImageLayer, onCreateTextLayer, onAddItemToActiveLayer,
  onMoveActiveLayer, onSetIsDragging,
}) => {
  const [liveStroke, setLiveStroke] = useState<LiveStroke | null>(null);
  const [liveShape, setLiveShape] = useState<LiveShape | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ scrollLeft: number; scrollTop: number; mouseX: number; mouseY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragMoveRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  useAdvancedCanvasPainter({ canvasRef, layers, canvasWidth, canvasHeight, liveStroke, liveShape });

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvasWidth / rect.width),
      y: (clientY - rect.top) * (canvasHeight / rect.height),
    };
  }, [canvasRef, canvasWidth, canvasHeight]);

  const hitTestLayer = useCallback((x: number, y: number): AdvancedLayer | null => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.locked) continue;
      if (layer.type === 'image') {
        const d = layer.data as ImageLayerData;
        const w = d.width * d.scale;
        const h = d.height * d.scale;
        if (x >= d.x && x <= d.x + w && y >= d.y && y <= d.y + h) return layer;
      }
    }
    return null;
  }, [layers]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setSpaceDown(true); } };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (spaceDown) {
      const el = previewRef.current;
      if (!el) return;
      panStartRef.current = { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, mouseX: e.clientX, mouseY: e.clientY };
      setIsPanning(true);
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'select') {
      const hit = hitTestLayer(x, y);
      if (hit) {
        onSetActiveLayerId(hit.id);
        const d = hit.data as ImageLayerData;
        if ('x' in d) dragMoveRef.current = { startX: x, startY: y, baseX: d.x, baseY: d.y };
      } else {
        onSetActiveLayerId(null);
      }
      return;
    }

    if (activeTool === 'brush') {
      if (!activeDrawLayer) return;
      setLiveStroke({ points: [{ x, y }], color: toolOptions.brushColor, size: toolOptions.brushSize, opacity: toolOptions.brushOpacity });
      return;
    }

    if (activeTool === 'shape') {
      if (!activeDrawLayer) return;
      setDrawStart({ x, y });
      setLiveShape({
        shapeType: toolOptions.shapeSubType,
        x, y, width: 0, height: 0,
        fill: toolOptions.shapeFill, fillEnabled: toolOptions.shapeFillEnabled,
        stroke: toolOptions.shapeStroke, strokeWidth: toolOptions.shapeStrokeWidth, strokeEnabled: toolOptions.shapeStrokeEnabled,
        rotation: 0,
      });
      return;
    }

    if (activeTool === 'marquee') {
      setDrawStart({ x, y });
      onSetSelection({ type: 'rect', x, y, width: 0, height: 0 });
      return;
    }

    if (activeTool === 'text') {
      const text = window.prompt('Enter text:');
      if (text) {
        onCreateTextLayer({
          text, x, y,
          fontSize: toolOptions.textFontSize,
          fontFamily: toolOptions.textFontFamily,
          fontWeight: toolOptions.textFontWeight,
          color: toolOptions.textColor,
          rotation: 0,
        });
      }
    }
  }, [
    spaceDown, activeTool, activeDrawLayer, getCanvasCoords, hitTestLayer, toolOptions,
    onSetActiveLayerId, onSetSelection, onCreateTextLayer,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStartRef.current) {
      const el = previewRef.current;
      if (!el) return;
      el.scrollLeft = panStartRef.current.scrollLeft - (e.clientX - panStartRef.current.mouseX);
      el.scrollTop = panStartRef.current.scrollTop - (e.clientY - panStartRef.current.mouseY);
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'select' && dragMoveRef.current) {
      const ref = dragMoveRef.current;
      onMoveActiveLayer(ref.baseX + (x - ref.startX), ref.baseY + (y - ref.startY));
      return;
    }

    if (activeTool === 'brush' && liveStroke) {
      setLiveStroke(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
      return;
    }

    if (activeTool === 'shape' && drawStart && liveShape) {
      setLiveShape(prev => prev ? {
        ...prev,
        x: Math.min(drawStart.x, x),
        y: Math.min(drawStart.y, y),
        width: Math.abs(x - drawStart.x),
        height: Math.abs(y - drawStart.y),
      } : null);
      return;
    }

    if (activeTool === 'marquee' && drawStart) {
      onSetSelection({ type: 'rect', x: Math.min(drawStart.x, x), y: Math.min(drawStart.y, y), width: Math.abs(x - drawStart.x), height: Math.abs(y - drawStart.y) });
    }
  }, [isPanning, activeTool, liveStroke, liveShape, drawStart, getCanvasCoords, onMoveActiveLayer, onSetSelection]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
    dragMoveRef.current = null;

    if (activeTool === 'brush' && liveStroke && liveStroke.points.length > 0) {
      onAddItemToActiveLayer({ kind: 'stroke', points: liveStroke.points, color: liveStroke.color, size: liveStroke.size, opacity: liveStroke.opacity });
      setLiveStroke(null);
    }

    if (activeTool === 'shape' && liveShape && liveShape.width > 2 && liveShape.height > 2) {
      onAddItemToActiveLayer({ kind: 'shape', ...liveShape });
    }
    setLiveShape(null);
    setDrawStart(null);
  }, [activeTool, liveStroke, liveShape, onAddItemToActiveLayer]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onSetIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => onCreateImageLayer(dataUrl, file.name.replace(/\.[^.]+$/, ''), img.width, img.height);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [onCreateImageLayer, onSetIsDragging]);

  const needsDrawLayer = (activeTool === 'brush' || activeTool === 'shape') && !activeDrawLayer;

  const cursor = spaceDown
    ? (isPanning ? 'grabbing' : 'grab')
    : activeTool === 'brush' ? 'crosshair'
    : activeTool === 'shape' ? 'crosshair'
    : activeTool === 'marquee' ? 'crosshair'
    : activeTool === 'text' ? 'text'
    : 'default';

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-[#080808]">
      {/* Zoom bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0">
        <span className="text-[11px] font-mono text-terminal-muted/40 uppercase tracking-widest">Canvas</span>
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
          <button onClick={() => onSetZoom(Math.max(0.05, zoom - 0.1))} className="text-white/30 hover:text-white transition-colors text-sm font-mono leading-none">−</button>
          <span className="text-[11px] font-mono text-white/40 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => onSetZoom(Math.min(4, zoom + 0.1))} className="text-white/30 hover:text-white transition-colors text-sm font-mono leading-none">+</button>
          <div className="w-px h-3 bg-white/10 mx-1" />
          <button onClick={() => onSetZoom(1)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors">1:1</button>
          <button onClick={() => onSetZoom(0.5)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors ml-1">½</button>
        </div>
        <span className="text-[10px] font-mono text-terminal-muted/30">{canvasWidth} × {canvasHeight}</span>
      </div>

      {/* Hint when draw tool is active but no draw layer selected */}
      {needsDrawLayer && (
        <div className="px-4 py-2 bg-terminal-accent/10 border-b border-terminal-accent/20 text-[11px] font-mono text-terminal-accent">
          ↑ Create or select a layer in the panel to start drawing
        </div>
      )}

      {/* Canvas viewport */}
      <div
        ref={previewRef}
        className="flex-1 min-h-0 min-w-0 overflow-auto relative"
        style={{ cursor }}
        onDragOver={e => { e.preventDefault(); onSetIsDragging(true); }}
        onDragLeave={() => onSetIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 border-2 border-dashed border-terminal-accent bg-terminal-accent/5 flex items-center justify-center text-sm text-terminal-accent pointer-events-none">
            Drop image to add as layer
          </div>
        )}

        {/* Empty state — centered in the viewport */}
        {layers.length === 0 && !isDragging && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-terminal-muted/25 select-none pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
            </svg>
            <p className="text-sm font-mono">Create a layer to start</p>
            <p className="text-xs mt-1 opacity-60">or drop an image here</p>
          </div>
        )}

        {/* Canvas wrapper — always rendered */}
        <div className="p-6 inline-block min-w-full min-h-full flex items-start justify-start">
          <div
            className="inline-flex relative shrink-0"
            style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}
          >
            <canvas
              ref={canvasRef}
              className="border border-white/10 shadow-2xl block"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Interaction overlay */}
            <div
              className="absolute inset-0 z-10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* Selection overlay */}
            {selection && selection.type === 'rect' && selection.width > 2 && selection.height > 2 && (
              <div
                className="absolute pointer-events-none z-20 border-2 border-white/80"
                style={{
                  left: selection.x * zoom,
                  top: selection.y * zoom,
                  width: selection.width * zoom,
                  height: selection.height * zoom,
                  backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 4px, transparent 4px, transparent 8px)',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
