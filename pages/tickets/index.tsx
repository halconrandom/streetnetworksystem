import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { query } from '@lib/db';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Ticket, Search, ChevronRight, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketRow {
  id: string;
  ticket_number: number;
  category: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  full_name: string | null;
  opened_by_name: string | null;
}

interface Props {
  tickets: TicketRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'open', 'claimed', 'closed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function statusVariant(status: string): 'success' | 'warning' | 'default' | 'outline' {
  const s = status?.toLowerCase();
  if (s === 'open') return 'success';
  if (s === 'claimed') return 'warning';
  if (s === 'closed') return 'default';
  return 'outline';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketsPage({ tickets }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status?.toLowerCase() === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(t.ticket_number).includes(q) ||
        (t.full_name ?? '').toLowerCase().includes(q) ||
        (t.opened_by_name ?? '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tickets, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => t.status?.toLowerCase() === 'open').length,
      claimed: tickets.filter((t) => t.status?.toLowerCase() === 'claimed').length,
      closed: tickets.filter((t) => t.status?.toLowerCase() === 'closed').length,
    }),
    [tickets]
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="neo-panel p-5 bg-yellow-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fdfbf7] border-2 border-black flex items-center justify-center neo-shadow-sm">
            <Ticket className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-black">Tickets</h1>
            <p className="text-sm font-sans font-medium text-slate-700">{tickets.length} tickets en total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 border-2 font-display font-bold text-xs uppercase transition-all duration-75',
                statusFilter === s
                  ? 'bg-black text-white border-black neo-shadow-sm -translate-x-[2px] -translate-y-[2px]'
                  : 'bg-[#fdfbf7] text-slate-600 border-black hover:bg-[#f4f1ea]'
              )}
            >
              {s} <span className="opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ticket, nombre..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="neo-panel overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[56px_1fr_120px_140px_140px_40px] border-b-2 border-black bg-[#f4f1ea] px-4 py-2.5 gap-4">
          {['#', 'Ticket', 'Categoría', 'Estado', 'Fecha', ''].map((h) => (
            <span key={h} className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display font-bold text-slate-400 uppercase text-sm">No se encontraron tickets</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="grid grid-cols-[56px_1fr_120px_140px_140px_40px] items-center px-4 py-3.5 gap-4 hover:bg-[#f4f1ea] transition-colors group"
              >
                {/* Number */}
                <span className="font-display font-bold text-sm text-slate-500">#{t.ticket_number}</span>

                {/* Name / opener */}
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-black truncate">
                    {t.full_name || t.opened_by_name || 'Sin nombre'}
                  </p>
                  {t.opened_by_name && t.full_name && (
                    <p className="text-xs font-sans text-slate-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" /> {t.opened_by_name}
                    </p>
                  )}
                </div>

                {/* Category */}
                <span className="font-sans text-xs font-medium text-slate-600 truncate">{t.category}</span>

                {/* Status */}
                <div>
                  <Badge variant={statusVariant(t.status)} className="capitalize">
                    {t.status ?? '—'}
                  </Badge>
                </div>

                {/* Date */}
                <p className="text-xs font-sans text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatDate(t.created_at)}
                </p>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const tickets = await query<TicketRow>(
      `SELECT id, ticket_number, category, status, created_at, closed_at, full_name, opened_by_name
       FROM sn_tickets
       ORDER BY created_at DESC
       LIMIT 200`
    );

    return {
      props: {
        tickets: tickets.map((t) => ({
          ...t,
          created_at: t.created_at ? new Date(t.created_at).toISOString() : '',
          closed_at: t.closed_at ? new Date(t.closed_at).toISOString() : null,
        })),
      },
    };
  } catch (error) {
    console.error('[Tickets getServerSideProps]', error);
    return { props: { tickets: [] } };
  }
};
