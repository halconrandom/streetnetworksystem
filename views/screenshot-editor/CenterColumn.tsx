import React from 'react';
import { Copy, Download, Image as ImageIcon, Minus, Plus, Save } from '../../components/Icons';
import type { EditorSettings, FitMode, OverlayImage, PreviewMode, TextBlockSettings } from './types';

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
  previewMode: PreviewMode;
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
  rawTextFile: string;
  onRawTextChange: (value: string) => void;
  onRemoveTimestamps: () => void;
  onApplyChatLines: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onSaveCache: () => void;
};

export const CenterColumn: React.FC<CenterColumnProps> = ({
  previewMode,
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
  rawTextFile,
  onRawTextChange,
  onRemoveTimestamps,
  onApplyChatLines,
  onDownload,
  onCopy,
  onSaveCache,
}) => {
  const hitTestOverlay = (x: number, y: number) => {
    for (let i = overlays.length - 1; i >= 0; i -= 1) {
      const overlay = overlays[i];
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

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 flex flex-col gap-4 min-h-0 h-full min-w-0 w-full">
      {previewMode === 'canvas' ? (
        <>
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">Canvas Preview</div>
            <div className="flex items-center gap-2 text-xs text-terminal-muted">
              <button onClick={onZoomOut} className="p-1 border border-terminal-border rounded">
                <Minus size={14} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={onZoomIn} className="p-1 border border-terminal-border rounded">
                <Plus size={14} />
              </button>
              <button
                onClick={onFit}
                className={`px-2 py-1 border rounded ${autoFit ? 'border-terminal-accent text-terminal-accent' : 'border-terminal-border'}`}
              >
                Fit
              </button>
            </div>
          </div>
          <div
            ref={previewRef}
            className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-auto bg-terminal-dark rounded-lg border border-terminal-border p-4"
            style={{
              cursor: spaceDown ? (isPanning ? 'grabbing' : 'grab') : undefined,
              height: 'calc(100% - 150px)',
            }}
            onMouseEnter={onPreviewEnter}
            onMouseLeave={onPreviewLeave}
            onMouseDown={onPanStart}
            onMouseMove={onPanMove}
            onMouseUp={onPanEnd}
          >
            {imageDataUrl ? (
              <div className="inline-flex">
                <canvas
                  ref={canvasRef}
                  className="border border-terminal-border"
                  style={{
                    width: `${Math.max(1, Math.round(settings.width * zoom))}px`,
                    height: `${Math.max(1, Math.round(settings.height * zoom))}px`,
                    cursor: activeBlockId ? 'grab' : 'not-allowed',
                  }}
                  onMouseDown={(event) => {
                    if (!canvasRef.current) return;
                    if (fitMode === 'crop' && event.altKey) {
                      setImageDragState({
                        startX: event.clientX,
                        startY: event.clientY,
                        baseX: settings.imageOffsetX,
                        baseY: settings.imageOffsetY,
                      });
                      return;
                    }
                    const rect = canvasRef.current.getBoundingClientRect();
                    const scaleX = settings.width / rect.width;
                    const scaleY = settings.height / rect.height;
                    const x = (event.clientX - rect.left) * scaleX;
                    const y = (event.clientY - rect.top) * scaleY;
                    const hitOverlay = hitTestOverlay(x, y);
                    if (hitOverlay) {
                      setOverlayDragState({
                        startX: x,
                        startY: y,
                        baseX: hitOverlay.x,
                        baseY: hitOverlay.y,
                        overlayId: hitOverlay.id,
                      });
                      return;
                    }
                    if (!activeBlockId) return;
                    const blockSettings = getBlockSettings(activeBlockId);
                    setDragState({
                      startX: x,
                      startY: y,
                      baseX: blockSettings.textOffsetX,
                      baseY: blockSettings.textOffsetY,
                      blockId: activeBlockId,
                    });
                  }}
                  onMouseLeave={() => {
                    setDragState(null);
                    setOverlayDragState(null);
                    setImageDragState(null);
                  }}
                  onMouseUp={() => {
                    setDragState(null);
                    setOverlayDragState(null);
                    setImageDragState(null);
                  }}
                  onMouseMove={(event) => {
                    if (imageDragState) {
                      const deltaX = event.clientX - imageDragState.startX;
                      const deltaY = event.clientY - imageDragState.startY;
                      onUpdateImagePosition({
                        imageOffsetX: Math.round(imageDragState.baseX + deltaX),
                        imageOffsetY: Math.round(imageDragState.baseY + deltaY),
                      });
                      return;
                    }
                    if (overlayDragState && canvasRef.current) {
                      const rect = canvasRef.current.getBoundingClientRect();
                      const scaleX = settings.width / rect.width;
                      const scaleY = settings.height / rect.height;
                      const x = (event.clientX - rect.left) * scaleX;
                      const y = (event.clientY - rect.top) * scaleY;
                      const nextX = overlayDragState.baseX + (x - overlayDragState.startX);
                      const nextY = overlayDragState.baseY + (y - overlayDragState.startY);
                      onUpdateOverlay(overlayDragState.overlayId, {
                        x: Math.round(nextX),
                        y: Math.round(nextY),
                      });
                      return;
                    }
                    if (!dragState || !canvasRef.current) return;
                    const rect = canvasRef.current.getBoundingClientRect();
                    const scaleX = settings.width / rect.width;
                    const scaleY = settings.height / rect.height;
                    const x = (event.clientX - rect.left) * scaleX;
                    const y = (event.clientY - rect.top) * scaleY;
                    const nextX = dragState.baseX + (x - dragState.startX);
                    const nextY = dragState.baseY + (y - dragState.startY);
                    onUpdateBlockSettings(dragState.blockId, {
                      textOffsetX: Math.max(-settings.width, Math.min(settings.width, Math.round(nextX))),
                      textOffsetY: Math.max(-settings.height, Math.min(settings.height, Math.round(nextY))),
                    });
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-terminal-muted text-sm">
                <ImageIcon size={32} className="mb-3" />
                Upload an image to start editing.
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30 rounded-md"
            >
              <Download size={14} />
              Save PNG
            </button>
            <button
              onClick={onCopy}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
            >
              <Copy size={14} />
              Copy to Clipboard
            </button>
            <button
              onClick={onSaveCache}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
            >
              <Save size={14} />
              Save to Cache
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">Text File Preview</div>
            <button
              onClick={onRemoveTimestamps}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
            >
              Remove Timestamps
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-terminal-dark rounded-lg border border-terminal-border p-4">
            <textarea
              value={rawTextFile}
              onChange={(event) => onRawTextChange(event.target.value)}
              rows={18}
              className="w-full bg-terminal-dark text-sm text-white border border-terminal-border rounded-md p-3 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onApplyChatLines}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30 rounded-md"
            >
              Apply to Chat Lines
            </button>
          </div>
        </>
      )}
    </div>
  );
};
