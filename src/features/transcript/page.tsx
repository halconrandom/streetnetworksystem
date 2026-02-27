import { useRouter } from 'next/router';
import AppShell from '@/core/AppShell';
import { TranscriptView } from './components/TranscriptView';

export default function TranscriptDetailPage() {
  const router = useRouter();
  const ticketId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id ?? null;

  return (
    <AppShell currentView="tickets" title="Transcript Detail">
      <TranscriptView ticketId={ticketId} onBack={() => router.push('/tickets')} />
    </AppShell>
  );
}
