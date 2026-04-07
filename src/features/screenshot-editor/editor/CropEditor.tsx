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
  overlay,
  onApply,
  onSaveAsCopy,
  onCancel,
  width: containerWidth,
  height: containerHeight,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const didAutoFitRef = useRef(false);

  const normalizeCrop = useCallback((crop: { x: number; y: number; width: number; height: number }, img: HTMLImageElement) => {
    const maxW = img.naturalWidth;
    const maxH = img.naturalHeight;
    const x = Math.max(0, Math.min(maxW - 1, Math.round(crop.x)));
    const y = Math.max(0, Math.min(maxH - 1, Math.round(crop.y)));
    const width = Math.max(1, Math.min(maxW - x, Math.round(crop.width)));
    const height = Math.max(1, Math.min(maxH - y, Math.round(crop.height)));
    return { x, y, width, height };
  }, []);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const panningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectingRef = useRef(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const fitImageToViewport = useCallback((img: HTMLImageElement) => {
    const viewportW = Math.max(1, containerRef.current?.clientWidth ?? containerWidth);
    const viewportH = Math.max(1, containerRef.current?.clientHeight ?? containerHeight);
    if (viewportW <= 1 || viewportH <= 1) return;

    const padding = 40;
    const scaleX = (viewportW - padding) / img.naturalWidth;
    const scaleY = (viewportH - padding) / img.naturalHeight;
    const fitScale = Math.min(Math.max(0.05, Math.min(scaleX, scaleY)), 1);
    setZoom(fitScale);
    setPan({
      x: (viewportW - img.naturalWidth * fitScale) / 2,
      y: (viewportH - img.naturalHeight * fitScale) / 2,
    });
  }, [containerWidth, containerHeight]);

  useEffect(() => {
    if (!overlay.dataUrl) return;
    setImageError(null);

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      didAutoFitRef.current = false;
      requestAnimationFrame(() => fitImageToViewport(img));

      if (overlay.crop) {
        setSelection(normalizeCrop(overlay.crop, img));
      } else {
        setSelection({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
      }
    };

    img.onerror = () => {
      setImageError('Could not load overlay image for cropping.');
      setImage(null);
    };

    img.src = overlay.dataUrl;
  }, [overlay.dataUrl, overlay.crop, containerWidth, containerHeight, normalizeCrop, fitImageToViewport]);

  useEffect(() => {
    if (!image || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(() => {
      if (!didAutoFitRef.current) {
        fitImageToViewport(image);
        didAutoFitRef.current = true;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [image, fitImageToViewport]);

  useEffect(() => {
    if (!image) return;
    const timer = window.setTimeout(() => {
      fitImageToViewport(image);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [image, fitImageToViewport]);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (panningRef.current && panStartRef.current) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
        return;
      }

      if (selectingRef.current && selectionStartRef.current && image) {
        const { x: imgX, y: imgY } = clientToImage(e.clientX, e.clientY);
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.1;
      const currentZoom = zoomRef.current;
      const newZoom = e.deltaY < 0 ? currentZoom * scaleFactor : currentZoom / scaleFactor;
      const boundedZoom = Math.min(5, Math.max(0.05, newZoom));

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

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

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
      <div className="flex items-center justify-center h-full text-slate-600 text-sm border-2 border-black bg-[#f4f1ea]">
        {imageError ?? 'Loading image...'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f4f1ea] border-2 border-black shadow-[4px_4px_0px_#000]">
      <div className="flex items-center justify-between p-3 border-b-2 border-black bg-[#fdfbf7] gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-black text-sm font-bold truncate">Editing Crop: {overlay.name}</span>
          <div className="flex items-center gap-1 p-1 border-2 border-black bg-[#f4f1ea]">
            <button onClick={() => setZoom((z) => Math.max(0.05, z / 1.2))} className="p-1 text-slate-600 hover:text-black"><ZoomOut size={14} /></button>
            <span className="text-xs text-black min-w-[40px] text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(5, z * 1.2))} className="p-1 text-slate-600 hover:text-black"><ZoomIn size={14} /></button>
          </div>
          <button
            onClick={() => fitImageToViewport(image)}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide border-2 border-black bg-[#f4f1ea] text-slate-700"
          >
            Refit
          </button>
          {selection && selection.width > 0 && selection.height > 0 && (
            <span className="text-xs text-slate-600 font-mono">
              {Math.round(selection.width)} x {Math.round(selection.height)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs font-bold uppercase tracking-wide border-2 border-black bg-[#f4f1ea] text-slate-700 shadow-[2px_2px_0px_#000] hover:bg-[#ede9e0] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selection || !image) return;
              const crop = normalizeCrop(selection, image);
              if (crop.width <= 1 || crop.height <= 1) return;
              onSaveAsCopy(crop);
            }}
            disabled={!selection || selection.width <= 1 || selection.height <= 1}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide bg-violet-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-violet-600 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy size={14} />
            Save Copy & Add
          </button>
          <button
            onClick={() => {
              if (selection && image) {
                const crop = normalizeCrop(selection, image);
                if (crop.width > 1 && crop.height > 1) {
                  onApply(crop);
                  return;
                }
              }
              onApply({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight });
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <Check size={14} />
            Apply
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-[320px] overflow-hidden relative select-none bg-[#d9d6cf]"
        style={{ cursor: panningRef.current ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
      >
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
                  )`,
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

        <div className="absolute bottom-4 left-4 bg-[#fdfbf7] border-2 border-black text-black text-xs px-2 py-1 pointer-events-none">
          Drag to crop. Alt+Drag or Middle Click to Pan. Scroll to Zoom.
        </div>
      </div>
    </div>
  );
};
