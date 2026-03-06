'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2, Edit2, Check, X, Hash } from 'lucide-react';

export interface ReviewChannel {
  id: string;
  name: string;
  channel_id: string;
  created_at: string;
}

type Props = {
  selectedChannelId: string | null;
  onSelectChannel: (channel: ReviewChannel | null) => void;
};

export function ReviewChannelSelector({ selectedChannelId, onSelectChannel }: Props) {
  const [channels, setChannels] = useState<ReviewChannel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state for adding/editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formChannelId, setFormChannelId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  // Fetch channels
  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/review-channels', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowManage(false);
        setEditingId(null);
        setError(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddChannel = async () => {
    if (!formName.trim() || !formChannelId.trim()) {
      setError('Nombre y Channel ID son requeridos');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/review-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formName, channelId: formChannelId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear');

      setChannels(prev => [data.channel, ...prev]);
      setFormName('');
      setFormChannelId('');
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChannel = async (id: string) => {
    if (!formName.trim() || !formChannelId.trim()) {
      setError('Nombre y Channel ID son requeridos');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/review-channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formName, channelId: formChannelId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');

      setChannels(prev => prev.map(c => c.id === id ? data.channel : c));
      setEditingId(null);
      setFormName('');
      setFormChannelId('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('¿Eliminar este canal?')) return;

    try {
      const res = await fetch(`/api/review-channels/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      setChannels(prev => prev.filter(c => c.id !== id));
      if (selectedChannelId === id) {
        onSelectChannel(null);
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const startEdit = (channel: ReviewChannel) => {
    setEditingId(channel.id);
    setFormName(channel.name);
    setFormChannelId(channel.channel_id);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormName('');
    setFormChannelId('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-white/40 text-[10px]">
        Cargando canales...
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
      >
        <Hash size={12} className="text-terminal-accent" />
        <span className="text-white/60">
          {selectedChannel ? selectedChannel.name : 'Seleccionar canal'}
        </span>
        <ChevronDown size={12} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-terminal-panel border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {!showManage ? (
            <>
              {/* Channel list */}
              <div className="max-h-48 overflow-y-auto">
                {channels.length === 0 ? (
                  <div className="px-4 py-6 text-center text-white/40 text-xs">
                    No hay canales configurados
                  </div>
                ) : (
                  channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        onSelectChannel(channel);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                        selectedChannelId === channel.id
                          ? 'bg-terminal-accent/10 text-terminal-accent'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Hash size={14} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{channel.name}</div>
                        <div className="text-[10px] text-white/30 font-mono truncate">{channel.channel_id}</div>
                      </div>
                      {selectedChannelId === channel.id && (
                        <Check size={14} className="text-terminal-accent" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Manage button */}
              <div className="border-t border-white/5">
                <button
                  onClick={() => {
                    setShowManage(true);
                    setEditingId('new');
                    setFormName('');
                    setFormChannelId('');
                    setError(null);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  <Plus size={14} />
                  Gestionar canales
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Manage view */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gestionar Canales</span>
                <button
                  onClick={() => {
                    setShowManage(false);
                    cancelEdit();
                  }}
                  className="text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Add new form */}
              {editingId === 'new' && (
                <div className="p-4 border-b border-white/5 space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre (ej: Reviews ES)"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-terminal-accent/50"
                  />
                  <input
                    type="text"
                    placeholder="Channel ID (17-20 dígitos)"
                    value={formChannelId}
                    onChange={e => setFormChannelId(e.target.value.replace(/\D/g, '').slice(0, 20))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-terminal-accent/50 font-mono"
                  />
                  {error && <div className="text-[10px] text-red-400">{error}</div>}
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/60 hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddChannel}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-terminal-accent rounded-lg text-xs text-white font-bold hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Añadir'}
                    </button>
                  </div>
                </div>
              )}

              {/* Channel list for editing */}
              <div className="max-h-40 overflow-y-auto">
                {channels.map(channel => (
                  <div key={channel.id} className="border-b border-white/5 last:border-b-0">
                    {editingId === channel.id ? (
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-terminal-accent/50"
                        />
                        <input
                          type="text"
                          value={formChannelId}
                          onChange={e => setFormChannelId(e.target.value.replace(/\D/g, '').slice(0, 20))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-terminal-accent/50 font-mono"
                        />
                        {error && <div className="text-[10px] text-red-400">{error}</div>}
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-2 py-1.5 bg-white/5 rounded text-[10px] text-white/60"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleUpdateChannel(channel.id)}
                            disabled={saving}
                            className="flex-1 px-2 py-1.5 bg-emerald-600 rounded text-[10px] text-white font-bold disabled:opacity-50"
                          >
                            {saving ? '...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Hash size={12} className="text-white/30" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white truncate">{channel.name}</div>
                          <div className="text-[10px] text-white/30 font-mono truncate">{channel.channel_id}</div>
                        </div>
                        <button
                          onClick={() => startEdit(channel)}
                          className="p-1.5 text-white/30 hover:text-white transition-all"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="p-1.5 text-white/30 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new button when not in new mode */}
              {editingId !== 'new' && (
                <div className="p-3 border-t border-white/5">
                  <button
                    onClick={() => {
                      setEditingId('new');
                      setFormName('');
                      setFormChannelId('');
                      setError(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Plus size={14} />
                    Añadir canal
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
