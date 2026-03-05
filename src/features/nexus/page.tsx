'use client';

import dynamic from 'next/dynamic';
import AppShell from '@/core/AppShell';

const NexusView = dynamic(() => import('./components/NexusView'), { ssr: false });

export default function NexusPage() {
  return (
    <AppShell currentView="nexus" title="The Nexus">
      <NexusView />
    </AppShell>
  );
}
