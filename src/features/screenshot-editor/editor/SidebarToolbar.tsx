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
} from '@/components/Icons';

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
        { id: 'filters', icon: Settings, label: 'Post-Processing', side: 'right' },
        { id: 'stripBuilder', icon: Layers, label: 'Strip Builder', side: 'right' },
    ];

    return (
        <div className="flex flex-col gap-1 p-2 neo-panel bg-[#fdfbf7] h-fit sticky top-4 z-40">
            {tools.map((tool, i) => {
                const Icon = tool.icon;
                const isActive = tool.isTool ? (activeTool === tool.id) : visiblePanels[tool.id];
                return (
                    <React.Fragment key={tool.id}>
                        {i === 2 && <div className="w-full h-[2px] bg-black my-1" />}
                        <button
                            onClick={() => tool.isTool ? onSetTool(tool.id as any) : onTogglePanel(tool.id)}
                            className={`group relative w-12 h-12 flex items-center justify-center border-2 transition-all duration-75 active:translate-x-[2px] active:translate-y-[2px] ${
                                isActive
                                    ? 'bg-violet-500 text-white border-black shadow-[2px_2px_0px_#000000]'
                                    : 'bg-[#fdfbf7] text-slate-600 border-black hover:text-black hover:bg-[#f4f1ea]'
                            }`}
                            title={tool.label}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-[10px] font-sans font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border-2 border-black">
                                {tool.label}
                            </div>
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
