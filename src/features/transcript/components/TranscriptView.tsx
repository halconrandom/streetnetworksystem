import React, { useEffect, useMemo, useState } from 'react';
import { ActionToolbar } from '@/components/ActionToolbar';
import { TicketMetadata } from '@/components/TicketMetadata';
import { Conversation } from '@/components/Conversation';
import { ArrowLeft } from '@/components/Icons';
import { Message, Note, Ticket, TicketStatus, User, UserRole } from '@/types';
import { getApiBase, getApiKey } from '@/utils/api';
import { formatFullDateTime, formatRelativeTime } from '@/utils/time';

interface TranscriptViewProps {
  onBack: () => void;
  ticketId: string | null;
}

type TicketRow = {
  id: string;
  ticket_number: string | number | null;
  user_id: string | null;
  thread_id: string | null;
  category: string | null;
  status: string | null;
  claimed_by: string | null;
  created_at: string;
  closed_at: string | null;
  resolution: string | null;
  opened_by_name: string | null;
  claimed_by_name: string | null;
  closed_by: string | null;
  closed_by_name: string | null;
  full_name: string | null;
  contact_preference: string | null;
  active_project_name: string | null;
  support_needed: string | null;
  bug_reported: string | null;
  inquiry_description: string | null;
  project_description: string | null;
  project_budget: string | null;
  transcript_code: string | null;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  user_name: string | null;
};

type NoteRow = {
  note_number: number;
  ticket_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
};

const mapStatus = (value: string | null): TicketStatus => {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('claim')) return TicketStatus.CLAIMED;
  if (normalized.includes('close')) return TicketStatus.CLOSED;
  return TicketStatus.OPEN;
};

const buildSubject = (row: TicketRow): string => {
  return row.support_needed || row.bug_reported || row.inquiry_description || row.active_project_name || row.project_description || `Ticket ${row.ticket_number ?? row.id}`;
};

const avatarFromName = (name: string) => {
  const safe = encodeURIComponent(name || 'User');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${safe}`;
};

const formatTicketDisplayId = (ticketNumber: string | number | null, fallbackId: string) => {
  const raw = ticketNumber == null ? '' : String(ticketNumber).trim();
  if (raw.startsWith('ticket-')) return raw;
  const numeric = raw.match(/^\d+$/) ? raw.padStart(4, '0') : raw;
  return `ticket-${numeric || fallbackId}`;
};

export const TranscriptView: React.FC<TranscriptViewProps> = ({ onBack, ticketId }) => {
  const apiBase = useMemo(() => getApiBase(), []);
  const apiKey = useMemo(() => getApiKey(), []);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!ticketId || !apiBase) return;
    const load = async () => {
      try {
        const headers = apiKey ? { 'x-api-key': apiKey } : {};
        const [ticketRes, messagesRes, notesRes] = await Promise.all([
          fetch(`${apiBase}/tickets/${ticketId}`, { headers }),
          fetch(`${apiBase}/tickets/${ticketId}/messages`, { headers }),
          fetch(`${apiBase}/tickets/${ticketId}/notes`, { headers }),
        ]);
        if (!ticketRes.ok) throw new Error('Failed to load ticket');
        if (!messagesRes.ok) throw new Error('Failed to load messages');
        if (!notesRes.ok) throw new Error('Failed to load notes');

        const ticketRow: TicketRow = await ticketRes.json();
        const messagesRows: MessageRow[] = await messagesRes.json();
        const notesRows: NoteRow[] = await notesRes.json();

        const openedByName = ticketRow.opened_by_name || ticketRow.full_name || 'Unknown';
        const openedByUser: User = {
          id: ticketRow.user_id || ticketRow.id,
          username: openedByName,
          role: UserRole.USER,
          avatarUrl: avatarFromName(openedByName),
        };
        const claimedByUser: User | undefined = ticketRow.claimed_by_name
          ? {
              id: ticketRow.claimed_by || 'claimed',
              username: ticketRow.claimed_by_name,
              role: UserRole.ADMIN,
              avatarUrl: avatarFromName(ticketRow.claimed_by_name),
            }
          : undefined;
        const closedByUser: User | undefined = ticketRow.closed_by_name
          ? {
              id: ticketRow.closed_by || 'closed',
              username: ticketRow.closed_by_name,
              role: UserRole.ADMIN,
              avatarUrl: avatarFromName(ticketRow.closed_by_name),
            }
          : undefined;
        const systemUser: User = {
          id: 'system',
          username: 'Ticket Bot',
          role: UserRole.SYSTEM,
          avatarUrl: '',
        };

        const chatMessages: Message[] = Array.isArray(messagesRows)
          ? messagesRows.map((row) => {
              const name = row.user_name || 'Unknown';
              const role = row.user_id === ticketRow.claimed_by || row.user_id === ticketRow.closed_by ? UserRole.ADMIN : UserRole.USER;
              return {
                id: row.id,
                user: {
                  id: row.user_id || row.id,
                  username: name,
                  role,
                  avatarUrl: avatarFromName(name),
                },
                content: row.content || '',
                timestamp: row.created_at,
                type: 'chat',
              };
            })
          : [];

        const logMessages: Message[] = [];
        const createdTime = ticketRow.created_at ? new Date(ticketRow.created_at).getTime() : null;
        const latestChatTime = chatMessages.length ? new Date(chatMessages[chatMessages.length - 1].timestamp).getTime() : null;
        if (ticketRow.created_at) {
          logMessages.push({
            id: `${ticketRow.id}-created`,
            user: systemUser,
            content: `Ticket created in #${ticketRow.category || 'general'} by ${openedByName}.`,
            timestamp: ticketRow.created_at,
            type: 'log',
          });
        }
        if (ticketRow.closed_at && ticketRow.closed_by_name) {
          const closedTimeRaw = new Date(ticketRow.closed_at).getTime();
          const anchorTime = Math.max(createdTime ?? closedTimeRaw, latestChatTime ? latestChatTime + 1000 : closedTimeRaw);
          const closedTime = Math.max(closedTimeRaw, anchorTime);
          logMessages.push({
            id: `${ticketRow.id}-closed`,
            user: systemUser,
            content: `Ticket marked as Closed by ${ticketRow.closed_by_name}.`,
            timestamp: new Date(closedTime).toISOString(),
            type: 'log',
          });
        }

        const mergedMessages = [...chatMessages, ...logMessages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const notes: Note[] = Array.isArray(notesRows)
          ? notesRows.map((row) => ({
              id: `note-${row.note_number}`,
              noteNumber: row.note_number,
              authorId: row.author_id,
              content: row.content || '',
              createdAt: row.created_at,
            }))
          : [];

        setTicket({
          id: formatTicketDisplayId(ticketRow.ticket_number, ticketRow.id),
          databaseId: ticketRow.id,
          category: ticketRow.category || 'general',
          status: mapStatus(ticketRow.status),
          subject: buildSubject(ticketRow),
          openedBy: openedByUser,
          claimedBy: claimedByUser,
          closedBy: closedByUser,
          createdAt: ticketRow.created_at,
          closedAt: ticketRow.closed_at || undefined,
          resolution: ticketRow.resolution || undefined,
          fullName: ticketRow.full_name || undefined,
          contactPreference: ticketRow.contact_preference || undefined,
          activeProjectName: ticketRow.active_project_name || undefined,
          supportNeeded: ticketRow.support_needed || undefined,
          bugReported: ticketRow.bug_reported || undefined,
          inquiryDescription: ticketRow.inquiry_description || undefined,
          projectDescription: ticketRow.project_description || undefined,
          projectBudget: ticketRow.project_budget || undefined,
          transcriptCode: ticketRow.transcript_code || undefined,
          threadId: ticketRow.thread_id || undefined,
          messages: mergedMessages,
          notes,
        });
      } catch (err) {
        console.error('Failed to load transcript', err);
      }
    };
    load();
  }, [apiBase, apiKey, ticketId]);

  return (
    <div className="flex flex-col h-full bg-terminal-dark animate-fade-in-up">
      <div className="h-14 border-b border-terminal-border bg-terminal-panel px-6 flex items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-terminal-muted hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>
      </div>

      <ActionToolbar />

      <div className="flex-1 overflow-hidden relative">
        <div className="h-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
          {!ticketId && <div className="text-terminal-muted text-sm">No ticket selected.</div>}
          {ticketId && !ticket && <div className="text-terminal-muted text-sm">Loading transcript...</div>}
          {ticket && (
            <>
              <div className="flex-shrink-0">
                <TicketMetadata ticket={ticket} />
              </div>
              <Conversation ticket={ticket} />
              <div className="mt-4 flex-shrink-0 bg-terminal-panel border border-terminal-border rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 border-b border-terminal-border flex items-center justify-between gap-4 bg-terminal-panel">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span>Staff notes</span>
                    <span className="ml-2 px-2 py-0.5 bg-terminal-border rounded-full text-xs text-terminal-muted">{ticket.notes?.length ?? 0}</span>
                  </div>
                  <span className="text-xs text-terminal-muted">Staff-only</span>
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {(ticket.notes?.length ?? 0) === 0 ? (
                    <div className="text-terminal-muted text-sm">No staff notes for this ticket.</div>
                  ) : (
                    ticket.notes?.map((note) => (
                      <div key={note.id} className="border border-terminal-border rounded-md bg-black/30 p-3">
                        <div className="flex items-center justify-between gap-3 text-xs text-terminal-muted mb-2">
                          <div className="font-mono">#{String(note.noteNumber).padStart(3, '0')} - {note.authorId}</div>
                          <span title={formatFullDateTime(note.createdAt)}>{formatRelativeTime(note.createdAt)}</span>
                        </div>
                        <div className="text-sm text-terminal-text whitespace-pre-wrap">{note.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
