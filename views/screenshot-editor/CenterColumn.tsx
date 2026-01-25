import React, { useState, useCallback } from 'react';
import { Copy, Download, Image as ImageIcon, Minus, Plus, Save } from '../../components/Icons';
import type { EditorSettings, FitMode, OverlayImage, RedactionArea, TextBlockSettings } from './types';

type DragState = {
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  blockId: string;
};

type ImageDragState = {
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
};

type OverlayDragState = {
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  overlayId: string;
};

type CenterColumnProps = {
  imageDataUrl: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  previewRef: React.RefObject<HTMLDivElement>;
  settings: EditorSettings;
  fitMode: FitMode;
  zoom: number;
  autoFit: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  spaceDown: boolean;
  isPanning: boolean;
  isDragging: boolean;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onPreviewEnter: () => void;
  onPreviewLeave: () => void;
  onPanStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  onPanMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onPanEnd: () => void;
  activeBlockId: string | null;
  getBlockSettings: (blockId: string) => TextBlockSettings;
  dragState: DragState | null;
  setDragState: (next: DragState | null) => void;
  onUpdateBlockSettings: (id: string, update: Partial<TextBlockSettings>) => void;
  overlays: OverlayImage[];
  overlayDragState: OverlayDragState | null;
  setOverlayDragState: (next: OverlayDragState | null) => void;
  onUpdateOverlay: (id: string, update: Partial<OverlayImage>) => void;
  imageDragState: ImageDragState | null;
  setImageDragState: (next: ImageDragState | null) => void;
  onUpdateImagePosition: (update: { imageOffsetX: number; imageOffsetY: number }) => void;
  onDownload: () => void;
  onCopy: () => void;
  onSaveCache: () => void;
  onCommitHistory: () => void;
  // Redaction Props
  activeTool: 'move' | 'redact';
  onAddRedactionArea: (area: Omit<RedactionArea, 'id'>) => void;
  onRemoveRedactionArea: (id: string) => void;
  redactionAreas: RedactionArea[];
};

export const CenterColumn: React.FC<CenterColumnProps> = ({
  imageDataUrl,
  canvasRef,
  previewRef,
  settings,
  fitMode,
  zoom,
  autoFit,
  onZoomOut,
  onZoomIn,
  onFit,
  spaceDown,
  isPanning,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onPreviewEnter,
  onPreviewLeave,
  onPanStart,
  onPanMove,
  onPanEnd,
  activeBlockId,
  getBlockSettings,
  dragState,
  setDragState,
  onUpdateBlockSettings,
  overlays,
  overlayDragState,
  setOverlayDragState,
  onUpdateOverlay,
  imageDragState,
  setImageDragState,
  onUpdateImagePosition,
  onDownload,
  onCopy,
  onSaveCache,
  onCommitHistory,
  activeTool,
  onAddRedactionArea,
  onRemoveRedactionArea,
  redactionAreas,
}) => {
  const [drawingRect, setDrawingRect] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = settings.width / rect.width;
    const scaleY = settings.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, [canvasRef, settings.width, settings.height]);

  const hitTestOverlay = (x: number, y: number) => {
    for (let i = overlays.length - 1; i >= 0; i -= 1) {
      const overlay = overlays[i];
      if (!overlay.visible || overlay.locked) continue;
      const halfW = (overlay.width * overlay.scale) / 2;
      const halfH = (overlay.height * overlay.scale) / 2;
      const radians = (overlay.rotation * Math.PI) / 180;
      const cos = Math.cos(-radians);
      const sin = Math.sin(-radians);
      const dx = x - overlay.x;
      const dy = y - overlay.y;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
        return overlay;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (spaceDown) return; // Panning handles it

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Redaction Tool
    if (activeTool === 'redact') {
      setDrawingRect({ startX: x, startY: y, currentX: x, currentY: y });
      return;
    }

    // Selection Tool
    if (activeTool === 'move') {
      // 1. Check Alt Drag (Background image position)
      if (fitMode === 'crop' && e.altKey) {
        setImageDragState({
          startX: e.clientX,
          startY: e.clientY,
          baseX: settings.imageOffsetX,
          baseY: settings.imageOffsetY,
        });
        return;
      }

      // 2. Hit test overlays
      const overlay = hitTestOverlay(x, y);
      if (overlay) {
        setOverlayDragState({
          startX: x,
          startY: y,
          baseX: overlay.x,
          baseY: overlay.y,
          overlayId: overlay.id,
        });
        return;
      }

      // 3. Fallback to active text block
      if (activeBlockId) {
        const blockSettings = getBlockSettings(activeBlockId);
        setDragState({
          startX: x,
          startY: y,
          baseX: blockSettings.textOffsetX,
          baseY: blockSettings.textOffsetY,
          blockId: activeBlockId,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (drawingRect) {
      setDrawingRect(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
      return;
    }

    if (imageDragState) {
      const deltaX = e.clientX - imageDragState.startX;
      const deltaY = e.clientY - imageDragState.startY;
      onUpdateImagePosition({
        imageOffsetX: Math.round(imageDragState.baseX + deltaX),
        imageOffsetY: Math.round(imageDragState.baseY + deltaY),
      });
      return;
    }

    if (overlayDragState) {
      const nextX = overlayDragState.baseX + (x - overlayDragState.startX);
      const nextY = overlayDragState.baseY + (y - overlayDragState.startY);
      onUpdateOverlay(overlayDragState.overlayId, {
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
      return;
    }

    if (dragState) {
      const nextX = dragState.baseX + (x - dragState.startX);
      const nextY = dragState.baseY + (y - dragState.startY);
      onUpdateBlockSettings(dragState.blockId, {
        textOffsetX: Math.max(-settings.width, Math.min(settings.width, Math.round(nextX))),
        textOffsetY: Math.max(-settings.height, Math.min(settings.height, Math.round(nextY))),
      });
    }
  };

  const handleMouseUp = () => {
    if (drawingRect) {
      const x = Math.min(drawingRect.startX, drawingRect.currentX);
      const y = Math.min(drawingRect.startY, drawingRect.currentY);
      const w = Math.abs(drawingRect.currentX - drawingRect.startX);
      const h = Math.abs(drawingRect.currentY - drawingRect.startY);
      if (w > 5 && h > 5) {
        onAddRedactionArea({ x, y, width: w, height: h });
      }
      setDrawingRect(null);
    }
    setDragState(null);
    setOverlayDragState(null);
    setImageDragState(null);
    onCommitHistory();
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 flex flex-col gap-4 min-h-0 h-full min-w-0 w-full">
      <div className="flex items-center justify-between">
        <div className="text-white font-semibold flex items-center gap-2">
          Canvas Preview
          <span className="text-[10px] uppercase tracking-tighter px-1.5 py-0.5 bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20 rounded">
            {activeTool} tool
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-terminal-muted">
          <button onClick={onZoomOut} className="p-1 border border-terminal-border rounded hover:bg-white/5 transition-colors">
            <Minus size={14} />
          </button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={onZoomIn} className="p-1 border border-terminal-border rounded hover:bg-white/5 transition-colors">
            <Plus size={14} />
          </button>
          <button
            onClick={onFit}
            className={`px-2 py-1 border rounded transition-all ${autoFit ? 'border-terminal-accent text-terminal-accent' : 'border-terminal-border hover:bg-white/5'}`}
          >
            Fit
          </button>
        </div>
      </div>

      <div
        ref={previewRef}
        className="relative flex-1 min-h-0 min-w-0 w-full max-w-full overflow-auto bg-terminal-dark rounded-lg border border-terminal-border p-4 select-none"
        style={{
          cursor: spaceDown ? (isPanning ? 'grabbing' : 'grab') : undefined,
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onMouseEnter={onPreviewEnter}
        onMouseLeave={onPreviewLeave}
        onMouseDown={onPanStart}
        onMouseMove={onPanMove}
        onMouseUp={() => { onPanEnd(); onCommitHistory(); }}
      >
        {isDragging && (
          <div className="absolute inset-6 border-2 border-dashed border-terminal-accent rounded-lg bg-terminal-accent/10 pointer-events-none flex items-center justify-center text-sm text-white z-[100]">
            Drop image or .txt here
          </div>
        )}

        {imageDataUrl ? (
          <div
            className="inline-flex relative group/canvas bg-terminal-dark/50"
            style={{
              width: `${Math.max(1, Math.round(settings.width * zoom))}px`,
              height: `${Math.max(1, Math.round(settings.height * zoom))}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="border border-white/10"
              style={{
                width: '100%',
                height: '100%',
              }}
            />

            {/* Interaction Layer (Captures mouse for Selection/Drawing) */}
            <div
              className="absolute inset-0 z-40 touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                cursor: activeTool === 'redact' ? 'crosshair' : (activeBlockId || overlays.some(o => !o.locked)) ? 'move' : 'default'
              }}
            />

            {/* Content Layer (Feedback and Buttons) */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden z-50"
            >
              {/* Visual Feedback for Drawing */}
              {drawingRect && (
                <div
                  className="absolute border-2 border-terminal-accent bg-terminal-accent/10 rounded shadow-2xl"
                  style={{
                    left: `${Math.min(drawingRect.startX, drawingRect.currentX) * zoom}px`,
                    top: `${Math.min(drawingRect.startY, drawingRect.currentY) * zoom}px`,
                    width: `${Math.abs(drawingRect.currentX - drawingRect.startX) * zoom}px`,
                    height: `${Math.abs(drawingRect.currentY - drawingRect.startY) * zoom}px`,
                  }}
                />
              )}

              {/* Markers for existing redaction areas */}
              {redactionAreas.map(area => (
                <div
                  key={area.id}
                  className="absolute border-2 border-red-500/30 bg-red-500/5 group/redact"
                  style={{
                    left: `${area.x * zoom}px`,
                    top: `${area.y * zoom}px`,
                    width: `${area.width * zoom}px`,
                    height: `${area.height * zoom}px`,
                    pointerEvents: activeTool === 'redact' ? 'auto' : 'none',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRedactionArea(area.id);
                    }}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 opacity-0 group-hover/redact:opacity-100 transition-all hover:scale-110 active:scale-95 z-[70] pointer-events-auto"
                    title="Remove Mask"
                  >
                    <span className="text-sm font-bold leading-none">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-terminal-muted text-sm">
            <ImageIcon size={32} className="mb-3 opacity-20" />
            Upload an image to start editing.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 rounded hover:bg-terminal-accent/20 transition-all active:scale-95"
        >
          <Download size={14} />
          Save PNG
        </button>
        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 rounded hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <Copy size={14} />
          To Clipboard
        </button>
        <button
          onClick={onSaveCache}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 rounded hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <Save size={14} />
          Persist Cache
        </button>
      </div>
    </div>
  );
};
