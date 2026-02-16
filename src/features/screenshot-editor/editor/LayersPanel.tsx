import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Eye, EyeOff, Lock, Unlock, GripVertical, Type, Image as ImageIcon } from '@/components/Icons';
import { OverlayImage, TextBlock } from './types';

export const ItemTypes = {
    LAYER: 'layer',
};

type LayerItemProps = {
    id: string;
    index: number;
    name: string;
    type: 'text' | 'overlay';
    visible: boolean;
    locked: boolean;
    isActive: boolean;
    moveLayer: (dragIndex: number, hoverIndex: number) => void;
    onSelect: () => void;
    onToggleVisible: (e: React.MouseEvent) => void;
    onToggleLock: (e: React.MouseEvent) => void;
};

const LayerItem: React.FC<LayerItemProps> = ({
    id,
    index,
    name,
    type,
    visible,
    locked,
    isActive,
    moveLayer,
    onSelect,
    onToggleVisible,
    onToggleLock,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ handlerId }, drop] = useDrop({
        accept: ItemTypes.LAYER,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item: any, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            moveLayer(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.LAYER,
        item: () => {
            return { id, index };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div
            ref={ref}
            style={{ opacity }}
            onClick={onSelect}
            className={`flex items-center gap-2 p-2 border border-transparent rounded-md cursor-pointer group ${isActive ? 'bg-terminal-accent/20 border-terminal-accent/50' : 'hover:bg-terminal-dark/50 hover:border-terminal-border'
                }`}
            data-handler-id={handlerId}
        >
            <div className="text-terminal-muted cursor-move hover:text-white" title="Drag to reorder">
                <GripVertical size={14} />
            </div>
            <div className="text-terminal-muted">
                {type === 'text' ? <Type size={14} /> : <ImageIcon size={14} />}
            </div>
            <div className={`flex-1 text-xs truncate select-none ${isActive ? 'text-white font-medium' : 'text-terminal-muted group-hover:text-white'}`}>
                {name}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onToggleLock}
                    className={`p-1 rounded ${locked ? 'text-terminal-accent' : 'text-terminal-muted hover:text-white'}`}
                    title={locked ? "Unlock" : "Lock"}
                >
                    {locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button
                    onClick={onToggleVisible}
                    className={`p-1 rounded ${!visible ? 'text-terminal-muted/50' : 'text-terminal-muted hover:text-white'}`}
                    title={visible ? "Hide" : "Show"}
                >
                    {visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
            </div>
            {(locked || !visible) && (
                <div className="flex items-center gap-1 opacity-100 group-hover:hidden">
                    {locked && <Lock size={12} className="text-terminal-muted" />}
                    {!visible && <EyeOff size={12} className="text-terminal-muted" />}
                </div>
            )}
        </div>
    );
};

type LayersPanelProps = {
    textBlocks: TextBlock[];
    overlays: OverlayImage[];
    layerOrder: string[];
    activeBlockId: string | null; // Currently only tracks active TextBlock, need to generalize?
    onSelectLayer: (id: string, type: 'text' | 'overlay') => void;
    onMoveLayer: (dragIndex: number, hoverIndex: number) => void;
    onToggleVisible: (id: string, type: 'text' | 'overlay') => void;
    onToggleLock: (id: string, type: 'text' | 'overlay') => void;
};

export const LayersPanel: React.FC<LayersPanelProps> = ({
    textBlocks,
    overlays,
    layerOrder,
    activeBlockId,
    onSelectLayer,
    onMoveLayer,
    onToggleVisible,
    onToggleLock
}) => {
    // We reverse layerOrder for display so top layer is at top of list
    // Actually standard is Top of list = Top layer (index 0 is bottom? or index 0 is top?)
    // In canvas painter: layerOrder.forEach executes in order. First drawn is BOTTOM. Last drawn is TOP.
    // So layerOrder[0] is BOTTOM. 
    // In UI, we usually want Top-most layer at the TOP of the list.
    // So we should display layerOrder reversed.
    // BUT react-dnd might be easier if we just manage index 0 = Top?
    // Let's keep data structure: layerOrder[0] = Bottom (Painter order).
    // UI List: Reversed.

    // To make dnd logic simple, let's map layerOrder to items, then reverse for rendering?
    const layersInRenderOrder = layerOrder.map(id => {
        const overlay = overlays.find(o => o.id === id);
        if (overlay) return { ...overlay, type: 'overlay' as const };
        const block = textBlocks.find(b => b.id === id);
        if (block) return { ...block, type: 'text' as const };
        return null;
    }).filter(Boolean) as (({ type: 'text' } & TextBlock) | ({ type: 'overlay' } & OverlayImage))[];

    // Reverse for display: Index 0 in UI is Last in Array (Top layer)
    const displayList = [...layersInRenderOrder].reverse();

    const handleMove = (dragIndexUI: number, hoverIndexUI: number) => {
        // UI indices are reversed compared to data indices.
        // dataLength = N. 
        // UI index i maps to data index (N - 1 - i).
        const N = layerOrder.length;
        const dragIndexData = N - 1 - dragIndexUI;
        const hoverIndexData = N - 1 - hoverIndexUI;
        onMoveLayer(dragIndexData, hoverIndexData);
    };

    return (
        <div className="space-y-1">
            {displayList.map((layer, index) => (
                <LayerItem
                    key={layer.id}
                    index={index}
                    id={layer.id}
                    name={layer.name || (layer.type === 'text' ? 'Text Block' : 'Overlay')}
                    type={layer.type}
                    visible={layer.visible ?? true}
                    locked={layer.locked ?? false}
                    isActive={false} // items don't have a unified 'active' state yet, assuming activeBlockId handles text only
                    moveLayer={handleMove}
                    onSelect={() => onSelectLayer(layer.id, layer.type)}
                    onToggleVisible={(e) => { e.stopPropagation(); onToggleVisible(layer.id, layer.type); }}
                    onToggleLock={(e) => { e.stopPropagation(); onToggleLock(layer.id, layer.type); }}
                />
            ))}
            {displayList.length === 0 && (
                <div className="text-xs text-terminal-muted p-4 text-center border border-dashed border-terminal-border rounded-md">
                    No layers
                </div>
            )}
        </div>
    );
};
