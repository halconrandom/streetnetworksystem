import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Eraser, Paintbrush, RotateCcw, X, Check, Undo2, ZoomIn, ZoomOut } from 'lucide-react';

type Props = {
    originalDataUrl: string;
    removedBgDataUrl: string;
    onApply: (result: string) => void;
    onCancel: () => void;
};

export const BgRemovalEditor: React.FC<Props> = ({
    originalDataUrl,
    removedBgDataUrl,
    onApply,
    onCancel,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImgRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [activeTool, setActiveTool] = useState<'erase' | 'restore'>('erase');
    const [brushSize, setBrushSize] = useState(20);
    const [scale, setScale] = useState(1);
    const [isReady, setIsReady] = useState(false);

    // Cursor: viewport coordinates (position: fixed) — unaffected by scroll or overflow
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    // Brush radius in screen pixels (accounts for zoom + canvas-to-display ratio)
    const [brushScreenRadius, setBrushScreenRadius] = useState(20);

    const isDrawingRef = useRef(false);
    const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

    // Undo history: stack of ImageData snapshots
    const undoStackRef = useRef<ImageData[]>([]);
    const [canUndoLocal, setCanUndoLocal] = useState(false);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const saveSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStackRef.current = [...undoStackRef.current.slice(-19), snapshot];
        setCanUndoLocal(true);
    }, []);

    /**
     * Convert a mouse event to canvas pixel coordinates.
     * getBoundingClientRect() already accounts for CSS transform: scale(), so
     * no manual scale factor is needed here.
     */
    const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    }, []);

    /**
     * Compute the brush radius in CSS screen pixels so the cursor circle
     * visually matches what gets painted on the canvas.
     * Must be called after any layout change (zoom, resize).
     */
    const computeBrushScreenRadius = useCallback((): number => {
        const canvas = canvasRef.current;
        if (!canvas) return brushSize;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return brushSize;
        return brushSize * (rect.width / canvas.width);
    }, [brushSize]);

    // ── Load image into canvas ─────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const removedImg = new Image();
        removedImg.onload = () => {
            canvas.width = removedImg.naturalWidth;
            canvas.height = removedImg.naturalHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(removedImg, 0, 0);
            setIsReady(true);
        };
        removedImg.src = removedBgDataUrl;

        const origImg = new Image();
        origImg.src = originalDataUrl;
        originalImgRef.current = origImg;
    }, [originalDataUrl, removedBgDataUrl]);

    // ── Painting ───────────────────────────────────────────────────────────────

    const paintAt = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        if (activeTool === 'erase') {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, brushSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fill();
            ctx.restore();
        } else {
            const orig = originalImgRef.current;
            if (!orig || !orig.complete) return;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, brushSize, 0, Math.PI * 2);
            ctx.clip();
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(orig, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }, [activeTool, brushSize]);

    // ── Mouse handlers on the canvas ──────────────────────────────────────────

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        isDrawingRef.current = true;
        const pos = toCanvasCoords(e.clientX, e.clientY);
        lastCanvasPosRef.current = pos;
        paintAt(pos.x, pos.y);
    }, [toCanvasCoords, paintAt]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const pos = toCanvasCoords(e.clientX, e.clientY);
        if (lastCanvasPosRef.current) {
            const dx = pos.x - lastCanvasPosRef.current.x;
            const dy = pos.y - lastCanvasPosRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.max(1, Math.floor(dist / (brushSize * 0.25)));
            for (let i = 1; i <= steps; i++) {
                paintAt(
                    lastCanvasPosRef.current.x + (dx * i) / steps,
                    lastCanvasPosRef.current.y + (dy * i) / steps,
                );
            }
        }
        lastCanvasPosRef.current = pos;
    }, [toCanvasCoords, paintAt, brushSize]);

    const handleMouseUp = useCallback(() => {
        if (isDrawingRef.current) saveSnapshot();
        isDrawingRef.current = false;
        lastCanvasPosRef.current = null;
    }, [saveSnapshot]);

    // ── Cursor tracking ───────────────────────────────────────────────────────
    // cursorPos stores raw viewport coordinates (clientX/Y) so the cursor div
    // can use position:fixed — immune to container scroll and overflow.
    // brushScreenRadius is recalculated on every mouse move so it's always fresh.

    const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
        setBrushScreenRadius(computeBrushScreenRadius());
    }, [computeBrushScreenRadius]);

    const handleContainerMouseLeave = useCallback(() => {
        setCursorPos(null);
    }, []);

    // Recalculate radius when brushSize or scale changes (canvas may have resized)
    useEffect(() => {
        setBrushScreenRadius(computeBrushScreenRadius());
    }, [brushSize, scale, isReady, computeBrushScreenRadius]);

    // ── Undo / Reset ──────────────────────────────────────────────────────────

    const handleUndoLocal = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || undoStackRef.current.length === 0) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const stack = [...undoStackRef.current];
        stack.pop();
        undoStackRef.current = stack;
        if (stack.length > 0) {
            ctx.putImageData(stack[stack.length - 1], 0, 0);
        } else {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = removedBgDataUrl;
            setCanUndoLocal(false);
        }
    }, [removedBgDataUrl]);

    const handleReset = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            undoStackRef.current = [];
            setCanUndoLocal(false);
        };
        img.src = removedBgDataUrl;
    }, [removedBgDataUrl]);

    const handleApply = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onApply(canvas.toDataURL('image/png'));
    }, [onApply]);

    // ── Zoom ──────────────────────────────────────────────────────────────────

    const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.25, 5)), []);
    const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.25, 0.25)), []);
    const zoomReset = useCallback(() => setScale(1), []);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndoLocal(); }
            if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'e') setActiveTool('erase');
            if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'r') setActiveTool('restore');
            if (!e.ctrlKey && !e.metaKey && (e.key === '+' || e.key === '=')) zoomIn();
            if (!e.ctrlKey && !e.metaKey && e.key === '-') zoomOut();
            if (!e.ctrlKey && !e.metaKey && e.key === '0') zoomReset();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndoLocal, zoomIn, zoomOut, zoomReset]);

    // Ctrl+Scroll zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handler = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) zoomIn(); else zoomOut();
            }
        };
        container.addEventListener('wheel', handler, { passive: false });
        return () => container.removeEventListener('wheel', handler);
    }, [zoomIn, zoomOut]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="flex flex-col bg-[#fdfbf7] border-4 border-black shadow-[8px_8px_0px_#000] w-[95vw] h-[95vh] max-w-[1920px]">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b-4 border-black bg-[#fdfbf7] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-xs uppercase tracking-widest">Background Eraser</span>
                        <span className="text-[10px] text-slate-400 border border-slate-200 px-2 py-0.5 font-mono">
                            [E] Borrar · [R] Restaurar · Ctrl+Z Undo · Ctrl+Scroll Zoom
                        </span>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-75"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-2 border-b-2 border-black bg-[#f4f1ea] flex-wrap flex-shrink-0">
                    <button
                        onClick={() => setActiveTool('erase')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all duration-75 ${
                            activeTool === 'erase'
                                ? 'bg-black text-white'
                                : 'bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                        }`}
                        title="[E]"
                    >
                        <Eraser size={12} /> Borrar
                    </button>
                    <button
                        onClick={() => setActiveTool('restore')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all duration-75 ${
                            activeTool === 'restore'
                                ? 'bg-violet-500 text-white'
                                : 'bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                        }`}
                        title="[R]"
                    >
                        <Paintbrush size={12} /> Restaurar
                    </button>

                    <div className="w-[2px] h-5 bg-black" />

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest">Pincel</span>
                        <input
                            type="range" min={2} max={100} value={brushSize}
                            onChange={e => setBrushSize(Number(e.target.value))}
                            className="w-28 accent-violet-500"
                        />
                        <span className="text-[10px] font-mono w-7 text-center bg-[#fdfbf7] border border-black px-1">{brushSize}px</span>
                    </div>

                    <div className="w-[2px] h-5 bg-black" />

                    <div className="flex items-center gap-1">
                        <button onClick={zoomOut} disabled={scale <= 0.25}
                            className="p-1.5 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        ><ZoomOut size={12} /></button>
                        <button onClick={zoomReset}
                            className="px-2 py-1 border-2 border-black text-[10px] font-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >{Math.round(scale * 100)}%</button>
                        <button onClick={zoomIn} disabled={scale >= 5}
                            className="p-1.5 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        ><ZoomIn size={12} /></button>
                    </div>

                    <div className="w-[2px] h-5 bg-black" />

                    <button onClick={handleUndoLocal} disabled={!canUndoLocal}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all duration-75 ${canUndoLocal ? 'bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none' : 'bg-[#f4f1ea] text-slate-300 cursor-not-allowed'}`}
                        title="Ctrl+Z"
                    ><Undo2 size={11} /> Undo</button>
                    <button onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-75"
                    ><RotateCcw size={11} /> Reset</button>

                    <div className="ml-auto flex gap-2">
                        <button onClick={onCancel}
                            className="px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-75"
                        >Cancelar</button>
                        <button onClick={handleApply} disabled={!isReady}
                            className="flex items-center gap-1.5 px-4 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest bg-yellow-300 shadow-[2px_2px_0px_#000] hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
                        ><Check size={12} /> Aplicar PNG</button>
                    </div>
                </div>

                {/* Canvas area */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto flex items-center justify-center min-h-0 relative"
                    style={{
                        background: 'repeating-conic-gradient(#d1d5db 0% 25%, #f9fafb 0% 50%) 0 0 / 20px 20px',
                        cursor: 'none',
                    }}
                    onMouseMove={handleContainerMouseMove}
                    onMouseLeave={handleContainerMouseLeave}
                >
                    {/* Loading spinner */}
                    {!isReady && (
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="text-xs font-mono">Cargando imagen...</span>
                        </div>
                    )}

                    {/* Cursor circle — position:fixed with viewport coords so scroll/overflow can't shift it */}
                    {isReady && cursorPos && (
                        <div
                            className="pointer-events-none rounded-full border-2"
                            style={{
                                position: 'fixed',
                                width: brushScreenRadius * 2,
                                height: brushScreenRadius * 2,
                                left: cursorPos.x - brushScreenRadius,
                                top: cursorPos.y - brushScreenRadius,
                                zIndex: 200,
                                borderColor: activeTool === 'erase' ? 'rgba(0,0,0,0.8)' : 'rgba(124,58,237,0.9)',
                                backgroundColor: activeTool === 'erase' ? 'rgba(0,0,0,0.08)' : 'rgba(167,139,250,0.15)',
                            }}
                        />
                    )}

                    {/* Canvas wrapper with zoom transform */}
                    <div
                        className="p-4"
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            display: isReady ? 'block' : 'none',
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleMouseUp}
                            className="block border-2 border-black shadow-[4px_4px_0px_#000]"
                            style={{ cursor: 'none' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
