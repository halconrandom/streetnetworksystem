import React, { useRef, useState, useEffect } from 'react';
import { OverlayImage } from './types';
import { ZoomIn, ZoomOut, Maximize, Move, Check, Copy } from '@/components/Icons';

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
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef<{ x: number; y: number } | null>(null);

    // Selection Drag state
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionStart = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (overlay.dataUrl) {
            const img = new window.Image();
            img.onload = () => {
                setImage(img);
                // Initial fit
                const scaleX = (containerWidth - 100) / img.width;
                const scaleY = (containerHeight - 100) / img.height;
                const fitScale = Math.min(scaleX, scaleY, 1);
                setZoom(fitScale);
                setPan({
                    x: (containerWidth - img.width * fitScale) / 2,
                    y: (containerHeight - img.height * fitScale) / 2
                });

                if (overlay.crop) {
                    setSelection(overlay.crop);
                } else {
                    setSelection({ x: 0, y: 0, width: img.width, height: img.height });
                }
            };
            img.src = overlay.dataUrl;
        }
    }, [overlay.dataUrl]);

    // Handle Pan
    const handlePanStart = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Click
            e.preventDefault();
            setIsPanning(true);
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        } else if (e.button === 0 && !e.altKey) {
            handleSelectionStart(e);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && panStart.current) {
            setPan({
                x: e.clientX - panStart.current.x,
                y: e.clientY - panStart.current.y
            });
        } else if (isSelecting && selectionStart.current && image) {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            // Calculate mouse pos relative to image origin (top-left of image at current pan/zoom)
            // Mouse relative to container = e.clientX - rect.left
            // Image Origin in container = pan.x, pan.y
            // Mouse relative to Image = (MouseContainer - Pan) / Zoom

            const mouseXInImage = (e.clientX - rect.left - pan.x) / zoom;
            const mouseYInImage = (e.clientY - rect.top - pan.y) / zoom;

            const startX = selectionStart.current.x;
            const startY = selectionStart.current.y;

            // Clamp to image bounds
            const currentX = Math.max(0, Math.min(image.width, mouseXInImage));
            const currentY = Math.max(0, Math.min(image.height, mouseYInImage));

            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const w = Math.abs(currentX - startX);
            const h = Math.abs(currentY - startY);

            setSelection({ x, y, width: w, height: h });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setIsSelecting(false);
    };

    // Handle Selection
    const handleSelectionStart = (e: React.MouseEvent) => {
        if (!containerRef.current || !image) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseXInImage = (e.clientX - rect.left - pan.x) / zoom;
        const mouseYInImage = (e.clientY - rect.top - pan.y) / zoom;

        // Only start if within image bounds roughly (or allow outside to start 0)
        selectionStart.current = { x: mouseXInImage, y: mouseYInImage };
        setSelection({ x: mouseXInImage, y: mouseYInImage, width: 0, height: 0 });
        setIsSelecting(true);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
        const boundedZoom = Math.min(5, Math.max(0.1, newZoom));

        // Zoom towards mouse pointer logic could be added here, for now center zoom or simpler
        // Simple zoom update:
        setZoom(boundedZoom);
    };

    if (!image) return <div className="text-white">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-terminal-black">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border bg-terminal-panel">
                <div className="flex items-center gap-4">
                    <span className="text-white font-semibold">Editing Crop: {overlay.name}</span>
                    <div className="flex items-center gap-1 bg-terminal-dark rounded-md p-1 border border-terminal-border">
                        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 hover:text-white text-terminal-muted"><ZoomOut size={16} /></button>
                        <span className="text-xs text-white min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1 hover:text-white text-terminal-muted"><ZoomIn size={16} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide border border-terminal-border text-terminal-muted hover:text-white rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selection && onSaveAsCopy(selection)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-md"
                    >
                        <Copy size={16} />
                        Save Copy & Add
                    </button>
                    <button
                        onClick={() => selection && onApply(selection)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-accent text-black hover:bg-terminal-accent/90 rounded-md"
                    >
                        <Check size={16} />
                        Apply
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative select-none cursor-crosshair bg-[url('/grid-pattern.png')]" // You might need a grid or neutral bg
                onMouseDown={handlePanStart}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        width: image.width,
                        height: image.height,
                        position: 'absolute'
                    }}
                >
                    <img
                        src={overlay.dataUrl}
                        className="pointer-events-none"
                        style={{ width: '100%', height: '100%' }}
                    />

                    {/* Darken overlay outside selection */}
                    {selection && (
                        <>
                            <div className="absolute inset-0 bg-black/50"
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
                                    height: selection.height
                                }}
                            />
                        </>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs p-2 rounded pointer-events-none">
                    Drag to crop. Alt+Drag or Middle Click to Pan. Scroll to Zoom.
                </div>
            </div>
        </div>
    );
};
