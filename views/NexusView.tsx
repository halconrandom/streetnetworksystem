import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Maximize, MousePointer2, Move, Share2, Save, Trash2, Box, Activity, RotateCcw } from '../components/Icons';

interface NexusNode {
    id: string;
    type: 'note' | 'image';
    content: string;
    x: number;
    y: number;
    color: string;
    width: number;
    height: number;
}

interface NexusConnection {
    id: string;
    fromId: string;
    toId: string;
}

interface Camera {
    x: number;
    y: number;
    zoom: number;
}

export default function NexusView() {
    const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
    const [nodes, setNodes] = useState<NexusNode[]>([]);
    const [connections, setConnections] = useState<NexusConnection[]>([]);
    const [activeTool, setActiveTool] = useState<'move' | 'connect'>('move');
    const [selection, setSelection] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Performance Optimization: Transient Drag State
    const [dragState, setDragState] = useState<{ id: string, x: number, y: number } | null>(null);

    const [connectStartId, setConnectStartId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Sync edited node back to nodes list only on drag end or when state changes
    const finalizeDrag = useCallback(() => {
        if (!dragState) return;
        setNodes(prev => prev.map(n => n.id === dragState.id ? { ...n, x: dragState.x, y: dragState.y } : n));
        setDragState(null);
    }, [dragState]);

    // Load from Backend
    useEffect(() => {
        const loadCanvas = async () => {
            if (!apiBase) return;
            setIsLoading(true);
            try {
                const res = await fetch(`${apiBase}/nexus`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.nodes) setNodes(data.nodes);
                    if (data.connections) setConnections(data.connections);
                    if (data.camera) setCamera(data.camera);
                }
            } catch (e) {
                console.error('Failed to load nexus state', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadCanvas();
    }, [apiBase]);

    // Save to Backend
    const handleSave = useCallback(async () => {
        if (!apiBase) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${apiBase}/nexus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nodes, connections, camera })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Save failed');
            }
        } catch (e: any) {
            console.error('Failed to save nexus state', e);
            alert(`Nexus System Error: ${e.message}`);
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    }, [apiBase, nodes, connections, camera]);

    const screenToWorld = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - camera.x) / camera.zoom,
            y: (clientY - rect.top - camera.y) / camera.zoom,
        };
    }, [camera]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        // Check if clicking a node
        const clickedNode = [...nodes].reverse().find(n => (
            worldPos.x >= n.x && worldPos.x <= n.x + n.width &&
            worldPos.y >= n.y && worldPos.y <= n.y + n.height
        ));

        if (clickedNode) {
            if (activeTool === 'connect') {
                if (!connectStartId) {
                    setConnectStartId(clickedNode.id);
                } else if (connectStartId !== clickedNode.id) {
                    setConnections(prev => [...prev, {
                        id: crypto.randomUUID(),
                        fromId: connectStartId,
                        toId: clickedNode.id
                    }]);
                    setConnectStartId(null);
                }
                return;
            }
            setSelection(clickedNode.id);
            setDragState({ id: clickedNode.id, x: clickedNode.x, y: clickedNode.y });
            return;
        }

        setSelection(null);
        setConnectStartId(null);
        if (e.button === 0 && activeTool === 'move') {
            setIsPanning(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        if (isPanning) {
            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        } else if (dragState) {
            // Throttled update via rAF (Implicitly through state scheduling in this simple case, 
            // but we use a dedicated state object to avoid mapping the nodes array 60 times/sec)
            setDragState(prev => prev ? {
                ...prev,
                x: prev.x + dx / camera.zoom,
                y: prev.y + dy / camera.zoom
            } : null);
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        finalizeDrag();
    };

    // Reliable scroll blocking for zooming
    useEffect(() => {
        const board = containerRef.current;
        if (!board) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            // Zoom speed and factor
            const zoomSpeed = 0.001;
            const factor = Math.exp(-e.deltaY * zoomSpeed);

            setCamera(prev => {
                const newZoom = Math.min(5, Math.max(0.1, prev.zoom * factor));
                const rect = board.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldMouseX = (mouseX - prev.x) / prev.zoom;
                const worldMouseY = (mouseY - prev.y) / prev.zoom;

                return {
                    zoom: newZoom,
                    x: mouseX - worldMouseX * newZoom,
                    y: mouseY - worldMouseY * newZoom,
                };
            });
        };

        board.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => board.removeEventListener('wheel', handleWheelEvent);
    }, []);

    const addNote = () => {
        const worldCenter = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
        const newNode: NexusNode = {
            id: crypto.randomUUID(),
            type: 'note',
            content: '',
            x: worldCenter.x - 100,
            y: worldCenter.y - 75,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
            width: 200,
            height: 150,
        };
        setNodes(prev => [...prev, newNode]);
        setSelection(newNode.id);
    };

    const deleteSelection = () => {
        if (!selection) return;
        setNodes(prev => prev.filter(n => n.id !== selection));
        setConnections(prev => prev.filter(c => c.fromId !== selection && c.toId !== selection));
        setSelection(null);
    };

    const updateNodeContent = (id: string, content: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    };

    const getConnectionPath = (fromId: string, toId: string) => {
        const from = nodes.find(n => n.id === fromId);
        const to = nodes.find(n => n.id === toId);
        if (!from || !to) return "";

        // Performance Optimization: Use transient drag state if available
        const fx = (dragState?.id === fromId ? dragState.x : from.x) + from.width / 2;
        const fy = (dragState?.id === fromId ? dragState.y : from.y) + from.height / 2;
        const tx = (dragState?.id === toId ? dragState.x : to.x) + to.width / 2;
        const ty = (dragState?.id === toId ? dragState.y : to.y) + to.height / 2;

        const dx = tx - fx;
        return `M ${fx} ${fy} C ${fx + dx / 2} ${fy}, ${tx - dx / 2} ${ty}, ${tx} ${ty}`;
    };

    const resetCamera = () => {
        setCamera({ x: 0, y: 0, zoom: 1 });
    };

    const clearBoard = () => {
        if (confirm("System override: Are you sure you want to purge the entire matrix? This cannot be undone.")) {
            setNodes([]);
            setConnections([]);
            // Sync with backend immediately
            if (apiBase) {
                fetch(`${apiBase}/nexus`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ nodes: [], connections: [], camera: { x: 0, y: 0, zoom: 1 } })
                });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#050505] text-terminal-muted space-y-4 font-mono">
                <div className="w-12 h-12 border-2 border-terminal-accent/20 border-t-terminal-accent rounded-full animate-spin" />
                <div className="uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Neural Link...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-[#050505] text-terminal-text">
            {/* Top Toolbar */}
            <div className="h-14 border-b border-terminal-border bg-terminal-panel/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-terminal-accent/10 border border-terminal-accent/20 rounded text-terminal-accent">
                        <Activity size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">The Nexus</span>
                    </div>
                    <div className="h-4 w-px bg-terminal-border mx-2" />
                    <div className="flex bg-terminal-dark rounded-lg border border-terminal-border p-1 shadow-inner">
                        <button
                            onClick={() => { setActiveTool('move'); setConnectStartId(null); }}
                            className={`p-1.5 rounded-md transition-all flex items-center gap-2 px-3 ${activeTool === 'move' ? 'bg-terminal-accent text-white shadow-lg shadow-terminal-accent/20' : 'text-terminal-muted hover:text-white'}`}
                        >
                            <Move size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Navigate</span>
                        </button>
                        <button
                            onClick={() => setActiveTool('connect')}
                            className={`p-1.5 rounded-md transition-all flex items-center gap-2 px-3 ${activeTool === 'connect' ? 'bg-terminal-accent text-white shadow-lg shadow-terminal-accent/20' : 'text-terminal-muted hover:text-white'}`}
                        >
                            <Share2 size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Connect</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 text-[9px] font-mono text-terminal-muted uppercase tracking-widest">
                        {isSaving ? (
                            <>
                                <div className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-pulse" />
                                <span>Synchronizing...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-1.5 h-1.5 bg-green-500/50 rounded-full" />
                                <span>Verified & Saved</span>
                            </>
                        )}
                    </div>
                    <div className="w-px h-6 bg-terminal-border mx-1" />
                    <button
                        onClick={addNote}
                        className="flex items-center gap-2 px-4 py-1.5 bg-terminal-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-terminal-accent/20"
                    >
                        <Plus size={14} /> Pin Point
                    </button>
                    <div className="w-px h-6 bg-terminal-border mx-1" />
                    <button
                        onClick={resetCamera}
                        className="p-2 border border-terminal-border rounded-lg text-terminal-muted hover:text-white hover:bg-white/5 transition-all active:scale-90"
                        title="Reset Viewport"
                    >
                        <Maximize size={16} />
                    </button>
                    <button
                        onClick={handleSave}
                        className={`p-2 border border-terminal-border rounded-lg transition-all active:scale-90 ${isSaving ? 'text-terminal-accent animate-pulse bg-terminal-accent/5 border-terminal-accent/30' : 'text-terminal-muted hover:text-white hover:bg-white/5'}`}
                        title="Save Canvas"
                    >
                        <Save size={16} />
                    </button>
                    <button
                        onClick={deleteSelection}
                        disabled={!selection}
                        className={`p-2 border border-terminal-border rounded-lg transition-all ${selection ? 'text-red-500 hover:bg-red-500/10 active:scale-90' : 'text-terminal-muted opacity-20'}`}
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="w-px h-6 bg-terminal-border mx-1" />
                    <button
                        onClick={clearBoard}
                        className="p-2 border border-terminal-border rounded-lg text-terminal-muted hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                        title="Purge Matrix"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden bg-dot-grid"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    cursor: activeTool === 'connect' ? 'crosshair' : (isPanning ? 'grabbing' : 'grab')
                }}
            >
                {/* Dynamic Grid Background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `
                      radial-gradient(circle, #FF3B3B 1px, transparent 1px)
                    `,
                        backgroundSize: `${40 * camera.zoom}px ${40 * camera.zoom}px`,
                        backgroundPosition: `${camera.x}px ${camera.y}px`
                    }}
                />

                {/* Content Layer (Scaled) */}
                <div
                    style={{
                        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
                        transformOrigin: '0 0'
                    }}
                    className="absolute inset-0 pointer-events-none"
                >
                    {/* Connection Lines (Red Strings) */}
                    <svg className="absolute inset-0 w-[10000px] h-[10000px] overflow-visible pointer-events-none">
                        {connections.map(conn => (
                            <path
                                key={conn.id}
                                d={getConnectionPath(conn.fromId, conn.toId)}
                                fill="none"
                                stroke="#FF3B3B"
                                strokeWidth="1.5"
                                strokeDasharray="4 2"
                                className="opacity-40 animate-dash"
                            />
                        ))}
                        {/* Active Drawing Line */}
                        {connectStartId && (
                            <line
                                x1={(dragState?.id === connectStartId ? dragState.x : nodes.find(n => n.id === connectStartId)!.x) + 100}
                                y1={(dragState?.id === connectStartId ? dragState.y : nodes.find(n => n.id === connectStartId)!.y) + 75}
                                x2={screenToWorld(lastMousePos.current.x, lastMousePos.current.y).x}
                                y2={screenToWorld(lastMousePos.current.x, lastMousePos.current.y).y}
                                stroke="#FF3B3B"
                                strokeWidth="2"
                                strokeDasharray="5 5"
                                className="opacity-80"
                            />
                        )}
                    </svg>

                    {nodes.map(node => {
                        const isDragging = dragState?.id === node.id;
                        const x = isDragging ? dragState.x : node.x;
                        const y = isDragging ? dragState.y : node.y;

                        return (
                            <div
                                key={node.id}
                                className={`absolute group rounded-xl pointer-events-auto transition-all duration-200 ${selection === node.id ? 'ring-2 ring-terminal-accent shadow-[0_0_30px_rgba(255,59,59,0.3)] scale-105 z-40' : (connectStartId === node.id ? 'ring-2 ring-white scale-105 z-40' : 'border border-white/5 hover:border-white/10 z-10')}`}
                                style={{
                                    left: x,
                                    top: y,
                                    width: node.width,
                                    height: node.height,
                                    backgroundColor: '#0a0a0a',
                                    borderTop: `4px solid ${node.color}`,
                                    // Use translate3d for smooth hardware accelerated dragging
                                    transform: isDragging ? 'translate3d(0,0,0)' : undefined,
                                    willChange: isDragging ? 'left, top' : 'auto'
                                }}
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                </div>
                                <textarea
                                    value={node.content}
                                    onChange={(e) => updateNodeContent(node.id, e.target.value)}
                                    className="w-full h-full bg-transparent border-none outline-none text-[11px] p-6 text-terminal-text resize-none font-sans leading-relaxed custom-scrollbar placeholder:text-terminal-muted/20"
                                    placeholder="UNIDENTIFIED SEQUENCE..."
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute bottom-6 left-6 flex items-center gap-4 z-50">
                <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 gap-4 shadow-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-terminal-accent animate-pulse" />
                        <span className="text-[9px] font-mono text-terminal-muted uppercase tracking-widest">Uplink Active</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[9px] font-mono text-terminal-muted uppercase tracking-widest">
                        Nodes: {nodes.length} | Net: {connections.length}
                    </span>
                </div>
            </div>

            {/* Floating Bottom Info */}
            <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-[10px] text-terminal-muted font-mono uppercase tracking-[0.2em] z-50 shadow-2xl flex items-center gap-4">
                <span className="opacity-40">Matrix Status</span>
                <div className="flex items-center gap-2 text-white">
                    <Maximize size={12} className="opacity-40" />
                    {Math.round(camera.zoom * 100)}%
                </div>
            </div>

            <style jsx>{`
              .bg-dot-grid {
                background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
                background-size: 30px 30px;
              }
              @keyframes dash {
                to {
                  stroke-dashoffset: -20;
                }
              }
              .animate-dash {
                animation: dash 5s linear infinite;
              }
            `}</style>
        </div>
    );
}
