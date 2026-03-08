import React, { useRef, useState, useEffect, useCallback } from 'react';
import { OverlayImage } from './types';
import { ZoomIn, ZoomOut, Check, Copy } from '@/components/Icons';

type CropEditorProps = {
  overlay: OverlayImage;
  onApply: (crop: { x: number; y: number; width: number; height: number }) => void;
  onSaveAsCopy: (crop: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
  width: number;
  height: number;
};

export const CropEditor: React.FC<CropEditorProps> = ({
  overlay, onApply, onSaveAsCopy, onCancel, width: containerWidth, height: containerHeight
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Viewport state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Use refs for drag state so mousemove handlers see updates immediately
  const panningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const selectingRef = useRef(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keep zoom/pan in refs for use in non-React event handlers
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Load image
  useEffect(() => {
    if (!overlay.dataUrl) return;

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      // Initial fit
      const scaleX = (containerWidth - 100) / img.naturalWidth;
      const scaleY = (containerHeight - 100) / img.naturalHeight;
      const fitScale = Math.min(scaleX, scaleY, 1);
      setZoom(fitScale);
      setPan({
        x: (containerWidth - img.naturalWidth * fitScale) / 2,
        y: (containerHeight - img.naturalHeight * fitScale) / 2
      });

      if (overlay.crop) {
        setSelection(overlay.crop);
      } else {
        setSelection({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = overlay.dataUrl;
  }, [overlay.dataUrl, overlay.crop, containerWidth, containerHeight]);

  // Convert client coords to image coords
  const clientToImage = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;
    return {
      x: (clientX - rect.left - currentPan.x) / currentZoom,
      y: (clientY - rect.top - currentPan.y) / currentZoom,
    };
  }, []);

  // Global mouse handlers (attached to window for reliable drag tracking)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Panning
      if (panningRef.current && panStartRef.current) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
        return;
      }

      // Selection drawing
      if (selectingRef.current && selectionStartRef.current && image) {
        const { x: imgX, y: imgY } = clientToImage(e.clientX, e.clientY);

        // Clamp to image bounds
        const currentX = Math.max(0, Math.min(image.naturalWidth, imgX));
        const currentY = Math.max(0, Math.min(image.naturalHeight, imgY));

        const startX = selectionStartRef.current.x;
        const startY = selectionStartRef.current.y;

        setSelection({
          x: Math.min(startX, currentX),
          y: Math.min(startY, currentY),
          width: Math.abs(currentX - startX),
          height: Math.abs(currentY - startY),
        });
      }
    };

    const handleMouseUp = () => {
      panningRef.current = false;
      panStartRef.current = null;
      selectingRef.current = false;
      selectionStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [image, clientToImage]);

  // Wheel zoom with passive: false (must be a native listener, not React synthetic)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.1;
      const currentZoom = zoomRef.current;
      const newZoom = e.deltaY < 0 ? currentZoom * scaleFactor : currentZoom / scaleFactor;
      const boundedZoom = Math.min(5, Math.max(0.05, newZoom));

      // Zoom toward cursor
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentPan = panRef.current;

      const ratio = boundedZoom / currentZoom;
      const newPanX = mouseX - (mouseX - currentPan.x) * ratio;
      const newPanY = mouseY - (mouseY - currentPan.y) * ratio;

      setZoom(boundedZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // Middle mouse or Alt+Click → pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // Left click → start selection
    if (e.button === 0 && !e.altKey && image) {
      const { x: imgX, y: imgY } = clientToImage(e.clientX, e.clientY);
      const clampedX = Math.max(0, Math.min(image.naturalWidth, imgX));
      const clampedY = Math.max(0, Math.min(image.naturalHeight, imgY));

      selectingRef.current = true;
      selectionStartRef.current = { x: clampedX, y: clampedY };
      setSelection({ x: clampedX, y: clampedY, width: 0, height: 0 });
    }
  };

  if (!image) {
    return (
      <div className="flex items-center justify-center h-full text-white/50 text-sm">
        Loading image…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-terminal-black">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-terminal-border bg-terminal-panel">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold">Editing Crop: {overlay.name}</span>
          <div className="flex items-center gap-1 bg-terminal-dark rounded-md p-1 border border-terminal-border">
            <button onClick={() => setZoom(z => Math.max(0.05, z / 1.2))} className="p-1 hover:text-white text-terminal-muted"><ZoomOut size={16} /></button>
            <span className="text-xs text-white min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(5, z * 1.2))} className="p-1 hover:text-white text-terminal-muted"><ZoomIn size={16} /></button>
          </div>
          {selection && selection.width > 0 && selection.height > 0 && (
            <span className="text-xs text-terminal-muted font-mono">
              {Math.round(selection.width)} × {Math.round(selection.height)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wide border border-terminal-border text-terminal-muted hover:text-white rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => selection && selection.width > 1 && selection.height > 1 && onSaveAsCopy(selection)}
            disabled={!selection || selection.width <= 1 || selection.height <= 1}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Copy size={16} />
            Save Copy & Add
          </button>
          <button
            onClick={() => {
              if (selection && selection.width > 1 && selection.height > 1) {
                onApply(selection);
              } else {
                // Apply full image if no valid selection
                onApply({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-accent text-black hover:bg-terminal-accent/90 rounded-md"
          >
            <Check size={16} />
            Apply
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative select-none bg-[#111]"
        style={{ cursor: panningRef.current ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
      >
        {/* Transformed image layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: image.naturalWidth,
            height: image.naturalHeight,
            position: 'absolute',
          }}
        >
          <img
            src={overlay.dataUrl}
            className="pointer-events-none block"
            style={{ width: '100%', height: '100%' }}
            draggable={false}
          />

          {/* Darken overlay outside selection */}
          {selection && selection.width > 0 && selection.height > 0 && (
            <>
              <div
                className="absolute inset-0 bg-black/50"
                style={{
                  clipPath: `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${selection.x}px 100%, 
                    ${selection.x}px ${selection.y}px, 
                    ${selection.x + selection.width}px ${selection.y}px,
                    ${selection.x + selection.width}px ${selection.y + selection.height}px,
                    ${selection.x}px ${selection.y + selection.height}px,
                    ${selection.x}px 100%,
                    100% 100%, 
                    100% 0%
                  )`
                }}
              />
              <div
                className="absolute border border-white box-border shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                style={{
                  left: selection.x,
                  top: selection.y,
                  width: selection.width,
                  height: selection.height,
                }}
              />
            </>
          )}
        </div>

        {/* Help text */}
        <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs p-2 rounded pointer-events-none">
          Drag to crop. Alt+Drag or Middle Click to Pan. Scroll to Zoom.
        </div>
      </div>
    </div>
  );
};
