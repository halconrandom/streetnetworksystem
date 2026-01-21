import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TicketStatus } from '../types';
import { Search, Filter, MoreVertical, MessageSquare, RotateCcw } from '../components/Icons';
import { StatusBadge } from '../components/UI';
import { formatRelativeTime } from '../utils/time';
import { getApiBase, getApiKey } from '../utils/api';

interface TicketListProps {
  onSelectTicket: (ticketId: string) => void;
}

const TICKETS = [
    { id: 'ticket-1829', subject: 'Appeal Ban Request', user: 'dark_slayer_99', status: TicketStatus.CLOSED, date: '2h ago' },
    { id: 'ticket-1830', subject: 'Report User Violation', user: 'pixie_dust', status: TicketStatus.OPEN, date: '5h ago' },
    { id: 'ticket-1831', subject: 'Donation Issue', user: 'kyle_ren', status: TicketStatus.CLAIMED, date: '1d ago' },
    { id: 'ticket-1832', subject: 'Bug Report: Login', user: 'system_shock', status: TicketStatus.OPEN, date: '2d ago' },
];

type TicketRow = {
    id: string;
    ticket_number: string | number | null;
    category: string | null;
    status: string | null;
    created_at: string;
    opened_by_name: string | null;
    full_name: string | null;
    active_project_name: string | null;
    support_needed: string | null;
    bug_reported: string | null;
    inquiry_description: string | null;
    project_description: string | null;
};

const mapStatus = (value: string | null): TicketStatus => {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('claim')) return TicketStatus.CLAIMED;
    if (normalized.includes('close')) return TicketStatus.CLOSED;
    return TicketStatus.OPEN;
};

const buildSubject = (row: TicketRow): string => {
    return (
        row.support_needed ||
        row.bug_reported ||
        row.inquiry_description ||
        row.active_project_name ||
        row.project_description ||
        `Ticket ${row.ticket_number ?? row.id}`
    );
};

const formatTicketDisplayId = (ticketNumber: string | number | null, fallbackId: string) => {
    const raw = ticketNumber == null ? '' : String(ticketNumber).trim();
    if (raw.startsWith('ticket-')) return raw;
    const numeric = raw.match(/^\d+$/) ? raw.padStart(4, '0') : raw;
    return `ticket-${numeric || fallbackId}`;
};

type TicketListItem = {
    id: string;
    subject: string;
    user: string;
    status: TicketStatus;
    date: string;
    displayId?: string;
};

export const TicketList: React.FC<TicketListProps> = ({ onSelectTicket }) => {
  const apiBase = useMemo(() => getApiBase(), []);
  const apiKey = useMemo(() => getApiKey(), []);
  const [tickets, setTickets] = useState<TicketListItem[]>(TICKETS);

  const loadTickets = useCallback(async () => {
    console.log('[Tickets] API base:', apiBase || '(empty)');
    console.log('[Tickets] API key set:', Boolean(apiKey));
    if (!apiBase) return;
    try {
        const res = await fetch(`${apiBase}/tickets`, {
            headers: apiKey ? { 'x-api-key': apiKey } : {},
        });
        if (!res.ok) throw new Error('Failed to load tickets');
        const rows: TicketRow[] = await res.json();
        if (!Array.isArray(rows)) return;
        const mapped = rows.map((row) => {
            const displayId = formatTicketDisplayId(row.ticket_number, row.id);
            return {
                id: row.id,
                subject: buildSubject(row),
                user: row.opened_by_name || row.full_name || row.id,
                status: mapStatus(row.status),
                date: formatRelativeTime(row.created_at),
                displayId,
            };
        });
        setTickets(mapped);
    } catch (err) {
        console.error('Failed to load tickets', err);
    }
  }, [apiBase, apiKey]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadTickets();
    }, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [loadTickets]);

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white">Transcripts</h1>
                <p className="text-terminal-muted text-sm mt-1">Manage and view closed ticket archives.</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted" />
                     <input 
                        type="text" 
                        placeholder="Search tickets..." 
                        className="bg-terminal-panel border border-terminal-border rounded-md pl-9 pr-3 py-1.5 text-sm text-white placeholder-terminal-muted focus:border-terminal-accent focus:outline-none w-64"
                     />
                </div>
                <button
                    className="p-2 bg-terminal-panel border border-terminal-border rounded-md text-terminal-muted hover:text-white"
                    onClick={loadTickets}
                    title="Refresh"
                    type="button"
                >
                    <RotateCcw size={16} />
                </button>
                <button className="p-2 bg-terminal-panel border border-terminal-border rounded-md text-terminal-muted hover:text-white">
                    <Filter size={16} />
                </button>
            </div>
        </div>

        <div className="bg-terminal-panel border border-terminal-border rounded-lg overflow-hidden flex-1">
            <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-terminal-muted border-b border-terminal-border uppercase text-xs font-mono">
                    <tr>
                        <th className="px-6 py-3 font-medium">Ticket ID</th>
                        <th className="px-6 py-3 font-medium">Subject</th>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border">
                    {tickets.map((t) => (
                        <tr key={t.id} onClick={() => onSelectTicket(t.id)} className="hover:bg-white/5 cursor-pointer transition-colors group">
                            <td className="px-6 py-4 font-mono text-terminal-accent max-w-[140px]">
                                <span className="block truncate" title={t.displayId ?? t.id}>
                                    {t.displayId ?? t.id}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-white font-medium">
                                <div className="flex items-center gap-2 max-w-[360px]">
                                    <MessageSquare size={14} className="text-terminal-muted" />
                                    <span className="truncate" title={t.subject}>
                                        {t.subject}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-terminal-muted max-w-[180px]">
                                <span className="block truncate" title={t.user}>
                                    {t.user}
                                </span>
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                            <td className="px-6 py-4 text-terminal-muted max-w-[140px]">
                                <span className="block truncate" title={t.date}>
                                    {t.date}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-terminal-muted hover:text-white"><MoreVertical size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
