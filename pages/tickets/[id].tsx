import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { queryOne, query } from '@lib/db';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Shield,
  CheckCircle,
  Clock,
  MessageSquare,
  StickyNote,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketDetail {
  id: string;
  ticket_number: number;
  thread_id: string | null;
  category: string;
  status: string;
  claimed_by_name: string | null;
  closed_by_name: string | null;
  opened_by_name: string | null;
  full_name: string | null;
  contact_preference: string | null;
  active_project_name: string | null;
  bug_reported: string | null;
  support_needed: string | null;
  project_description: string | null;
  project_budget: string | null;
  inquiry_description: string | null;
  transcript_code: string | null;
  resolution: string | null;
  created_at: string;
  closed_at: string | null;
}

interface Message {
  id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  created_at: string;
}

interface Note {
  note_number: number;
  author_id: string;
  content: string;
  created_at: string;
}

interface Props {
  ticket: TicketDetail;
  messages: Message[];
  notes: Note[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusVariant(s: string): 'success' | 'warning' | 'default' | 'outline' {
  const v = s?.toLowerCase();
  if (v === 'open') return 'success';
  if (v === 'claimed') return 'warning';
  if (v === 'closed') return 'default';
  return 'outline';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="p-0.5 hover:text-violet-600 transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isSystem = !msg.user_name || msg.user_name === 'System';

  if (isSystem) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-0.5 bg-black/10" />
        <span className="font-display font-bold text-xs uppercase text-slate-500 tracking-wider px-2">
          {msg.content}
        </span>
        <div className="flex-1 h-0.5 bg-black/10" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="w-9 h-9 bg-violet-200 border-2 border-black shrink-0 mt-0.5 overflow-hidden">
        <img
          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${msg.user_id}`}
          alt={msg.user_name ?? 'User'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-sm text-black">{msg.user_name}</span>
          <span className="text-xs font-sans text-slate-400">{formatDate(msg.created_at)}</span>
        </div>
        <div className="bg-[#fdfbf7] border-2 border-black p-3 text-sm font-sans text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {msg.content.split(/(\s+)/).map((word, i) => {
            if (word.startsWith('@'))
              return <span key={i} className="bg-violet-100 text-violet-700 px-1 font-bold">{word}</span>;
            if (word.startsWith('http'))
              return <a key={i} href={word} target="_blank" rel="noreferrer" className="text-violet-600 underline hover:text-violet-800">{word}</a>;
            return word;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Note bubble ─────────────────────────────────────────────────────────────

function NoteBubble({ note }: { note: Note }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 bg-yellow-300 border-2 border-black shrink-0 mt-0.5 flex items-center justify-center">
        <StickyNote className="w-4 h-4 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-xs text-slate-500 uppercase">
            Nota #{note.note_number}
          </span>
          <span className="text-xs font-sans text-slate-400">{formatDate(note.created_at)}</span>
        </div>
        <div className="bg-yellow-50 border-2 border-black p-3 text-sm font-sans text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {note.content}
        </div>
      </div>
    </div>
  );
}

// ─── Metadata row ─────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b-2 border-black last:border-b-0">
      <p className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="font-sans text-sm text-black break-words">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketDetailPage({ ticket, messages, notes }: Props) {
  const [tab, setTab] = useState<'messages' | 'notes'>('messages');
  const [search, setSearch] = useState('');

  const filteredMessages = messages.filter(
    (m) => !search || m.content.toLowerCase().includes(search.toLowerCase()) || (m.user_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const metaFields = [
    { label: 'Nombre completo',      value: ticket.full_name },
    { label: 'Contacto preferido',   value: ticket.contact_preference },
    { label: 'Proyecto activo',      value: ticket.active_project_name },
    { label: 'Soporte necesario',    value: ticket.support_needed },
    { label: 'Bug reportado',        value: ticket.bug_reported },
    { label: 'Consulta',             value: ticket.inquiry_description },
    { label: 'Descripción proyecto', value: ticket.project_description },
    { label: 'Presupuesto',          value: ticket.project_budget },
    { label: 'Resolución',           value: ticket.resolution },
    { label: 'Transcript code',      value: ticket.transcript_code },
    { label: 'Thread ID',            value: ticket.thread_id },
    { label: 'ID',                   value: ticket.id },
  ];

  return (
    <div className="space-y-5">

      {/* Back + Toolbar */}
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="flex items-center gap-2 font-display font-bold text-sm uppercase text-slate-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Tickets
        </Link>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] border-2 border-black font-display font-bold text-xs uppercase neo-shadow-sm hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 border-2 border-black font-display font-bold text-xs uppercase neo-shadow-sm hover:bg-rose-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 text-rose-700">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>
      </div>

      {/* Ticket header */}
      <div className="neo-panel overflow-hidden">
        <div className="bg-yellow-300 border-b-2 border-black px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-2xl text-black">Ticket #{ticket.ticket_number}</span>
            <Badge variant={statusVariant(ticket.status)} className="capitalize">{ticket.status}</Badge>
            <span className="font-sans text-xs text-slate-700 bg-black/10 px-2 py-0.5 border border-black/20">
              {ticket.category}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans text-slate-700">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatShort(ticket.created_at)}
            </span>
            {ticket.closed_at && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {formatShort(ticket.closed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b-2 border-black">
          {ticket.opened_by_name && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f4f1ea] border-2 border-black flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500">Abierto por</p>
                <p className="font-display font-bold text-sm text-black">{ticket.opened_by_name}</p>
              </div>
            </div>
          )}
          {ticket.claimed_by_name && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-200 border-2 border-black flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-700" />
              </div>
              <div>
                <p className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500">Reclamado por</p>
                <p className="font-display font-bold text-sm text-black">{ticket.claimed_by_name}</p>
              </div>
            </div>
          )}
          {ticket.closed_by_name && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-200 border-2 border-black flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500">Cerrado por</p>
                <p className="font-display font-bold text-sm text-black">{ticket.closed_by_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main: Conversation + Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Conversation */}
        <div className="lg:col-span-2 neo-panel overflow-hidden flex flex-col">

          {/* Tabs + Search */}
          <div className="border-b-2 border-black bg-[#fdfbf7] px-4 pt-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTab('messages')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-2 border-b-0 font-display font-bold text-sm uppercase transition-all duration-75',
                  tab === 'messages' ? 'bg-yellow-300 border-black text-black' : 'bg-transparent border-transparent text-slate-500 hover:text-black'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Mensajes
                <span className="bg-black text-white text-xs px-1.5 font-bold">{messages.length}</span>
              </button>
              <button
                onClick={() => setTab('notes')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-2 border-b-0 font-display font-bold text-sm uppercase transition-all duration-75',
                  tab === 'notes' ? 'bg-yellow-300 border-black text-black' : 'bg-transparent border-transparent text-slate-500 hover:text-black'
                )}
              >
                <StickyNote className="w-4 h-4" />
                Notas
                <span className="bg-black text-white text-xs px-1.5 font-bold">{notes.length}</span>
              </button>
            </div>

            {tab === 'messages' && (
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full h-8 pl-8 pr-3 text-xs border-2 border-black bg-[#fdfbf7] font-sans focus:outline-none focus:shadow-[2px_2px_0px_#000] transition-all"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 max-h-[600px] custom-scrollbar">
            {tab === 'messages' ? (
              filteredMessages.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-display font-bold text-slate-400 uppercase text-sm">Sin mensajes</p>
                </div>
              ) : (
                filteredMessages.map((m) => <MessageBubble key={m.id} msg={m} />)
              )
            ) : notes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-display font-bold text-slate-400 uppercase text-sm">Sin notas internas</p>
              </div>
            ) : (
              notes.map((n) => <NoteBubble key={n.note_number} note={n} />)
            )}
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          <div className="neo-panel overflow-hidden">
            <div className="bg-[#f4f1ea] border-b-2 border-black px-4 py-2.5">
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-slate-600">Detalles</h3>
            </div>
            <div className="px-4 divide-y-0">
              {metaFields.map((f) => <MetaRow key={f.label} label={f.label} value={f.value} />)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const id = params?.id as string;

  try {
    const [ticket, messages, notes] = await Promise.all([
      queryOne<TicketDetail>(
        `SELECT id, ticket_number, thread_id, category, status,
                claimed_by_name, closed_by_name, opened_by_name, full_name,
                contact_preference, active_project_name, bug_reported, support_needed,
                project_description, project_budget, inquiry_description, transcript_code,
                resolution, created_at, closed_at
         FROM sn_tickets WHERE id = $1`,
        [id]
      ),
      query<Message>(
        `SELECT id, user_id, user_name, content, created_at
         FROM sn_ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
        [id]
      ),
      query<Note>(
        `SELECT note_number, author_id, content, created_at
         FROM sn_notes WHERE ticket_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
        [id]
      ),
    ]);

    if (!ticket) return { notFound: true };

    const toIso = (v: any) => (v ? new Date(v).toISOString() : null);

    return {
      props: {
        ticket: { ...ticket, created_at: toIso(ticket.created_at)!, closed_at: toIso(ticket.closed_at) },
        messages: messages.map((m) => ({ ...m, created_at: toIso(m.created_at)! })),
        notes: notes.map((n) => ({ ...n, created_at: toIso(n.created_at)! })),
      },
    };
  } catch (error) {
    console.error('[Ticket Detail getServerSideProps]', error);
    return { notFound: true };
  }
};
