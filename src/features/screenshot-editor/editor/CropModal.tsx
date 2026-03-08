import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OverlayImage } from './types';

type CropModalProps = {
  overlay: OverlayImage;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (crop: { x: number; y: number; width: number; height: number }) => void;
};

export const CropModal: React.FC<CropModalProps> = ({ overlay, isOpen, onClose, onConfirm }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Use refs for drag state so window-level handlers see updates immediately
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  // Keep image and scale in refs for use in window-level handlers
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);

  // Load image when modal opens
  useEffect(() => {
    if (!isOpen || !overlay.dataUrl) {
      setImage(null);
      imageRef.current = null;
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      imageRef.current = img;
      // Initialize selection with existing crop or full image
      if (overlay.crop) {
        setSelection(overlay.crop);
      } else {
        setSelection({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = () => {
      console.error('CropModal: Failed to load overlay image');
    };
    img.src = overlay.dataUrl;
  }, [isOpen, overlay.dataUrl, overlay.crop]);

  // Compute display scale
  const maxWidth = 800;
  const maxHeight = 600;
  const imgWidth = image ? image.naturalWidth : 1;
  const imgHeight = image ? image.naturalHeight : 1;
  const scale = Math.min(1, maxWidth / imgWidth, maxHeight / imgHeight);
  const displayWidth = imgWidth * scale;
  const displayHeight = imgHeight * scale;

  // Keep scale ref in sync
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Window-level mouse handlers for reliable drag tracking
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !dragStartRef.current || !containerRef.current || !imageRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentScale = scaleRef.current;
      const img = imageRef.current;

      const currentX = Math.max(0, Math.min(img.naturalWidth, (e.clientX - rect.left) / currentScale));
      const currentY = Math.max(0, Math.min(img.naturalHeight, (e.clientY - rect.top) / currentScale));

      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;

      setSelection({
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY),
      });
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !image) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(image.naturalWidth, (e.clientX - rect.left) / scale));
    const y = Math.max(0, Math.min(image.naturalHeight, (e.clientY - rect.top) / scale));

    dragStartRef.current = { x, y };
    draggingRef.current = true;
    setSelection({ x, y, width: 0, height: 0 });
  }, [image, scale]);

  const handleConfirm = useCallback(() => {
    if (selection && selection.width > 1 && selection.height > 1) {
      onConfirm(selection);
    } else if (image) {
      onConfirm({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight });
    }
    onClose();
  }, [selection, image, onConfirm, onClose]);

  const handleReset = useCallback(() => {
    if (image) {
      setSelection({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight });
    }
  }, [image]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-4 max-w-5xl w-full flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-white font-semibold text-lg">Crop Image</div>

        {!image ? (
          <div className="flex items-center justify-center text-white/50 text-sm py-12">
            Loading image…
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className="relative border border-terminal-muted cursor-crosshair select-none overflow-hidden"
              style={{ width: displayWidth, height: displayHeight }}
              onMouseDown={handleMouseDown}
            >
              <img
                src={overlay.dataUrl}
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
              {selection && selection.width > 0 && selection.height > 0 && (
                <div
                  className="absolute border-2 border-terminal-accent bg-terminal-accent/20 pointer-events-none"
                  style={{
                    left: selection.x * scale,
                    top: selection.y * scale,
                    width: selection.width * scale,
                    height: selection.height * scale,
                  }}
                />
              )}
            </div>

            {selection && selection.width > 0 && selection.height > 0 && (
              <div className="text-xs text-terminal-muted font-mono">
                Selection: {Math.round(selection.width)} × {Math.round(selection.height)} px
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-4 w-full justify-end pt-4 border-t border-terminal-border">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-semibold text-terminal-muted hover:text-white transition-colors"
          >
            Reset (Full Image)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-terminal-border text-terminal-muted hover:bg-terminal-border/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-terminal-accent text-black hover:bg-terminal-accent/90 transition-colors"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};
