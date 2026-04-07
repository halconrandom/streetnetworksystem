import React, { useState, useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Layers, X, Download, Copy, Trash2, GripVertical, Check } from '@/components/Icons';
import type { CacheItem } from './types';

type StripBuilderProps = {
    isOpen: boolean;
    onClose: () => void;
    cacheItems: CacheItem[];
};

type StripItemProps = {
    item: CacheItem;
    index: number;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
    onRemove: (id: string) => void;
};

const STRIP_ITEM_TYPE = 'STRIP_ITEM';

const StripItem: React.FC<StripItemProps> = ({ item, index, moveItem, onRemove }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ handlerId }, drop] = useDrop({
        accept: STRIP_ITEM_TYPE,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item: any, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;

            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

            moveItem(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: STRIP_ITEM_TYPE,
        item: () => {
            return { id: item.id, index };
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div
            ref={ref}
            data-handler-id={handlerId}
            style={{ opacity }}
            className="group relative w-full max-w-sm animate-fade-in-up"
        >
            <div className="absolute -left-12 inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col gap-2">
                    <div className="p-2 bg-[#f4f1ea] border-2 border-black text-slate-700 shadow-[2px_2px_0px_#000] cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                    </div>
                </div>
            </div>
            <div className="relative border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden transition-all bg-[#fdfbf7]">
                <img src={item.bakedImage || item.imageDataUrl} className="w-full" alt={item.name} />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 bg-[#ED4245] text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        title="Remove from strip"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                <div className="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </div>
    );
};

export const StripBuilder: React.FC<StripBuilderProps> = ({
    isOpen,
    onClose,
    cacheItems
}) => {
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const toggleItem = (id: string) => {
        setSelectedItemIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
        setSelectedItemIds((prev) => {
            const result = [...prev];
            const [removed] = result.splice(dragIndex, 1);
            result.splice(hoverIndex, 0, removed);
            return result;
        });
    }, []);

    if (!isOpen) return null;

    const selectedItems = selectedItemIds
        .map(id => cacheItems.find(item => item.id === id))
        .filter(Boolean) as CacheItem[];

    const generateCanvas = async () => {
        if (selectedItems.length === 0) return null;

        const images = await Promise.all(selectedItems.map(item => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = item.bakedImage || item.imageDataUrl;
            });
        }));

        const totalHeight = images.reduce((sum, img) => sum + img.height, 0);
        const maxWidth = Math.max(...images.map(img => img.width));

        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            let currentY = 0;
            images.forEach(img => {
                ctx.drawImage(img, (maxWidth - img.width) / 2, currentY);
                currentY += img.height;
            });
            return canvas;
        }
        return null;
    };

    const handleDownload = async () => {
        setGenerating(true);
        try {
            const canvas = await generateCanvas();
            if (canvas) {
                const finalUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `strip-${Date.now()}.png`;
                link.href = finalUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to download strip', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyToClipboard = async () => {
        setGenerating(true);
        try {
            // Modern browsers permit passing a Promise directly to ClipboardItem
            // to maintain the "user gesture" during long async tasks like canvas rendering.
            const clipboardPromise = (async () => {
                const canvas = await generateCanvas();
                if (!canvas) throw new Error("Could not generate canvas");

                const blob = await new Promise<Blob | null>((resolve) =>
                    canvas.toBlob(resolve, 'image/png')
                );
                if (!blob) throw new Error("Could not generate blob");
                return blob;
            })();

            // Explicitly focus window before writing to clipboard to prevent Focus errors
            window.focus();

            const item = new ClipboardItem({
                'image/png': clipboardPromise
            });

            await navigator.clipboard.write([item]);

            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy strip', err);
            // If it's the focus error, show a more specific message
            if (err instanceof Error && err.name === 'NotAllowedError') {
                alert("El navegador bloqueó el copiado porque se perdió el foco. Mantén la ventana activa y vuelve a intentarlo.");
            } else {
                alert("Error al generar o copiar la tira. Intenta descargarla directamente.");
            }
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative w-full max-w-6xl h-full max-h-[88vh] bg-[#fdfbf7] border-2 border-black shadow-[6px_6px_0px_#000] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b-2 border-black bg-[#f4f1ea]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 border-2 border-black bg-violet-500 text-white">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-black tracking-tight uppercase">Roleplay Strip Builder</h2>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Vertical Collage Creator</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 border-2 border-black bg-[#fdfbf7] text-slate-600 shadow-[2px_2px_0px_#000] hover:bg-[#ede9e0] hover:text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex min-h-0 overflow-hidden">
                    {/* Cache Selection (Left) */}
                    <div className="w-[340px] border-r-2 border-black flex flex-col p-5 overflow-hidden bg-[#f4f1ea]">
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-600 mb-4 px-1 flex justify-between">
                            History Cache
                            <span>{cacheItems.length} items</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {cacheItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`relative cursor-pointer group border-2 transition-all duration-150 overflow-hidden ${selectedItemIds.includes(item.id)
                                        ? 'border-violet-500 bg-[#efe8ff]'
                                        : 'border-black bg-[#fdfbf7] hover:bg-[#ede9e0]'
                                        }`}
                                >
                                    <div className="aspect-video relative overflow-hidden">
                                        <img
                                            src={item.bakedImage || item.imageDataUrl}
                                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${selectedItemIds.includes(item.id) ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'
                                                }`}
                                            alt={item.name}
                                        />
                                        {selectedItemIds.includes(item.id) && (
                                            <div className="absolute top-2 right-2 bg-violet-500 text-white border border-black px-2 py-0.5 text-[10px] font-bold shadow-[2px_2px_0px_#000]">
                                                #{selectedItemIds.indexOf(item.id) + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <div className="text-[11px] font-bold text-black truncate transition-colors">{item.name}</div>
                                        <div className="text-[9px] text-slate-500 mt-0.5 truncate">{new Date(item.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                            {cacheItems.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 italic border-2 border-dashed border-black bg-[#fdfbf7]">
                                    Save some screenshots to cache first to build a strip.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview & Order (Right) */}
                    <div className="flex-1 flex flex-col p-6 bg-[#fdfbf7] overflow-hidden">
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-600 mb-4 px-2 flex justify-between">
                            Vertical Strip Preview
                            <span>{selectedItems.length} selected</span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            <div className="flex flex-col items-center gap-1 py-10">
                                {selectedItems.map((item, index) => (
                                    <StripItem
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        moveItem={moveItem}
                                        onRemove={toggleItem}
                                    />
                                ))}

                                {selectedItems.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center p-20 text-center text-slate-500 border-2 border-dashed border-black bg-[#f4f1ea]">
                                        <Layers size={64} className="mb-4" />
                                        <p className="font-bold text-sm tracking-widest uppercase">Select images to preview strip</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 pt-6 border-t-2 border-black flex gap-4">
                            <button
                                onClick={() => setSelectedItemIds([])}
                                disabled={selectedItems.length === 0}
                                className="px-6 py-3 text-[11px] font-black uppercase tracking-widest bg-[#f4f1ea] border-2 border-black text-slate-700 shadow-[2px_2px_0px_#000] hover:bg-[#ede9e0] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                            >
                                Clear All
                            </button>

                            <button
                                onClick={handleCopyToClipboard}
                                disabled={selectedItems.length === 0 || generating}
                                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${copySuccess
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-violet-500 text-white hover:bg-violet-600'
                                    }`}
                            >
                                {copySuccess ? (
                                    <>
                                        <Check size={18} />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={18} />
                                        Copy to Clipboard
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={selectedItems.length === 0 || generating}
                                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 text-[11px] font-black uppercase tracking-widest bg-[#f4f1ea] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#ede9e0] transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            >
                                {generating ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download Strip
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
