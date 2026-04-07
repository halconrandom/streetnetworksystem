import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { query } from '@lib/db';
import { Input } from '@/components/ui/input';
import { ClipboardList, Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: number;
  action: string;
  actor_email: string | null;
  target_email: string | null;
  metadata: any;
  created_at: string;
  ip: string | null;
}

interface Props {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 25;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function actionColor(action: string) {
  if (action.includes('delete') || action.includes('remove')) return 'bg-rose-300';
  if (action.includes('create') || action.includes('add'))    return 'bg-emerald-300';
  if (action.includes('update') || action.includes('patch'))  return 'bg-cyan-300';
  return 'bg-slate-200';
}

export default function AuditPage({ logs: initialLogs, total, page: initialPage, totalPages: initialTotalPages }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (p: number, action?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (action) params.set('action', action);
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setLogs(data.rows ?? []);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-panel p-5 bg-yellow-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fdfbf7] border-2 border-black flex items-center justify-center neo-shadow-sm">
            <ClipboardList className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-black">Audit Log</h1>
            <p className="text-sm font-sans font-medium text-slate-700">{total} eventos registrados</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); fetchLogs(1, e.target.value); }}
            placeholder="Filtrar por acción..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Log table */}
      <div className="neo-panel overflow-hidden">
        <div className="grid grid-cols-[1fr_160px_160px_140px_100px] border-b-2 border-black bg-[#f4f1ea] px-4 py-2.5 gap-4">
          {['Acción', 'Actor', 'Target', 'Fecha', 'IP'].map(h => (
            <span key={h} className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="font-display font-bold text-slate-400 uppercase text-sm">Cargando...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-display font-bold text-slate-400 uppercase text-sm">Sin registros</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {logs.map(log => (
              <div key={log.id} className="grid grid-cols-[1fr_160px_160px_140px_100px] items-center px-4 py-3 gap-4 hover:bg-[#f4f1ea] transition-colors">
                {/* Action */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full border border-black shrink-0 ${actionColor(log.action)}`} />
                  <span className="font-display font-bold text-sm text-black truncate">{log.action}</span>
                </div>
                <span className="font-sans text-xs text-slate-600 truncate">{log.actor_email ?? '—'}</span>
                <span className="font-sans text-xs text-slate-600 truncate">{log.target_email ?? '—'}</span>
                <span className="font-sans text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatDate(log.created_at)}
                </span>
                <span className="font-sans text-xs text-slate-500 truncate">{log.ip ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-sm text-slate-500 uppercase">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1, search)}
              disabled={page <= 1}
              className="p-2 border-2 border-black neo-shadow-sm bg-[#fdfbf7] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchLogs(page + 1, search)}
              disabled={page >= totalPages}
              className="p-2 border-2 border-black neo-shadow-sm bg-[#fdfbf7] hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM sn_audit_logs');
    const total = parseInt(countResult[0]?.count || '0');

    const logs = await query<AuditLog>(
      `SELECT al.id, al.action, al.created_at, al.ip, al.metadata,
              u.email as actor_email, t.email as target_email
       FROM sn_audit_logs al
       LEFT JOIN sn_users u ON al.actor_user_id = u.id
       LEFT JOIN sn_users t ON al.target_user_id = t.id
       ORDER BY al.created_at DESC
       LIMIT ${PAGE_SIZE}`
    );

    return {
      props: {
        logs: logs.map(l => ({ ...l, created_at: new Date(l.created_at).toISOString() })),
        total, page: 1,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  } catch (e) {
    console.error('[Audit getServerSideProps]', e);
    return { props: { logs: [], total: 0, page: 1, totalPages: 1 } };
  }
};
