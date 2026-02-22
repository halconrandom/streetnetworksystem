import React, { useState, useRef, useEffect } from 'react';
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
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (isOpen && overlay.dataUrl) {
            const img = new window.Image();
            img.onload = () => {
                setImage(img);
                // Initialize selection with existing crop or full image
                if (overlay.crop) {
                    setSelection(overlay.crop);
                } else {
                    setSelection({ x: 0, y: 0, width: img.width, height: img.height });
                }
            };
            img.src = overlay.dataUrl;
        }
    }, [isOpen, overlay]);

    // Render scaling but don't return early yet - hooks must run
    const maxWidth = 800; // Modal max width
    const maxHeight = 600; // Modal max height

    const imgWidth = image ? image.width : 1;
    const imgHeight = image ? image.height : 1;

    const scale = Math.min(1, maxWidth / imgWidth, maxHeight / imgHeight);
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;

    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (!isDragging || !dragStart || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const currentX = Math.max(0, Math.min(image.width, (e.clientX - rect.left) / scale));
            const currentY = Math.max(0, Math.min(image.height, (e.clientY - rect.top) / scale));

            const x = Math.min(dragStart.x, currentX);
            const y = Math.min(dragStart.y, currentY);
            const width = Math.abs(currentX - dragStart.x);
            const height = Math.abs(currentY - dragStart.y);

            setSelection({ x, y, width, height });
        };

        const handleWindowMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isDragging, dragStart, image, scale]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        // Prevent default to avoid text selection inside
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setDragStart({ x, y });
        setSelection({ x, y, width: 0, height: 0 });
        setIsDragging(true);
    };

    // Handlers removed from component scope since they are now in useEffect or not needed on div directly

    const handleConfirm = () => {
        if (selection && selection.width > 0 && selection.height > 0) {
            onConfirm(selection);
        } else {
            onConfirm(selection || { x: 0, y: 0, width: image.width, height: image.height });
        }
        onClose();
    };

    const handleReset = () => {
        setSelection({ x: 0, y: 0, width: image.width, height: image.height });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-4 max-w-5xl w-full flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-white font-semibold text-lg">Crop Image</div>

                <div
                    ref={containerRef}
                    className="relative border border-terminal-muted cursor-crosshair select-none overflow-hidden"
                    style={{ width: displayWidth, height: displayHeight }}
                    onMouseDown={handleMouseDown}
                >
                    <img
                        src={overlay.dataUrl}
                        className="w-full h-full object-contain pointer-events-none"
                    />
                    {selection && (
                        <div
                            className="absolute border-2 border-terminal-accent bg-terminal-accent/20"
                            style={{
                                left: selection.x * scale,
                                top: selection.y * scale,
                                width: selection.width * scale,
                                height: selection.height * scale
                            }}
                        />
                    )}
                </div>

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
