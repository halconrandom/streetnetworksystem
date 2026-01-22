import AppShell from '../../App';
import { TicketList } from '../../views/TicketList';
import { useRouter } from 'next/router';

export default function TicketsPage() {
  const router = useRouter();
  return (
    <AppShell currentView="tickets" title="Transcripts">
      <TicketList onSelectTicket={(ticketId) => router.push(`/tickets/${ticketId}`)} />
    </AppShell>
  );
}
