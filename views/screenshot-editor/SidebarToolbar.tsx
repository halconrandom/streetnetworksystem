import React from 'react';
import {
    Image,
    Layers,
    Palette,
    Type,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Settings,
    Clock,
    Shield,
    Move
} from '../../components/Icons';

type SidebarToolbarProps = {
    visiblePanels: Record<string, boolean>;
    onTogglePanel: (id: string) => void;
    activeTool: 'move' | 'redact';
    onSetTool: (tool: 'move' | 'redact') => void;
};

export const SidebarToolbar: React.FC<SidebarToolbarProps> = ({
    visiblePanels,
    onTogglePanel,
    activeTool,
    onSetTool
}) => {
    const tools = [
        { id: 'source', icon: Image, label: 'Source (Uploads)', side: 'left' },
        { id: 'textEditor', icon: Type, label: 'Text Editor', side: 'left' },
        { id: 'move', icon: Move, label: 'Selection Tool', side: 'center', isTool: true },
        { id: 'redact', icon: Shield, label: 'Redaction Mask', side: 'center', isTool: true },
        { id: 'layers', icon: Layers, label: 'Layers & Depth', side: 'right' },
        { id: 'canvas', icon: Settings, label: 'Canvas Configuration', side: 'right' },
        { id: 'colors', icon: Palette, label: 'Color Toolkit', side: 'right' },
        { id: 'content', icon: MessageSquare, label: 'Log Analysis', side: 'right' },
        { id: 'history', icon: Clock, label: 'Save Points & History', side: 'right' },
    ];

    return (
        <div className="flex flex-col gap-4 p-2 bg-terminal-panel/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl h-fit sticky top-6 z-40">
            <div className="flex flex-col gap-2">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = tool.isTool ? (activeTool === tool.id) : visiblePanels[tool.id];
                    return (
                        <button
                            key={tool.id}
                            onClick={() => tool.isTool ? onSetTool(tool.id as any) : onTogglePanel(tool.id)}
                            className={`group relative p-3 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-terminal-accent text-black shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] scale-105'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                            title={tool.label}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                            {/* Tooltip (Custom) */}
                            <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10 shadow-2xl">
                                {tool.label}
                            </div>

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-white border-2 border-terminal-accent animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="h-px bg-white/5 mx-2 my-2" />

            <div className="text-[8px] text-white/20 font-bold uppercase tracking-tighter text-center">
                Workspace
            </div>
        </div>
    );
};
