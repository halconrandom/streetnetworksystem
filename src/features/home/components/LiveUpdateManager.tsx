import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    Save,
    Copy,
    Eye,
    Shield
} from '@/components/Icons';
import { Sparkles, Bug, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
    buildDiscordMessage,
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

const TYPE_CONFIG = {
    feat: { icon: Sparkles, color: 'emerald', label: 'Mejora' },
    fix: { icon: Bug, color: 'red', label: 'Parche' },
    security: { icon: Shield, color: 'amber', label: 'Seguridad' },
    refactor: { icon: Zap, color: 'blue', label: 'Optimización' }
} as const;

export const LiveUpdateManager: React.FC<LiveUpdateManagerProps> = ({ onClose, onUpdate }) => {
    const [updates, setUpdates] = useState<LiveUpdate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);

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
        toast.success('JSON copiado al portapapeles');
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
    const currentType = TYPE_CONFIG[formData.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.feat;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-terminal-panel border border-white/10 rounded-2xl w-full max-w-6xl h-[85vh] flex shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Sidebar - Update List */}
                <div className="w-72 border-r border-white/5 flex flex-col bg-black/30">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-sm font-black text-white uppercase tracking-tight">Actualizaciones</h2>
                        <p className="text-[10px] text-white/40 mt-1">{updates.length} entradas</p>
                    </div>
                    
                    <div className="p-3">
                        <button
                            onClick={startNew}
                            className="w-full py-2.5 bg-terminal-accent text-black text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Nueva
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-0 space-y-2">
                        {isLoading ? (
                            <div className="text-center py-8 text-white/30 text-xs">Cargando...</div>
                        ) : updates.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-xs">Sin actualizaciones</div>
                        ) : (
                            updates.map(update => {
                                const typeCfg = TYPE_CONFIG[update.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.feat;
                                const TypeIcon = typeCfg.icon;
                                const isSelected = editingId === update.id;
                                
                                return (
                                    <button
                                        key={update.id}
                                        onClick={() => startEditing(update)}
                                        className={`w-full p-3 rounded-lg text-left transition-all ${
                                            isSelected 
                                                ? 'bg-terminal-accent/20 border border-terminal-accent/40' 
                                                : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-${typeCfg.color}-500/20 text-${typeCfg.color}-400`}>
                                                <TypeIcon size={10} />
                                                {typeCfg.label}
                                            </span>
                                            <span className="text-[9px] text-white/30 font-mono ml-auto">
                                                {new Date(update.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-white/80 font-medium truncate leading-tight">
                                            {update.message}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {editingId ? (
                        <>
                            {/* Editor Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${currentType.color}-500/20`}>
                                        <currentType.icon size={16} className={`text-${currentType.color}-400`} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">
                                            {editingId === 'new' ? 'Nueva Actualización' : 'Editar Actualización'}
                                        </h3>
                                        <p className="text-[10px] text-white/40">
                                            {editingId === 'new' ? 'Crea una nueva entrada' : 'Modifica los cambios'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Editor Body */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Form */}
                                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
                                    {/* Type & Date Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-white/50 tracking-wider block mb-1.5">Tipo</label>
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-terminal-accent/50 focus:outline-none transition-colors"
                                            >
                                                <option value="feat">✨ Mejora</option>
                                                <option value="fix">🔧 Parche</option>
                                                <option value="refactor">⚡ Optimización</option>
                                                <option value="security">🔒 Seguridad</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-white/50 tracking-wider block mb-1.5">Fecha</label>
                                            <input
                                                type="date"
                                                value={formData.date?.split('T')[0]}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-terminal-accent/50 focus:outline-none transition-colors [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-white/50 tracking-wider block mb-1.5">Título</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Sistema de i18n implementado"
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-terminal-accent/50 focus:outline-none transition-colors placeholder:text-white/20"
                                        />
                                    </div>

                                    {/* Active Toggle */}
                                    <label className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-lg cursor-pointer hover:bg-white/[0.05] transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 accent-terminal-accent rounded"
                                        />
                                        <span className="text-xs text-white/70">Publicar en la página de inicio</span>
                                    </label>

                                    {/* Description */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[9px] font-bold uppercase text-white/50 tracking-wider">Descripción</label>
                                            <span className="text-[9px] text-white/30">**bold** *italic* - lista</span>
                                        </div>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder={`**Cambios realizados**
- Nueva funcionalidad: Selector de idiomas
- Mejora: Traducciones completas
- Fix: Error en selector

**Notas**
Los usuarios pueden cambiar entre EN/ES.`}
                                            className="w-full h-48 min-h-[12rem] bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:border-terminal-accent/50 focus:outline-none transition-colors resize-y custom-scrollbar font-mono leading-relaxed placeholder:text-white/15"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex-1 py-2.5 bg-terminal-accent text-black text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Save size={14} />
                                            {isSaving ? 'Guardando...' : (editingId === 'new' ? 'Publicar' : 'Guardar')}
                                        </button>
                                        <button
                                            onClick={handleCopyDiscordJson}
                                            className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <Copy size={14} />
                                            JSON
                                        </button>
                                        {editingId !== 'new' && (
                                            <button
                                                onClick={() => handleDelete(editingId as number)}
                                                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Preview Panel */}
                                <div className="w-80 border-l border-white/5 bg-[#2b2d31] flex flex-col">
                                    <div className="p-3 border-b border-white/5 flex items-center gap-2">
                                        <Eye size={12} className="text-white/40" />
                                        <span className="text-[10px] font-bold uppercase text-white/50 tracking-wider">Vista Previa</span>
                                    </div>
                                    
                                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                                        {discordPreview ? (
                                            <div 
                                                className="rounded-lg overflow-hidden"
                                                style={{
                                                    backgroundColor: '#1e2024',
                                                    borderLeft: `3px solid #${(discordPreview.components[0].accent_color || 0).toString(16).padStart(6, '0')}`
                                                }}
                                            >
                                                <div className="p-3 space-y-2">
                                                    <div className="text-white font-bold text-sm">
                                                        {formData.type === 'feat' ? '✨' : formData.type === 'fix' ? '🔧' : formData.type === 'security' ? '🔒' : '⚡'} {formData.message}
                                                    </div>
                                                    <div className="text-[#949ba4] text-[10px]">
                                                        📅 {formData.date}
                                                    </div>
                                                    <div className="border-t border-white/10 my-2" />
                                                    <div className="text-[#dbdee1] text-[11px] whitespace-pre-wrap leading-relaxed">
                                                        {formData.description.split('\n').map((line, i) => {
                                                            let parsed = line
                                                                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                                                                .replace(/\*(.+?)\*/g, '<em class="text-terminal-accent">$1</em>');
                                                            return (
                                                                <div key={i}>
                                                                    <span dangerouslySetInnerHTML={{ __html: parsed || '&nbsp;' }} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-white/30">
                                                <div className="text-2xl mb-2">📝</div>
                                                <p className="text-[10px]">Escribe para ver la vista previa</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                            <div className="text-4xl mb-3">📋</div>
                            <p className="text-sm font-medium mb-1">Selecciona una entrada</p>
                            <p className="text-[11px]">o crea una nueva actualización</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};