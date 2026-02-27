import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    PenTool,
    Save,
    Clock,
    AlertCircle,
    CheckCircle,
    Type,
    Bold,
    Italic,
    List,
    ListOrdered
} from '@/components/Icons';
import { toast } from 'sonner';

interface LiveUpdate {
    id: number;
    type: string;
    message: string;
    description: string;
    date: string;
    is_active: boolean;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    const renderText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="text-terminal-accent italic">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
            elements.push(<div key={`empty-${i}`} className="h-3" />);
            i++;
            continue;
        }

        // List detection
        const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
        const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)/);

        if (ulMatch || olMatch) {
            const listType = ulMatch ? 'ul' : 'ol';
            const baseIndent = (ulMatch || olMatch)![1].length;
            const listItems: React.ReactNode[] = [];

            while (i < lines.length) {
                const currentLine = lines[i];
                const mU = currentLine.match(/^(\s*)([-*+])\s+(.*)/);
                const mO = currentLine.match(/^(\s*)(\d+\.)\s+(.*)/);

                if (!mU && !mO) break;

                const indent = (mU || mO)![1].length;
                if (indent < baseIndent) break; // Dedent ends list

                const itemContent = (mU || mO)![3];
                listItems.push(
                    <li key={`li-${i}`} className={`pl-1 mb-1 ${indent > baseIndent ? 'ml-4' : ''}`}>
                        {renderText(itemContent)}
                    </li>
                );
                i++;
            }

            const ListTag = listType;
            elements.push(
                <ListTag
                    key={`list-${i}`}
                    className={`my-2 ml-5 space-y-0.5 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-terminal-accent/50`}
                >
                    {listItems}
                </ListTag>
            );
        } else {
            elements.push(
                <p key={`p-${i}`} className="mb-2 text-[11px] leading-relaxed text-terminal-muted/90">
                    {renderText(line)}
                </p>
            );
            i++;
        }
    }

    return <div className="markdown-content break-words whitespace-pre-wrap selection:bg-terminal-accent/20">{elements}</div>;
};

interface LiveUpdateManagerProps {
    onClose: () => void;
    onUpdate?: () => void;
}

export const LiveUpdateManager: React.FC<LiveUpdateManagerProps> = ({ onClose, onUpdate }) => {
    const [updates, setUpdates] = useState<LiveUpdate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<LiveUpdate>>({
        type: 'feat',
        message: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_active: true
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = formData.description || '';

        // Handle Tab (Indent)
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                // Dedent
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                if (value.substring(lineStart, lineStart + 4) === '    ') {
                    const newValue = value.substring(0, lineStart) + value.substring(lineStart + 4);
                    setFormData({ ...formData, description: newValue });
                    setTimeout(() => textarea.setSelectionRange(start - 4, end - 4), 0);
                }
            } else {
                // Indent
                const newValue = value.substring(0, start) + '    ' + value.substring(end);
                setFormData({ ...formData, description: newValue });
                setTimeout(() => textarea.setSelectionRange(start + 4, end + 4), 0);
            }
        }

        // Handle Enter (Auto-bullet)
        if (e.key === 'Enter' && !e.shiftKey) {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLine = value.substring(lineStart, start);
            const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+/);

            if (listMatch) {
                e.preventDefault();
                const indent = listMatch[1];
                const marker = listMatch[2];
                let nextMarker = marker;

                if (marker.endsWith('.')) {
                    const num = parseInt(marker) + 1;
                    nextMarker = `${num}.`;
                }

                const newline = `\n${indent}${nextMarker} `;
                const newValue = value.substring(0, start) + newline + value.substring(end);
                setFormData({ ...formData, description: newValue });
                setTimeout(() => {
                    const pos = start + newline.length;
                    textarea.setSelectionRange(pos, pos);
                }, 0);
            }
        }
    };

    const insertFormatting = (syntax: string) => {
        const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.description || '';
        const selectedText = text.substring(start, end);

        let newText = '';
        if (syntax === '**' || syntax === '*') {
            newText = text.substring(0, start) + syntax + selectedText + syntax + text.substring(end);
        } else {
            newText = text.substring(0, start) + syntax + selectedText + text.substring(end);
        }

        setFormData({ ...formData, description: newText });

        // Return focus and set selection
        setTimeout(() => {
            textarea.focus();
            if (selectedText.length > 0 && (syntax === '**' || syntax === '*')) {
                textarea.setSelectionRange(start, start + syntax.length * 2 + selectedText.length);
            } else {
                const newPos = start + syntax.length;
                textarea.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const fetchUpdates = async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
            const response = await fetch(`${apiBase}/admin/live-updates`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setUpdates(data);
            }
        } catch (err) {
            console.error('Failed to fetch admin updates:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const handleSave = async () => {
        if (!formData.message || !formData.description) {
            toast.error('Por favor complete el título y la descripción.');
            return;
        }

        setIsSaving(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
            const url = editingId === 'new'
                ? `${apiBase}/admin/live-updates`
                : `${apiBase}/admin/live-updates/${editingId}`;

            const method = editingId === 'new' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (response.ok) {
                setEditingId(null);
                fetchUpdates();
                if (onUpdate) onUpdate();
                toast.success('¡Actualización publicada con éxito!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.error(`Error al guardar: ${errorData.error || response.statusText}`);
            }
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Error crítico de conexión con el servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        toast.error('¿Estás seguro de que deseas eliminar esta actualización?', {
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    try {
                        const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
                        const response = await fetch(`${apiBase}/admin/live-updates/${id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        if (response.ok) {
                            fetchUpdates();
                            if (onUpdate) onUpdate();
                            toast.success('Entrada eliminada correctamente.');
                        } else {
                            toast.error('Error al eliminar la entrada.');
                        }
                    } catch (err) {
                        console.error('Delete failed:', err);
                        toast.error('Error de conexión al intentar eliminar.');
                    }
                }
            },
            cancel: {
                label: 'Cancelar',
                onClick: () => { }
            }
        });
    };

    const startEditing = (update: LiveUpdate) => {
        setFormData(update);
        setEditingId(update.id);
    };

    const startNew = () => {
        setFormData({
            type: 'feat',
            message: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            is_active: true
        });
        setEditingId('new');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-terminal-panel border border-terminal-border rounded-3xl w-full max-w-[75vw] max-h-[95vh] flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestión de Actualizaciones</h2>
                        <p className="text-[10px] text-terminal-accent font-bold uppercase tracking-widest mt-1 opacity-60">Administración de Noticias y Cambios del Sistema</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-terminal-muted hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* List Sidebar */}
                    <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar p-6 bg-black/20">
                        <button
                            onClick={startNew}
                            className="w-full mb-6 py-3 bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-terminal-accent hover:text-black transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Nueva Actualización
                        </button>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-10 opacity-20 animate-pulse">Scanning...</div>
                            ) : updates.map(update => (
                                <div
                                    key={update.id}
                                    onClick={() => startEditing(update)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${editingId === update.id ? 'bg-terminal-accent/10 border-terminal-accent/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${update.type === 'feat' ? 'bg-terminal-accent/20 text-terminal-accent' : update.type === 'fix' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-terminal-muted'}`}>
                                            {update.type}
                                        </span>
                                        <span className="text-[8px] font-mono opacity-30">{new Date(update.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-white/70 font-bold truncate group-hover:text-white transition-colors">
                                        {update.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor Main */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {editingId ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Categoría</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-terminal-accent/50 transition-colors outline-none appearance-none"
                                        >
                                            <option value="feat">Mejora</option>
                                            <option value="fix">Parche / Arreglo</option>
                                            <option value="refactor">Optimización</option>
                                            <option value="security">Seguridad</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Fecha de publicación</label>
                                        <input
                                            type="date"
                                            value={formData.date?.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-terminal-accent/50 transition-colors outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Título de la noticia</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. system core stabilization"
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-terminal-accent/50 transition-colors outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="is-active"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 accent-terminal-accent rounded border-white/10"
                                    />
                                    <label htmlFor="is-active" className="text-[10px] font-black uppercase text-white/60 tracking-widest cursor-pointer select-none">
                                        Publicar en la página de inicio (Visible para todos)
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block">Detalles de la mejora</label>
                                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                            <button
                                                onClick={() => insertFormatting('**')}
                                                className="p-1.5 text-terminal-muted hover:text-terminal-accent hover:bg-white/5 rounded transition-all"
                                                title="Negrita"
                                            >
                                                <Bold size={12} />
                                            </button>
                                            <button
                                                onClick={() => insertFormatting('*')}
                                                className="p-1.5 text-terminal-muted hover:text-terminal-accent hover:bg-white/5 rounded transition-all"
                                                title="Itálica"
                                            >
                                                <Italic size={12} />
                                            </button>
                                            <button
                                                onClick={() => insertFormatting('\n- ')}
                                                className="p-1.5 text-terminal-muted hover:text-terminal-accent hover:bg-white/5 rounded transition-all"
                                                title="Viñetas"
                                            >
                                                <List size={12} />
                                            </button>
                                            <button
                                                onClick={() => insertFormatting('\n1. ')}
                                                className="p-1.5 text-terminal-muted hover:text-terminal-accent hover:bg-white/5 rounded transition-all"
                                                title="Numeración"
                                            >
                                                <ListOrdered size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 min-h-[450px]">
                                        <div className="flex flex-col gap-2">
                                            <div className="text-[8px] uppercase font-bold text-terminal-muted/40 px-1 tracking-widest">Editor</div>
                                            <textarea
                                                id="description-editor"
                                                placeholder="Detalla los cambios técnicos y el impacto..."
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                onKeyDown={handleKeyDown}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-terminal-accent/50 transition-colors outline-none resize-none custom-scrollbar font-mono leading-relaxed"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 overflow-hidden">
                                            <div className="text-[8px] uppercase font-bold text-terminal-accent/40 px-1 tracking-widest">Vista Previa</div>
                                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-6 py-4 text-terminal-muted text-xs overflow-y-auto custom-scrollbar break-all sm:break-words">
                                                <MarkdownRenderer content={formData.description || ''} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 py-4 bg-terminal-accent text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                    >
                                        <Save size={16} /> {editingId === 'new' ? 'Publicar Actualización' : 'Guardar Cambios'}
                                    </button>

                                    {editingId !== 'new' && (
                                        <button
                                            onClick={() => handleDelete(editingId as number)}
                                            className="p-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20">
                                <AlertCircle size={48} className="mb-4" />
                                <h3 className="text-lg font-black uppercase tracking-widest">Esperando selección</h3>
                                <p className="text-xs mt-2 italic">Selecciona una entrada o añade una nueva actualización para comenzar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
