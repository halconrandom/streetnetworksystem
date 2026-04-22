import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
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
    const [canvasNaturalSize, setCanvasNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [isReady,       setIsReady]       = useState(false);
    const cursorCircleRef = useRef<HTMLDivElement>(null);

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
            setCanvasNaturalSize({ width: removedImg.naturalWidth, height: removedImg.naturalHeight });
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
        // Update state only once to show/hide
        if (!cursorPos) {
            setCursorPos({ x: e.clientX, y: e.clientY });
        }

        // Direct DOM update for the cursor circle to ensure 1:1 synchronization with the mouse
        if (cursorCircleRef.current) {
            const circle = cursorCircleRef.current;
            circle.style.left = `${e.clientX - brushScreenRadius}px`;
            circle.style.top  = `${e.clientY - brushScreenRadius}px`;
        }

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

    // (removed broken scrollTop=0 reset — explicit DOM sizing handles scroll correctly)

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

    const btn    = 'px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 hover:bg-white/10 active:scale-[0.98] text-white/60 hover:text-white rounded-md flex items-center gap-2';
    const btnSm  = 'p-2 bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 active:scale-[0.98] text-white/60 hover:text-white rounded-md';
    const active = 'bg-[#ff003c]/10 border-[#ff003c]/40 text-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.1)]';

    // ═════════════════════════════════════════════════════════════════════════
    // Render helpers
    // ═════════════════════════════════════════════════════════════════════════

    const Row = ({ kbd, label, desc, color = 'bg-white/5 text-white/50 border-white/10' }: {
        kbd: string; label: string; desc: string; color?: string;
    }) => (
        <div className="flex items-center gap-3">
            <span className={`inline-block shrink-0 font-mono font-bold text-[9px] px-2 py-1 border rounded uppercase tracking-wider ${color}`}>
                {kbd}
            </span>
            <div className="flex flex-col">
                <span className="font-bold text-white/80">{label}</span>
                <span className="text-white/20 text-[9px] uppercase tracking-widest">{desc}</span>
            </div>
        </div>
    );

    // ═════════════════════════════════════════════════════════════════════════
    // Render
    // ═════════════════════════════════════════════════════════════════════════

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
            style={{
                background:  'rgba(0,0,0,0.85)',
                opacity:     mounted && !isClosing ? 1 : 0,
                transition:  'opacity 220ms ease',
            }}
        >
            <div
                className="relative flex flex-col bg-[#0a0a0a] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-[95vw] h-[95vh] max-w-[1920px] rounded-xl overflow-hidden font-mono"
                style={{
                    opacity:    mounted && !isClosing ? 1 : 0,
                    transform:  mounted && !isClosing ? 'scale(1)' : 'scale(0.98)',
                    transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1)',
                }}
            >

                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0d0d] flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#ff003c]/10 border border-[#ff003c]/20 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,60,0.1)]">
                            <Eraser size={16} className="text-[#ff003c]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-white">Background Eraser</span>
                            <span className="hidden sm:block text-[8px] text-white/30 uppercase tracking-[0.1em]">
                                [E] Erase · [R] Restore · [O] Onion · [B] Compare · Ctrl+Z Undo
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHelp(m => !m)}
                            className={`${btnSm} ${showHelp ? active : ''}`}
                            title="Help & Shortcuts [?]"
                        >
                            <HelpCircle size={14} />
                        </button>
                        <button onClick={handleCancel} className={btnSm}>
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-[#0a0a0a] flex-wrap flex-shrink-0">

                    {/* Tools */}
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setActiveTool('erase')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTool === 'erase' ? 'bg-[#ff003c] text-white shadow-[0_0_15px_rgba(255,0,60,0.3)]' : 'text-white/40 hover:text-white/70'}`}
                            title="[E]"
                        >Erase</button>
                        <button onClick={() => setActiveTool('restore')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTool === 'restore' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-white/40 hover:text-white/70'}`}
                            title="[R]"
                        >Restore</button>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10" />

                    {/* Brush size */}
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Size</span>
                        <input type="range" min={2} max={150} value={brushSize}
                            onChange={e => setBrushSize(Number(e.target.value))}
                            className="w-24 accent-[#ff003c]"
                        />
                        <span className="text-[10px] font-mono w-10 py-1 text-center bg-white/5 border border-white/10 rounded text-[#ff003c]">{brushSize}</span>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10" />

                    {/* Brush softness (blur) — only round */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${brushShape === 'square' ? 'text-white/10' : 'text-white/30'}`}>
                            Blur
                        </span>
                        <input type="range" min={0} max={100} value={Math.round(brushSoftness * 100)}
                            disabled={brushShape === 'square'}
                            onChange={e => setBrushSoftness(Number(e.target.value) / 100)}
                            className="w-20 accent-[#ff003c] disabled:opacity-10"
                        />
                        <span className={`text-[10px] font-mono w-10 py-1 text-center bg-white/5 border border-white/10 rounded text-[#ff003c] ${brushShape === 'square' ? 'opacity-10' : ''}`}>
                            {Math.round(brushSoftness * 100)}%
                        </span>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10" />

                    {/* Brush shape */}
                    <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setBrushShape('round')}
                            className={`p-1.5 rounded-md transition-all ${brushShape === 'round' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                            title="Round"
                        ><Circle size={14} /></button>
                        <button onClick={() => setBrushShape('square')}
                            className={`p-1.5 rounded-md transition-all ${brushShape === 'square' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                            title="Square"
                        ><Square size={14} /></button>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10" />

                    {/* Zoom */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                        <button onClick={zoomOut} disabled={scale <= 0.25} className="p-1.5 rounded-md text-white/40 hover:text-white/80 disabled:opacity-10"><ZoomOut size={14} /></button>
                        <button onClick={zoomReset} className="px-2 text-[10px] font-bold text-white/70 hover:text-white">{Math.round(scale * 100)}%</button>
                        <button onClick={zoomIn} disabled={scale >= 8} className="p-1.5 rounded-md text-white/40 hover:text-white/80 disabled:opacity-10"><ZoomIn size={14} /></button>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10" />

                    {/* Undo / Reset */}
                    <button onClick={handleUndoLocal} disabled={!canUndoLocal}
                        className={`${btn} ${!canUndoLocal ? 'opacity-20 cursor-not-allowed' : ''}`}
                        title="Ctrl+Z"
                    ><Undo2 size={12} /> Undo</button>

                    <button onClick={handleReset}
                        className={btn}
                    ><RotateCcw size={12} /> Reset</button>

                    {/* Right side actions */}
                    <div className="ml-auto flex items-center gap-3">
                        {/* Onion skin [O] */}
                        <button
                            onClick={() => { setOnionSkin(m => !m); setCompareMode(false); }}
                            className={`${btn} ${onionSkin ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}`}
                            title="[O] Onion Mask"
                        >
                            <Layers size={14} /> Onion
                        </button>

                        {/* Onion opacity — only when active */}
                        {onionSkin && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="range" min={5} max={90} step={5}
                                    value={Math.round(onionOpacity * 100)}
                                    onChange={e => setOnionOpacity(Number(e.target.value) / 100)}
                                    className="w-16 accent-amber-500"
                                />
                                <span className="text-[10px] font-mono text-amber-500/70">{Math.round(onionOpacity * 100)}%</span>
                            </div>
                        )}

                        <div className="w-[1px] h-6 bg-white/10" />

                        {/* Before/After compare [B] */}
                        <button
                            onClick={() => { setCompareMode(m => !m); setOnionSkin(false); }}
                            className={`${btn} ${compareMode ? 'bg-sky-500/20 border-sky-500/40 text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : ''}`}
                            title="[B] Compare Before/After"
                        >
                            <SplitSquareHorizontal size={14} /> Compare
                        </button>

                        <div className="w-[1px] h-6 bg-white/10" />

                        <button onClick={handleCancel} className={btn}>Cancel</button>
                        <button onClick={handleApply} disabled={!isReady}
                            className="px-6 py-2 bg-[#ff003c] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-md transition-all hover:bg-[#ff003c]/90 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(255,0,60,0.2)] flex items-center gap-2"
                        ><Check size={14} /> Apply PNG</button>
                    </div>
                </div>

                {/* ── Canvas area ────────────────────────────────────────── */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto min-h-0 relative select-none"
                    style={{
                        background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #050505 0% 50%) 0 0 / 32px 32px',
                        cursor: compareMode ? 'default' : 'none',
                    }}
                    onMouseMove={handleContainerMouseMove}
                    onMouseLeave={handleContainerMouseLeave}
                    onMouseUp={handleContainerMouseUp}
                >
                    {/* Brush cursor (position:fixed — immune to scroll/overflow) */}
                    {isReady && !compareMode && cursorPos && (
                        <div
                            ref={cursorCircleRef}
                            className="pointer-events-none border-2 fixed"
                            style={{
                                width:  brushScreenRadius * 2,
                                height: brushScreenRadius * 2,
                                zIndex: 200,
                                borderRadius:    brushShape === 'round' ? '50%' : '2px',
                                boxSizing:       'border-box',
                                borderColor:     activeTool === 'erase' ? '#ff003c' : '#4f46e5',
                                backgroundColor: activeTool === 'erase' ? 'rgba(255,0,60,0.1)' : 'rgba(79,70,229,0.1)',
                                boxShadow:       `0 0 10px ${activeTool === 'erase' ? 'rgba(255,0,60,0.2)' : 'rgba(79,70,229,0.2)'}`,
                            }}
                        />
                    )}

                    {/*
                     * Inner centering div: centers the canvas when it fits inside the container.
                     * min-h-full / min-w-full ensure it always fills the scroll area, so flex
                     * centering works correctly without creating inaccessible top/left overflow.
                     */}
                    <div className="min-h-full min-w-full flex items-center justify-center p-4">
                    {/* Loading */}
                    {!isReady && (
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="text-xs font-mono">Cargando imagen...</span>
                        </div>
                    )}
                    {/* Canvas wrapper: explicit DOM dimensions (naturalSize × scale) so the
                        scroll container always knows the true scrollable area. This replaces
                        the old CSS transform: scale() approach which did not affect DOM layout
                        and made the top of the canvas unreachable when zoomed in. */}
                    <div
                        ref={wrapperRef}
                        style={{
                            width:      canvasNaturalSize.width  ? `${Math.round(canvasNaturalSize.width  * scale)}px` : undefined,
                            height:     canvasNaturalSize.height ? `${Math.round(canvasNaturalSize.height * scale)}px` : undefined,
                            position:   'relative',
                            display:    isReady ? 'block' : 'none',
                            lineHeight: 0,
                            flexShrink: 0,
                        }}
                    >
                            {/* Working canvas */}
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleMouseUp}
                                className="border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                style={{ cursor: 'none', display: 'block', width: '100%', height: '100%' }}
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
                        className="absolute inset-0 z-[300] flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.7)' }}
                        onClick={() => setShowHelp(false)}
                    >
                        <div
                            className="bg-[#0d0d0d] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)] w-full max-w-lg rounded-xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111]">
                                <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-white flex items-center gap-3">
                                    <HelpCircle size={14} className="text-[#ff003c]" /> Shortcuts & Manual
                                </span>
                                <button onClick={() => setShowHelp(false)} className={btnSm}><X size={14} /></button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 text-[10px]">

                                {/* Tools */}
                                <section>
                                    <p className="font-bold uppercase tracking-[0.2em] text-[#ff003c] mb-3">Tools</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Row kbd="E" label="Erase" desc="Remove pixels using active brush." color="bg-[#ff003c]/20 text-[#ff003c] border-[#ff003c]/30" />
                                        <Row kbd="R" label="Restore" desc="Recover original pixels." color="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" />
                                    </div>
                                </section>

                                {/* View */}
                                <section>
                                    <p className="font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Viewport</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Row kbd="O" label="Onion" desc="Guide overlay." />
                                        <Row kbd="B" label="Compare" desc="Split view." />
                                        <Row kbd="+/-" label="Zoom" desc="Scale view." />
                                        <Row kbd="Ctrl+Z" label="Undo" desc="History." />
                                    </div>
                                </section>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <p className="text-white/20 uppercase tracking-widest text-[8px]">
                                        Halcon Engine v1.0.4
                                    </p>
                                    <button
                                        onClick={() => setShowHelp(false)}
                                        className="text-[#ff003c] hover:text-white transition-colors uppercase tracking-widest font-bold"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
