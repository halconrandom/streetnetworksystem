import { useRouter } from 'next/router';
import AppShell from '@/core/AppShell';
import { TicketList } from './components/TicketList';

export default function TicketsPage() {
  const router = useRouter();
  return (
    <AppShell currentView="tickets" title="Transcripts">
      <TicketList onSelectTicket={(ticketId) => router.push(`/tickets/${ticketId}`)} />
    </AppShell>
  );
}
