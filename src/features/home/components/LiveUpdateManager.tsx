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
    Copy,
    Eye
} from '@/components/Icons';
import { toast } from 'sonner';
import {
    buildDiscordMessage,
    UPDATE_COLORS,
    DiscordMessage
} from './discord-components';

interface LiveUpdate {
    id: number;
    type: string;
    message: string;
    description: string;
    date: string;
    is_active: boolean;
}

interface LiveUpdateManagerProps {
    onClose: () => void;
    onUpdate?: () => void;
}

export const LiveUpdateManager: React.FC<LiveUpdateManagerProps> = ({ onClose, onUpdate }) => {
    const [updates, setUpdates] = useState<LiveUpdate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<LiveUpdate>>({
        type: 'feat',
        message: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_active: true
    });

    const fetchUpdates = async () => {
        try {
            const response = await fetch('/api/admin/live-updates', {
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
            const url = editingId === 'new'
                ? '/api/admin/live-updates'
                : `/api/admin/live-updates/${editingId}`;

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
                        const response = await fetch(`/api/admin/live-updates/${id}`, {
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

    const handleCopyDiscordJson = () => {
        if (!formData.message || !formData.description) {
            toast.error('Complete el título y descripción primero.');
            return;
        }
        
        const discordMessage = buildDiscordMessage(
            formData.type as 'feat' | 'fix' | 'refactor' | 'security',
            formData.message,
            formData.description,
            formData.date || new Date().toISOString().split('T')[0]
        );
        
        navigator.clipboard.writeText(JSON.stringify(discordMessage, null, 2));
        toast.success('JSON de Discord copiado al portapapeles');
    };

    const startEditing = (update: LiveUpdate) => {
        setFormData(update);
        setEditingId(update.id);
        setShowPreview(false);
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
        setShowPreview(false);
    };

    // Generate Discord preview
    const getDiscordPreview = (): DiscordMessage | null => {
        if (!formData.message || !formData.description) return null;
        
        return buildDiscordMessage(
            formData.type as 'feat' | 'fix' | 'refactor' | 'security',
            formData.message,
            formData.description,
            formData.date || new Date().toISOString().split('T')[0]
        );
    };

    const discordPreview = getDiscordPreview();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-terminal-panel border border-terminal-border rounded-3xl w-full max-w-[85vw] max-h-[95vh] flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Gestión de Actualizaciones</h2>
                        <p className="text-[10px] text-terminal-accent font-bold uppercase tracking-widest mt-1 opacity-60">Formato Discord Components V2</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-terminal-muted hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* List Sidebar */}
                    <div className="w-72 border-r border-white/5 overflow-y-auto custom-scrollbar p-4 bg-black/20">
                        <button
                            onClick={startNew}
                            className="w-full mb-4 py-3 bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-terminal-accent hover:text-black transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Nueva Actualización
                        </button>

                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="text-center py-10 opacity-20 animate-pulse">Cargando...</div>
                            ) : updates.map(update => (
                                <div
                                    key={update.id}
                                    onClick={() => startEditing(update)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${editingId === update.id ? 'bg-terminal-accent/10 border-terminal-accent/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${update.type === 'feat' ? 'bg-emerald-500/20 text-emerald-400' : update.type === 'fix' ? 'bg-red-500/20 text-red-400' : update.type === 'security' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
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
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {editingId ? (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Editor Panel */}
                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-white/5">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Categoría</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-terminal-accent/50 transition-colors outline-none appearance-none"
                                                >
                                                    <option value="feat">✨ Mejora</option>
                                                    <option value="fix">🔧 Parche / Arreglo</option>
                                                    <option value="refactor">⚡ Optimización</option>
                                                    <option value="security">🔒 Seguridad</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Fecha</label>
                                                <input
                                                    type="date"
                                                    value={formData.date?.split('T')[0]}
                                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-terminal-accent/50 transition-colors outline-none [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Título</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Sistema de i18n implementado"
                                                value={formData.message}
                                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-terminal-accent/50 transition-colors outline-none"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <input
                                                type="checkbox"
                                                id="is-active"
                                                checked={formData.is_active}
                                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-4 h-4 accent-terminal-accent rounded border-white/10"
                                            />
                                            <label htmlFor="is-active" className="text-[10px] font-black uppercase text-white/60 tracking-widest cursor-pointer select-none">
                                                Publicar en la página de inicio
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-terminal-muted tracking-widest block pl-1">Descripción (Discord Markdown)</label>
                                            <textarea
                                                placeholder={`### Cambios realizados
- **Nueva funcionalidad**: Selector de idiomas
- **Mejora**: Traducciones completas
- **Fix**: Error en el selector de canales

### Notas adicionales
Los usuarios pueden cambiar entre EN/ES desde el TopBar.`}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full h-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-terminal-accent/50 transition-colors outline-none resize-none custom-scrollbar font-mono leading-relaxed"
                                            />
                                            <p className="text-[9px] text-white/30">
                                                Usa **bold**, *italic*, # headers, - bullets, 1. numeración
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="flex-1 py-3 bg-terminal-accent text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                            >
                                                <Save size={16} /> {editingId === 'new' ? 'Publicar' : 'Guardar'}
                                            </button>
                                            <button
                                                onClick={handleCopyDiscordJson}
                                                className="px-4 py-3 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Copy size={14} /> Copiar JSON
                                            </button>
                                            {editingId !== 'new' && (
                                                <button
                                                    onClick={() => handleDelete(editingId as number)}
                                                    className="p-3 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Discord Preview Panel */}
                                <div className="w-[400px] p-6 overflow-y-auto custom-scrollbar bg-[#36393f]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Eye size={14} className="text-white/60" />
                                        <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Vista Previa Discord</span>
                                    </div>
                                    
                                    {discordPreview ? (
                                        <div className="space-y-4">
                                            {/* Simulated Discord Container */}
                                            <div 
                                                className="rounded-xl overflow-hidden"
                                                style={{
                                                    backgroundColor: '#2b2d31',
                                                    borderLeft: `4px solid #${(discordPreview.components[0].accent_color || 0).toString(16).padStart(6, '0')}`
                                                }}
                                            >
                                                <div className="p-4 space-y-3">
                                                    {/* Header */}
                                                    <div className="text-white font-bold text-lg">
                                                        {formData.type === 'feat' ? '✨' : formData.type === 'fix' ? '🔧' : formData.type === 'security' ? '🔒' : '⚡'} {formData.message}
                                                    </div>
                                                    <div className="text-[#949ba4] text-xs">
                                                        📅 {formData.date}
                                                    </div>
                                                    
                                                    {/* Separator */}
                                                    <div className="border-t border-white/10" />
                                                    
                                                    {/* Content */}
                                                    <div className="text-[#dbdee1] text-sm whitespace-pre-wrap">
                                                        {formData.description.split('\n').map((line, i) => {
                                                            // Parse markdown
                                                            let parsed = line
                                                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                                                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                                                                .replace(/^### (.+)$/g, '<strong class="text-white">$1</strong>')
                                                                .replace(/^## (.+)$/g, '<strong class="text-white text-base">$1</strong>')
                                                                .replace(/^# (.+)$/g, '<strong class="text-white text-lg">$1</strong>');
                                                            
                                                            return (
                                                                <div key={i} className="leading-relaxed">
                                                                    <span dangerouslySetInnerHTML={{ __html: parsed }} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* JSON Preview */}
                                            <details className="text-[10px]">
                                                <summary className="cursor-pointer text-white/40 hover:text-white/60 mb-2">
                                                    Ver JSON
                                                </summary>
                                                <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto text-white/70 font-mono">
                                                    {JSON.stringify(discordPreview, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-white/30">
                                            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">Complete el título y descripción para ver la vista previa</p>
                                        </div>
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