import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Eraser, Paintbrush, RotateCcw, X, Check, Undo2, ZoomIn, ZoomOut,
    Circle, Square, SplitSquareHorizontal, Layers, HelpCircle,
} from 'lucide-react';

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
    const canvasRef        = useRef<HTMLCanvasElement>(null);
    const originalImgRef   = useRef<HTMLImageElement | null>(null);
    const containerRef     = useRef<HTMLDivElement>(null);
    const wrapperRef       = useRef<HTMLDivElement>(null); // scaled wrapper

    // ── Tool state ────────────────────────────────────────────────────────────
    const [activeTool,    setActiveTool]    = useState<'erase' | 'restore'>('erase');
    const [brushSize,     setBrushSize]     = useState(20);
    const [brushSoftness, setBrushSoftness] = useState(0);   // 0=hard … 1=fully soft
    const [brushShape,    setBrushShape]    = useState<'round' | 'square'>('round');
    const [scale,         setScale]         = useState(1);
    const [isReady,       setIsReady]       = useState(false);

    // ── Compare mode ──────────────────────────────────────────────────────────
    const [compareMode,   setCompareMode]   = useState(false);
    const [splitX,        setSplitX]        = useState(0.5); // fraction of canvas width
    const isDraggingDividerRef = useRef(false);

    // ── Onion skin ────────────────────────────────────────────────────────────
    const [onionSkin,     setOnionSkin]     = useState(false);
    const [onionOpacity,  setOnionOpacity]  = useState(0.35); // 0–1

    // ── Modal animation ───────────────────────────────────────────────────────
    const [mounted,   setMounted]   = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // One frame delay so the initial (hidden) state renders before we transition to visible
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    /** Runs the exit animation then calls the callback. */
    const animateClose = useCallback((cb: () => void) => {
        setIsClosing(true);
        const t = setTimeout(cb, 220);
        return () => clearTimeout(t);
    }, []);

    // ── Help modal ────────────────────────────────────────────────────────────
    const [showHelp, setShowHelp] = useState(false);

    // ── Cursor ────────────────────────────────────────────────────────────────
    const [cursorPos,         setCursorPos]         = useState<{ x: number; y: number } | null>(null);
    const [brushScreenRadius, setBrushScreenRadius] = useState(20);

    // ── Drawing state ─────────────────────────────────────────────────────────
    const isDrawingRef      = useRef(false);
    const lastCanvasPosRef  = useRef<{ x: number; y: number } | null>(null);

    // ── Undo ──────────────────────────────────────────────────────────────────
    const undoStackRef  = useRef<ImageData[]>([]);
    const [canUndoLocal, setCanUndoLocal] = useState(false);

    // ═════════════════════════════════════════════════════════════════════════
    // Load image
    // ═════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const removedImg = new Image();
        removedImg.onload = () => {
            canvas.width  = removedImg.naturalWidth;
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

    // ═════════════════════════════════════════════════════════════════════════
    // Coordinate helpers
    // ═════════════════════════════════════════════════════════════════════════

    /** Mouse event → canvas pixel coordinates. getBoundingClientRect already includes CSS transform. */
    const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width  / rect.width),
            y: (clientY - rect.top)  * (canvas.height / rect.height),
        };
    }, []);

    const computeBrushScreenRadius = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return brushSize;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return brushSize;
        return brushSize * (rect.width / canvas.width);
    }, [brushSize]);

    // ═════════════════════════════════════════════════════════════════════════
    // Painting
    // ═════════════════════════════════════════════════════════════════════════

    const paintAt = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const r        = brushSize;
        const hardness = 1 - brushSoftness;
        const inner    = r * hardness; // radius where 100% opacity starts

        ctx.save();

        if (activeTool === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';

            if (brushShape === 'square') {
                // Square — always hard edge
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            } else if (brushSoftness === 0) {
                // Round, hard
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fill();
            } else {
                // Round, soft — radial gradient fade
                const grad = ctx.createRadialGradient(x, y, inner, x, y, r);
                grad.addColorStop(0, 'rgba(0,0,0,1)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }

        } else {
            // Restore tool
            const orig = originalImgRef.current;
            if (!orig || !orig.complete) { ctx.restore(); return; }

            if (brushShape === 'square' || brushSoftness === 0) {
                // Hard edge — clip + drawImage
                ctx.beginPath();
                if (brushShape === 'square') {
                    ctx.rect(x - r, y - r, r * 2, r * 2);
                } else {
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                }
                ctx.clip();
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(orig, 0, 0, canvas.width, canvas.height);
            } else {
                // Soft round restore — paint on temp canvas then blend
                const bw = r * 2 + 2;
                const bh = r * 2 + 2;
                const tmp    = document.createElement('canvas');
                tmp.width    = bw;
                tmp.height   = bh;
                const tmpCtx = tmp.getContext('2d')!;

                // Stamp the original portion
                tmpCtx.drawImage(orig,
                    x - r - 1, y - r - 1, bw, bh,
                    0,         0,         bw, bh,
                );

                // Mask with radial gradient
                tmpCtx.globalCompositeOperation = 'destination-in';
                const cx   = bw / 2;
                const cy   = bh / 2;
                const grad = tmpCtx.createRadialGradient(cx, cy, inner, cx, cy, r);
                grad.addColorStop(0, 'rgba(0,0,0,1)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                tmpCtx.beginPath();
                tmpCtx.arc(cx, cy, r, 0, Math.PI * 2);
                tmpCtx.fillStyle = grad;
                tmpCtx.fill();

                // Blend onto working canvas
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(tmp, x - r - 1, y - r - 1);
            }
        }

        ctx.restore();
    }, [activeTool, brushSize, brushShape, brushSoftness]);

    // ═════════════════════════════════════════════════════════════════════════
    // Mouse handlers — canvas (painting)
    // ═════════════════════════════════════════════════════════════════════════

    const saveSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStackRef.current = [...undoStackRef.current.slice(-19), snap];
        setCanUndoLocal(true);
    }, []);

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (compareMode) return;
        isDrawingRef.current    = true;
        const pos = toCanvasCoords(e.clientX, e.clientY);
        lastCanvasPosRef.current = pos;
        paintAt(pos.x, pos.y);
    }, [compareMode, toCanvasCoords, paintAt]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const pos = toCanvasCoords(e.clientX, e.clientY);
        if (lastCanvasPosRef.current) {
            const dx    = pos.x - lastCanvasPosRef.current.x;
            const dy    = pos.y - lastCanvasPosRef.current.y;
            const dist  = Math.sqrt(dx * dx + dy * dy);
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
        isDrawingRef.current     = false;
        lastCanvasPosRef.current = null;
    }, [saveSnapshot]);

    // ═════════════════════════════════════════════════════════════════════════
    // Mouse handlers — container (cursor tracking + compare divider drag)
    // ═════════════════════════════════════════════════════════════════════════

    const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Cursor circle (position:fixed uses viewport coords directly)
        setCursorPos({ x: e.clientX, y: e.clientY });
        setBrushScreenRadius(computeBrushScreenRadius());

        // Compare divider drag
        if (isDraggingDividerRef.current) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect   = canvas.getBoundingClientRect();
            const newSplit = Math.max(0.01, Math.min(0.99,
                (e.clientX - rect.left) / rect.width,
            ));
            setSplitX(newSplit);
        }
    }, [computeBrushScreenRadius]);

    const handleContainerMouseLeave = useCallback(() => {
        setCursorPos(null);
        isDraggingDividerRef.current = false;
    }, []);

    const handleContainerMouseUp = useCallback(() => {
        isDraggingDividerRef.current = false;
        handleMouseUp();
    }, [handleMouseUp]);

    // ═════════════════════════════════════════════════════════════════════════
    // Recalculate brush screen radius on relevant changes
    // ═════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        setBrushScreenRadius(computeBrushScreenRadius());
    }, [brushSize, scale, isReady, computeBrushScreenRadius]);

    // ═════════════════════════════════════════════════════════════════════════
    // Undo / Reset
    // ═════════════════════════════════════════════════════════════════════════

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
            const img    = new Image();
            img.onload   = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
            img.src      = removedBgDataUrl;
            setCanUndoLocal(false);
        }
    }, [removedBgDataUrl]);

    const handleReset = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const img  = new Image();
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
        const dataUrl = canvas.toDataURL('image/png');
        animateClose(() => onApply(dataUrl));
    }, [onApply, animateClose]);

    const handleCancel = useCallback(() => {
        animateClose(onCancel);
    }, [onCancel, animateClose]);

    // ═════════════════════════════════════════════════════════════════════════
    // Zoom
    // ═════════════════════════════════════════════════════════════════════════

    const zoomIn    = useCallback(() => setScale(s => Math.min(+(s + 0.25).toFixed(2), 8)),   []);
    const zoomOut   = useCallback(() => setScale(s => Math.max(+(s - 0.25).toFixed(2), 0.25)), []);
    const zoomReset = useCallback(() => setScale(1), []);

    // ═════════════════════════════════════════════════════════════════════════
    // Keyboard shortcuts
    // ═════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndoLocal(); return; }
            if (e.ctrlKey || e.metaKey) return;
            if (e.key.toLowerCase() === 'e') setActiveTool('erase');
            if (e.key.toLowerCase() === 'r') setActiveTool('restore');
            if (e.key.toLowerCase() === 'b') { setCompareMode(m => !m); setOnionSkin(false); }
            if (e.key.toLowerCase() === 'o') { setOnionSkin(m => !m);   setCompareMode(false); }
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
            if (e.key === '0') zoomReset();
            if (e.key === '?') setShowHelp(m => !m);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndoLocal, zoomIn, zoomOut, zoomReset]);

    // Ctrl+Scroll zoom - allow vertical scroll when not holding Ctrl
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            if (e.deltaY < 0) zoomIn(); else zoomOut();
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [zoomIn, zoomOut]);

    // Ensure container can always scroll even when zoomed
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTop = 0;
    }, [scale]);

    // ═════════════════════════════════════════════════════════════════════════
    // Cursor shape (CSS) for the visual indicator
    // ═════════════════════════════════════════════════════════════════════════

    const cursorBorderRadius = brushShape === 'round' ? '50%' : '0%';
    const cursorColor        = activeTool === 'erase'
        ? { border: 'rgba(0,0,0,0.85)',   bg: 'rgba(0,0,0,0.06)'         }
        : { border: 'rgba(124,58,237,0.9)', bg: 'rgba(167,139,250,0.12)' };

    // ═════════════════════════════════════════════════════════════════════════
    // Shared button class helpers
    // ═════════════════════════════════════════════════════════════════════════

    const btn    = 'px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all duration-75 bg-[#fdfbf7] shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none';
    const btnSm  = 'p-1.5 border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-75';
    const active = 'translate-x-[2px] translate-y-[2px] shadow-none';

    // ═════════════════════════════════════════════════════════════════════════
    // Render helpers
    // ═════════════════════════════════════════════════════════════════════════

    const Row = ({ kbd, label, desc, color = 'bg-[#f4f1ea] text-black' }: {
        kbd: string; label: string; desc: string; color?: string;
    }) => (
        <div className="flex items-start gap-3">
            <span className={`inline-block shrink-0 font-mono font-black text-[9px] px-2 py-1 border-2 border-black shadow-[1px_1px_0px_#000] whitespace-nowrap ${color}`}>
                {kbd}
            </span>
            <div>
                <span className="font-black">{label}</span>
                <span className="text-slate-500 ml-1.5">{desc}</span>
            </div>
        </div>
    );

    // ═════════════════════════════════════════════════════════════════════════
    // Render
    // ═════════════════════════════════════════════════════════════════════════

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                background:  'rgba(0,0,0,0.9)',
                opacity:     mounted && !isClosing ? 1 : 0,
                transition:  'opacity 220ms ease',
            }}
        >
            <div
                className="relative flex flex-col bg-[#fdfbf7] border-4 border-black shadow-[8px_8px_0px_#000] w-[95vw] h-[95vh] max-w-[1920px]"
                style={{
                    opacity:    mounted && !isClosing ? 1 : 0,
                    marginTop:  mounted && !isClosing ? '0px' : '16px',
                    transition: 'opacity 220ms ease, margin-top 220ms cubic-bezier(0.22,1,0.36,1)',
                }}
            >

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b-4 border-black bg-[#fdfbf7] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-xs uppercase tracking-widest">Background Eraser</span>
                        <span className="hidden sm:block text-[10px] text-slate-400 border border-slate-200 px-2 py-0.5 font-mono">
                            [E] Borrar · [R] Restaurar · [O] Cebolla · [B] Comparar · Ctrl+Z Undo · Ctrl+Scroll Zoom
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setShowHelp(m => !m)}
                            className={`${btnSm} ${showHelp ? `bg-black text-white ${active}` : ''}`}
                            title="Ayuda y shortcuts [?]"
                        >
                            <HelpCircle size={14} />
                        </button>
                        <button onClick={handleCancel} className={btnSm}>
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* ── Toolbar ────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black bg-[#f4f1ea] flex-wrap flex-shrink-0">

                    {/* Tools */}
                    <button onClick={() => setActiveTool('erase')}
                        className={`${btn} flex items-center gap-1.5 ${activeTool === 'erase' ? `bg-black text-white ${active}` : ''}`}
                        title="[E]"
                    ><Eraser size={12} /> Borrar</button>

                    <button onClick={() => setActiveTool('restore')}
                        className={`${btn} flex items-center gap-1.5 ${activeTool === 'restore' ? `bg-violet-500 text-white ${active}` : ''}`}
                        title="[R]"
                    ><Paintbrush size={12} /> Restaurar</button>

                    <div className="w-[2px] h-5 bg-black/30" />

                    {/* Brush size */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tamaño</span>
                        <input type="range" min={2} max={150} value={brushSize}
                            onChange={e => setBrushSize(Number(e.target.value))}
                            className="w-24 accent-violet-500"
                        />
                        <span className="text-[10px] font-mono w-8 text-center bg-[#fdfbf7] border border-black px-1">{brushSize}</span>
                    </div>

                    <div className="w-[2px] h-5 bg-black/30" />

                    {/* Brush softness (blur) — only round */}
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${brushShape === 'square' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Blur
                        </span>
                        <input type="range" min={0} max={100} value={Math.round(brushSoftness * 100)}
                            disabled={brushShape === 'square'}
                            onChange={e => setBrushSoftness(Number(e.target.value) / 100)}
                            className="w-20 accent-violet-500 disabled:opacity-30"
                        />
                        <span className={`text-[10px] font-mono w-8 text-center bg-[#fdfbf7] border border-black px-1 ${brushShape === 'square' ? 'opacity-30' : ''}`}>
                            {Math.round(brushSoftness * 100)}%
                        </span>
                    </div>

                    <div className="w-[2px] h-5 bg-black/30" />

                    {/* Brush shape */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => setBrushShape('round')}
                            className={`${btnSm} flex items-center gap-1 px-2 ${brushShape === 'round' ? `bg-black text-white ${active}` : ''}`}
                            title="Redondo"
                        ><Circle size={12} /></button>
                        <button onClick={() => setBrushShape('square')}
                            className={`${btnSm} flex items-center gap-1 px-2 ${brushShape === 'square' ? `bg-black text-white ${active}` : ''}`}
                            title="Cuadrado"
                        ><Square size={12} /></button>
                    </div>

                    <div className="w-[2px] h-5 bg-black/30" />

                    {/* Zoom */}
                    <div className="flex items-center gap-1">
                        <button onClick={zoomOut}  disabled={scale <= 0.25} className={`${btnSm} disabled:opacity-30 disabled:cursor-not-allowed`}><ZoomOut  size={12} /></button>
                        <button onClick={zoomReset} className={`${btn} px-2 py-1`}>{Math.round(scale * 100)}%</button>
                        <button onClick={zoomIn}   disabled={scale >= 8}    className={`${btnSm} disabled:opacity-30 disabled:cursor-not-allowed`}><ZoomIn   size={12} /></button>
                    </div>

                    <div className="w-[2px] h-5 bg-black/30" />

                    {/* Undo / Reset */}
                    <button onClick={handleUndoLocal} disabled={!canUndoLocal}
                        className={`${btn} flex items-center gap-1.5 ${!canUndoLocal ? 'opacity-30 cursor-not-allowed shadow-none' : ''}`}
                        title="Ctrl+Z"
                    ><Undo2 size={11} /> Undo</button>

                    <button onClick={handleReset}
                        className={`${btn} flex items-center gap-1.5`}
                    ><RotateCcw size={11} /> Reset</button>

                    {/* Right side actions */}
                    <div className="ml-auto flex items-center gap-2">
                        {/* Onion skin [O] */}
                        <button
                            onClick={() => { setOnionSkin(m => !m); setCompareMode(false); }}
                            className={`${btn} flex items-center gap-1.5 ${onionSkin ? `bg-amber-400 text-black border-black ${active}` : ''}`}
                            title="[O] Máscara de cebolla — muestra el original como guía"
                        >
                            <Layers size={12} /> Cebolla
                        </button>

                        {/* Onion opacity — only when active */}
                        {onionSkin && (
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="range" min={5} max={90} step={5}
                                    value={Math.round(onionOpacity * 100)}
                                    onChange={e => setOnionOpacity(Number(e.target.value) / 100)}
                                    className="w-20 accent-amber-500"
                                    title="Opacidad del fantasma"
                                />
                                <span className="text-[10px] font-mono w-8 text-center bg-[#fdfbf7] border border-black px-1">
                                    {Math.round(onionOpacity * 100)}%
                                </span>
                            </div>
                        )}

                        <div className="w-[2px] h-5 bg-black/30" />

                        {/* Before/After compare [B] */}
                        <button
                            onClick={() => { setCompareMode(m => !m); setOnionSkin(false); }}
                            className={`${btn} flex items-center gap-1.5 ${compareMode ? `bg-sky-500 text-white border-black ${active}` : ''}`}
                            title="[B] Comparar antes/después"
                        >
                            <SplitSquareHorizontal size={12} /> Comparar
                        </button>

                        <div className="w-[2px] h-5 bg-black/30" />

                        <button onClick={handleCancel} className={btn}>Cancelar</button>
                        <button onClick={handleApply} disabled={!isReady}
                            className={`${btn} flex items-center gap-1.5 bg-yellow-300 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                        ><Check size={12} /> Aplicar PNG</button>
                    </div>
                </div>

                {/* ── Canvas area ────────────────────────────────────────── */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto flex items-center justify-center min-h-0 relative select-none"
                    style={{
                        background: 'repeating-conic-gradient(#d1d5db 0% 25%, #f9fafb 0% 50%) 0 0 / 20px 20px',
                        cursor: compareMode ? 'default' : 'none',
                    }}
                    onMouseMove={handleContainerMouseMove}
                    onMouseLeave={handleContainerMouseLeave}
                    onMouseUp={handleContainerMouseUp}
                >
                    {/* Loading */}
                    {!isReady && (
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="text-xs font-mono">Cargando imagen...</span>
                        </div>
                    )}

                    {/* Brush cursor (position:fixed — immune to scroll/overflow) */}
                    {isReady && !compareMode && cursorPos && (
                        <div
                            className="pointer-events-none border-2"
                            style={{
                                position: 'fixed',
                                width:  brushScreenRadius * 2,
                                height: brushScreenRadius * 2,
                                left:   cursorPos.x - brushScreenRadius,
                                top:    cursorPos.y - brushScreenRadius,
                                zIndex: 200,
                                borderRadius:    cursorBorderRadius,
                                borderColor:     cursorColor.border,
                                backgroundColor: cursorColor.bg,
                            }}
                        />
                    )}

                    {/* Scaled canvas wrapper */}
                    <div
                        ref={wrapperRef}
                        style={{
                            transform:       `scale(${scale})`,
                            transformOrigin: 'center center',
                            display:         isReady ? 'inline-block' : 'none',
                            margin:          '16px', // replaces p-4 so the shadow is visible
                        }}
                    >
                        {/*
                         * Inner relative container sized exactly to the canvas.
                         * All overlays (img, divider, labels) are absolute children
                         * of this div, so they always align pixel-perfect with the canvas
                         * regardless of canvas pixel dimensions or CSS zoom.
                         */}
                        <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
                            {/* Working canvas */}
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleMouseUp}
                                className="border-2 border-black shadow-[4px_4px_0px_#000]"
                                style={{ cursor: 'none', display: 'block' }}
                            />

                            {/* ── Onion skin overlay ──────────────────── */}
                            {onionSkin && (
                                <img
                                    src={originalDataUrl}
                                    alt="onion"
                                    draggable={false}
                                    style={{
                                        position:      'absolute',
                                        inset:         0,
                                        width:         '100%',
                                        height:        '100%',
                                        objectFit:     'fill',
                                        opacity:       onionOpacity,
                                        pointerEvents: 'none',
                                        userSelect:    'none',
                                        mixBlendMode:  'normal',
                                    }}
                                />
                            )}

                            {/* ── Before/After split overlay ──────────── */}
                            {compareMode && (
                                <>
                                    {/* Original image — same box as canvas, clipped to left of divider */}
                                    <img
                                        src={originalDataUrl}
                                        alt="before"
                                        draggable={false}
                                        style={{
                                            position:      'absolute',
                                            inset:         0,
                                            width:         '100%',
                                            height:        '100%',
                                            objectFit:     'fill',
                                            clipPath:      `polygon(0 0, ${splitX * 100}% 0, ${splitX * 100}% 100%, 0 100%)`,
                                            pointerEvents: 'none',
                                            userSelect:    'none',
                                        }}
                                    />

                                    {/* Label: Antes */}
                                    <div
                                        style={{
                                            position:      'absolute',
                                            top:           8,
                                            right:         `${(1 - splitX) * 100}%`,
                                            marginRight:   6,
                                            pointerEvents: 'none',
                                        }}
                                        className="bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-1"
                                    >Antes</div>

                                    {/* Label: Después */}
                                    <div
                                        style={{
                                            position:      'absolute',
                                            top:           8,
                                            left:          `${splitX * 100}%`,
                                            marginLeft:    6,
                                            pointerEvents: 'none',
                                        }}
                                        className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 border-2 border-black"
                                    >Después</div>

                                    {/* Draggable divider line */}
                                    <div
                                        style={{
                                            position:   'absolute',
                                            top:        0,
                                            bottom:     0,
                                            left:       `${splitX * 100}%`,
                                            transform:  'translateX(-50%)',
                                            width:      3,
                                            background: 'white',
                                            boxShadow:  '0 0 0 1.5px black',
                                            cursor:     'ew-resize',
                                            zIndex:     20,
                                        }}
                                        onMouseDown={e => { isDraggingDividerRef.current = true; e.stopPropagation(); }}
                                    >
                                        {/* Knob */}
                                        <div style={{
                                            position:        'absolute',
                                            top:             '50%',
                                            left:            '50%',
                                            transform:       'translate(-50%, -50%)',
                                            width:           26,
                                            height:          26,
                                            background:      'white',
                                            border:          '2px solid black',
                                            borderRadius:    '50%',
                                            display:         'flex',
                                            alignItems:      'center',
                                            justifyContent:  'center',
                                            gap:             3,
                                        }}>
                                            <div style={{ width: 2, height: 11, background: 'black', borderRadius: 1 }} />
                                            <div style={{ width: 2, height: 11, background: 'black', borderRadius: 1 }} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Help modal ─────────────────────────────────────────── */}
                {showHelp && (
                    <div
                        className="absolute inset-0 z-[300] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.55)' }}
                        onClick={() => setShowHelp(false)}
                    >
                        <div
                            className="bg-[#fdfbf7] border-4 border-black shadow-[8px_8px_0px_#000] w-full max-w-lg mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b-4 border-black bg-[#f4f1ea]">
                                <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <HelpCircle size={14} /> Atajos y Herramientas
                                </span>
                                <button onClick={() => setShowHelp(false)} className={btnSm}><X size={13} /></button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-5 text-[11px]">

                                {/* Tools */}
                                <section>
                                    <p className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-2">Herramientas</p>
                                    <div className="space-y-1.5">
                                        <Row kbd="E" label="Borrar" desc="Elimina píxeles del fondo con el pincel activo." color="bg-black text-white" />
                                        <Row kbd="R" label="Restaurar" desc="Recupera píxeles del original para corregir errores." color="bg-violet-500 text-white" />
                                    </div>
                                </section>

                                {/* Brush */}
                                <section>
                                    <p className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-2">Pincel</p>
                                    <div className="space-y-1.5">
                                        <Row kbd="Tamaño" label="Slider" desc="Controla el radio del pincel en píxeles de imagen." />
                                        <Row kbd="Blur" label="Slider" desc="Suaviza el borde del pincel (0 = duro, 100 = muy difuminado). Solo en modo redondo." />
                                        <Row kbd="○ / □" label="Forma" desc="Alterna entre pincel redondo y cuadrado." />
                                    </div>
                                </section>

                                {/* View */}
                                <section>
                                    <p className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-2">Vista</p>
                                    <div className="space-y-1.5">
                                        <Row kbd="O" label="Cebolla" desc="Superpone la imagen original semitransparente para pintar con mayor precisión." color="bg-amber-400 text-black" />
                                        <Row kbd="B" label="Comparar" desc="Divide la pantalla en Antes / Después con un divisor arrastrable." color="bg-sky-500 text-white" />
                                        <Row kbd="+ / -" label="Zoom" desc="Acerca o aleja la vista del canvas." />
                                        <Row kbd="0" label="Reset zoom" desc="Restaura el zoom al 100%." />
                                        <Row kbd="Ctrl+Scroll" label="Zoom rápido" desc="Rueda del ratón mientras se mantiene Ctrl." />
                                    </div>
                                </section>

                                {/* History */}
                                <section>
                                    <p className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-2">Historial</p>
                                    <div className="space-y-1.5">
                                        <Row kbd="Ctrl+Z" label="Deshacer" desc="Revierte el último trazo. Historial de hasta 20 pasos." />
                                        <Row kbd="Reset" label="Botón" desc="Descarta todos los cambios y vuelve al resultado de IA original." />
                                    </div>
                                </section>

                                <p className="text-[9px] text-slate-400 border-t border-slate-200 pt-3">
                                    Pulsa <kbd className="bg-[#f4f1ea] border border-black px-1 font-mono">?</kbd> o haz clic fuera de este panel para cerrar.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
