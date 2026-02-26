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
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let currentList: { type: 'ul' | 'ol', items: string[] } | null = null;

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

    const flushList = (key: number) => {
        if (!currentList) return null;
        const ListTag = currentList.type;
        const list = (
            <ListTag key={key} className={`my-3 ml-4 space-y-1 ${ListTag === 'ul' ? 'list-disc' : 'list-decimal'}`}>
                {currentList.items.map((item, i) => (
                    <li key={i} className="pl-2">{renderText(item)}</li>
                ))}
            </ListTag>
        );
        currentList = null;
        return list;
    };

    lines.forEach((line, index) => {
        const ulMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
        const olMatch = line.match(/^[\s]*\d+\.\s+(.*)/);
        if (ulMatch) {
            if (currentList && currentList.type !== 'ul') result.push(flushList(index));
            if (!currentList) currentList = { type: 'ul', items: [] };
            currentList.items.push(ulMatch[1]);
        } else if (olMatch) {
            if (currentList && currentList.type !== 'ol') result.push(flushList(index));
            if (!currentList) currentList = { type: 'ol', items: [] };
            currentList.items.push(olMatch[1]);
        } else {
            if (currentList) result.push(flushList(index));
            if (line.trim() === '') result.push(<div key={index} className="h-2" />);
            else result.push(<p key={index} className="mb-2">{renderText(line)}</p>);
        }
    });
    if (currentList) result.push(flushList(lines.length));
    return <div className="markdown-content break-words whitespace-pre-wrap">{result}</div>;
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
            alert('Por favor complete el título y la descripción.');
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
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setEditingId(null);
                fetchUpdates();
                if (onUpdate) onUpdate();
                alert('¡Actualización publicada con éxito!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Error al guardar: ${errorData.error || response.statusText}`);
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('Error crítico de conexión con el servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta actualización?')) return;

        try {
            const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
            const response = await fetch(`${apiBase}/admin/live-updates/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchUpdates();
                if (onUpdate) onUpdate();
            } else {
                alert('Error al eliminar la entrada.');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Error de conexión al intentar eliminar.');
        }
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
