'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2, Edit2, Check, X, Hash } from 'lucide-react';
import { useI18n } from '../i18n/context';

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
  const { t } = useI18n();
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
      setError('Name and Channel ID are required');
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
      if (!res.ok) throw new Error(data.error || 'Error creating');

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
      setError('Name and Channel ID are required');
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
      if (!res.ok) throw new Error(data.error || 'Error updating');

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
    if (!confirm(t('confirmDelete'))) return;

    try {
      const res = await fetch(`/api/review-channels/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error deleting');

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
      <div className="flex items-center gap-2 px-3 py-2 border-2 border-black bg-[#f4f1ea] text-slate-400 text-[10px] font-black uppercase tracking-widest">
        {t('loadingChannels')}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border-2 border-black bg-[#fdfbf7] text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
      >
        <Hash size={12} className="text-violet-500" />
        <span className="text-slate-700">
          {selectedChannel ? selectedChannel.name : t('selectChannel')}
        </span>
        <ChevronDown size={12} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-[#fdfbf7] border-2 border-black shadow-[4px_4px_0px_#000] z-50 overflow-hidden">
          {!showManage ? (
            <>
              {/* Channel list */}
              <div className="max-h-48 overflow-y-auto">
                {channels.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    {t('noChannels')}
                  </div>
                ) : (
                  channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        onSelectChannel(channel);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-black/10 transition-all ${
                        selectedChannelId === channel.id
                          ? 'bg-yellow-300 text-black'
                          : 'text-slate-600 hover:bg-[#f4f1ea] hover:text-black'
                      }`}
                    >
                      <Hash size={14} className={selectedChannelId === channel.id ? 'text-black' : 'text-violet-500'} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{channel.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{channel.channel_id}</div>
                      </div>
                      {selectedChannelId === channel.id && (
                        <Check size={14} className="text-black" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Manage button */}
              <div className="border-t-2 border-black">
                <button
                  onClick={() => {
                    setShowManage(true);
                    setEditingId('new');
                    setFormName('');
                    setFormChannelId('');
                    setError(null);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-slate-500 hover:text-black hover:bg-[#f4f1ea] transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <Plus size={14} />
                  {t('manageChannels')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Manage view */}
              <div className="px-4 py-3 border-b-2 border-black flex items-center justify-between bg-[#f4f1ea]">
                <span className="text-xs font-black text-black uppercase tracking-widest">{t('channels')}</span>
                <button
                  onClick={() => {
                    setShowManage(false);
                    cancelEdit();
                  }}
                  className="p-1 border border-black bg-[#fdfbf7] text-slate-500 hover:text-black hover:bg-[#f4f1ea] transition-all"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Add new form */}
              {editingId === 'new' && (
                <div className="p-4 border-b-2 border-black space-y-3 bg-[#fdfbf7]">
                  <input
                    type="text"
                    placeholder={t('namePlaceholder')}
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 text-xs text-black placeholder-slate-400 outline-none bg-white focus:border-violet-500 font-sans"
                  />
                  <input
                    type="text"
                    placeholder={t('channelIdPlaceholder')}
                    value={formChannelId}
                    onChange={e => setFormChannelId(e.target.value.replace(/\D/g, '').slice(0, 20))}
                    className="w-full border-2 border-black px-3 py-2 text-xs text-black placeholder-slate-400 outline-none bg-white focus:border-violet-500 font-mono"
                  />
                  {error && <div className="text-[10px] text-red-600 font-bold border-l-2 border-red-600 pl-2">{error}</div>}
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-3 py-2 border-2 border-black bg-[#f4f1ea] text-xs text-slate-600 font-bold uppercase tracking-widest hover:text-black transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleAddChannel}
                      disabled={saving}
                      className="flex-1 px-3 py-2 border-2 border-black bg-violet-500 text-xs text-white font-bold uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-violet-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '...' : t('save')}
                    </button>
                  </div>
                </div>
              )}

              {/* Channel list for editing */}
              <div className="max-h-40 overflow-y-auto">
                {channels.map(channel => (
                  <div key={channel.id} className="border-b border-black/10 last:border-b-0">
                    {editingId === channel.id ? (
                      <div className="p-3 space-y-2 bg-[#fdfbf7]">
                        <input
                          type="text"
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          className="w-full border-2 border-black px-3 py-2 text-xs text-black outline-none bg-white focus:border-violet-500 font-sans"
                        />
                        <input
                          type="text"
                          value={formChannelId}
                          onChange={e => setFormChannelId(e.target.value.replace(/\D/g, '').slice(0, 20))}
                          className="w-full border-2 border-black px-3 py-2 text-xs text-black outline-none bg-white focus:border-violet-500 font-mono"
                        />
                        {error && <div className="text-[10px] text-red-600 font-bold border-l-2 border-red-600 pl-2">{error}</div>}
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-2 py-1.5 border-2 border-black bg-[#f4f1ea] text-[10px] text-slate-600 font-bold uppercase"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            onClick={() => handleUpdateChannel(channel.id)}
                            disabled={saving}
                            className="flex-1 px-2 py-1.5 border-2 border-black bg-emerald-500 text-[10px] text-white font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-emerald-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                          >
                            {saving ? '...' : t('save')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#f4f1ea] transition-all">
                        <Hash size={12} className="text-violet-500" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-black font-bold truncate">{channel.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{channel.channel_id}</div>
                        </div>
                        <button
                          onClick={() => startEdit(channel)}
                          className="p-1.5 border border-black bg-[#fdfbf7] text-slate-400 hover:text-black hover:bg-[#f4f1ea] transition-all"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="p-1.5 border border-black bg-[#fdfbf7] text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new button when not in new mode */}
              {editingId !== 'new' && (
                <div className="p-3 border-t-2 border-black bg-[#f4f1ea]">
                  <button
                    onClick={() => {
                      setEditingId('new');
                      setFormName('');
                      setFormChannelId('');
                      setError(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-black bg-[#fdfbf7] text-xs text-slate-600 font-bold uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-[#f4f1ea] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <Plus size={14} />
                    {t('addChannel')}
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