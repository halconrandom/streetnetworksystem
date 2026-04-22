import React, { useCallback, useRef, useState } from 'react';
import { useAdvancedCanvasPainter } from './hooks/useAdvancedCanvasPainter';
import type {
  AdvancedLayer, BrushStroke, ImageLayerData, Selection,
  ShapeLayerData, TextLayerData, ToolOptions, ToolType,
} from '../types';

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  layers: AdvancedLayer[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  activeTool: ToolType;
  activeLayerId: string | null;
  toolOptions: ToolOptions;
  selection: Selection;
  isDragging: boolean;

  onSetZoom: (z: number) => void;
  onSetActiveLayerId: (id: string | null) => void;
  onSetSelection: (s: Selection) => void;
  onAddImageLayer: (dataUrl: string, name: string, w: number, h: number) => void;
  onAddBrushLayer: (stroke: BrushStroke) => void;
  onAddShapeLayer: (shape: ShapeLayerData) => void;
  onAddTextLayer: (data: TextLayerData) => void;
  onMoveLayer: (id: string, dx: number, dy: number) => void;
  onSetIsDragging: (v: boolean) => void;
  onCropToSelection: () => void;
};

export const CanvasArea: React.FC<Props> = ({
  canvasRef, layers, canvasWidth, canvasHeight, zoom,
  activeTool, activeLayerId, toolOptions, selection, isDragging,
  onSetZoom, onSetActiveLayerId, onSetSelection,
  onAddImageLayer, onAddBrushLayer, onAddShapeLayer, onAddTextLayer,
  onMoveLayer, onSetIsDragging, onCropToSelection,
}) => {
  const [liveBrushStroke, setLiveBrushStroke] = useState<BrushStroke | null>(null);
  const [liveShape, setLiveShape] = useState<ShapeLayerData | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ scrollLeft: number; scrollTop: number; mouseX: number; mouseY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragMoveRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; layerId: string } | null>(null);

  useAdvancedCanvasPainter({ canvasRef, layers, canvasWidth, canvasHeight, liveBrushStroke, liveShape });

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
      } else if (layer.type === 'shape') {
        const d = layer.data as ShapeLayerData;
        if (x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height) return layer;
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
        const d = hit.type === 'image' ? hit.data as ImageLayerData : hit.type === 'shape' ? hit.data as ShapeLayerData : null;
        if (d && 'x' in d) {
          dragMoveRef.current = { startX: x, startY: y, baseX: d.x, baseY: d.y, layerId: hit.id };
        }
      } else {
        onSetActiveLayerId(null);
      }
    }

    if (activeTool === 'brush') {
      setLiveBrushStroke({
        points: [{ x, y }],
        color: toolOptions.brushColor,
        size: toolOptions.brushSize,
        opacity: toolOptions.brushOpacity,
      });
    }

    if (activeTool === 'shape') {
      setDrawStart({ x, y });
      setLiveShape({
        shapeType: toolOptions.shapeSubType,
        x, y, width: 0, height: 0,
        fill: toolOptions.shapeFill,
        fillEnabled: toolOptions.shapeFillEnabled,
        stroke: toolOptions.shapeStroke,
        strokeWidth: toolOptions.shapeStrokeWidth,
        strokeEnabled: toolOptions.shapeStrokeEnabled,
        rotation: 0,
      });
    }

    if (activeTool === 'marquee') {
      setDrawStart({ x, y });
      onSetSelection({ type: 'rect', x, y, width: 0, height: 0 });
    }

    if (activeTool === 'text') {
      const text = window.prompt('Enter text:');
      if (text) {
        onAddTextLayer({
          text,
          x, y,
          fontSize: toolOptions.textFontSize,
          fontFamily: toolOptions.textFontFamily,
          fontWeight: toolOptions.textFontWeight,
          color: toolOptions.textColor,
          rotation: 0,
        });
      }
    }
  }, [
    spaceDown, activeTool, getCanvasCoords, hitTestLayer, toolOptions,
    onSetActiveLayerId, onSetSelection, onAddTextLayer,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStartRef.current) {
      const el = previewRef.current;
      if (!el) return;
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      el.scrollLeft = panStartRef.current.scrollLeft - dx;
      el.scrollTop = panStartRef.current.scrollTop - dy;
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'select' && dragMoveRef.current) {
      const ref = dragMoveRef.current;
      onMoveLayer(ref.layerId, ref.baseX + (x - ref.startX), ref.baseY + (y - ref.startY));
    }

    if (activeTool === 'brush' && liveBrushStroke) {
      setLiveBrushStroke(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
    }

    if (activeTool === 'shape' && drawStart && liveShape) {
      const nx = Math.min(drawStart.x, x);
      const ny = Math.min(drawStart.y, y);
      const nw = Math.abs(x - drawStart.x);
      const nh = Math.abs(y - drawStart.y);
      setLiveShape(prev => prev ? { ...prev, x: nx, y: ny, width: nw, height: nh } : null);
    }

    if (activeTool === 'marquee' && drawStart) {
      const nx = Math.min(drawStart.x, x);
      const ny = Math.min(drawStart.y, y);
      onSetSelection({ type: 'rect', x: nx, y: ny, width: Math.abs(x - drawStart.x), height: Math.abs(y - drawStart.y) });
    }
  }, [
    isPanning, activeTool, getCanvasCoords, liveBrushStroke, liveShape, drawStart,
    onMoveLayer, onSetSelection,
  ]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
    dragMoveRef.current = null;

    if (activeTool === 'brush' && liveBrushStroke && liveBrushStroke.points.length > 0) {
      onAddBrushLayer(liveBrushStroke);
      setLiveBrushStroke(null);
    }

    if (activeTool === 'shape' && liveShape && liveShape.width > 2 && liveShape.height > 2) {
      onAddShapeLayer(liveShape);
      setLiveShape(null);
    } else if (activeTool === 'shape') {
      setLiveShape(null);
    }

    setDrawStart(null);
  }, [activeTool, liveBrushStroke, liveShape, onAddBrushLayer, onAddShapeLayer]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onSetIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => onAddImageLayer(dataUrl, file.name.replace(/\.[^.]+$/, ''), img.width, img.height);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [onAddImageLayer, onSetIsDragging]);

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
        <span className="text-[11px] font-mono text-terminal-muted/50 uppercase tracking-widest">Canvas</span>
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
          <button onClick={() => onSetZoom(Math.max(0.05, zoom - 0.1))} className="text-white/30 hover:text-white transition-colors text-sm font-mono">−</button>
          <span className="text-[11px] font-mono text-white/40 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => onSetZoom(Math.min(4, zoom + 0.1))} className="text-white/30 hover:text-white transition-colors text-sm font-mono">+</button>
          <div className="w-px h-3 bg-white/10 mx-1" />
          <button onClick={() => onSetZoom(1)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors">1:1</button>
          <button onClick={() => onSetZoom(0.5)} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors ml-1">Fit</button>
        </div>
        <span className="text-[10px] font-mono text-terminal-muted/30">{canvasWidth} × {canvasHeight}</span>
      </div>

      {/* Canvas viewport */}
      <div
        ref={previewRef}
        className="flex-1 min-h-0 min-w-0 overflow-auto p-6 relative"
        style={{ cursor }}
        onDragOver={e => { e.preventDefault(); onSetIsDragging(true); }}
        onDragLeave={() => onSetIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-4 border-2 border-dashed border-terminal-accent bg-terminal-accent/5 rounded-lg flex items-center justify-center text-sm text-terminal-accent z-50 pointer-events-none">
            Drop image to add as layer
          </div>
        )}

        <div
          className="inline-flex relative"
          style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}
        >
          <canvas
            ref={canvasRef}
            className="border border-white/10 shadow-2xl"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Interaction overlay */}
          <div
            className="absolute inset-0 z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Selection rect overlay */}
          {selection && selection.type === 'rect' && selection.width > 2 && selection.height > 2 && (
            <div
              className="absolute pointer-events-none z-20 border-2 border-white/80"
              style={{
                left: selection.x * zoom,
                top: selection.y * zoom,
                width: selection.width * zoom,
                height: selection.height * zoom,
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5)',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 4px, transparent 4px, transparent 8px)',
              }}
            />
          )}
        </div>

        {layers.length === 0 && !isDragging && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-terminal-muted/30 select-none pointer-events-none">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-30">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
            </svg>
            <p className="text-sm font-mono">Drop an image to start</p>
            <p className="text-xs mt-1 opacity-60">or use the tools on the left</p>
          </div>
        )}
      </div>
    </div>
  );
};
