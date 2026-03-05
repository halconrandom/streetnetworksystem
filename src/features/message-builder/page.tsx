'use client';

import dynamic from 'next/dynamic';
import AppShell from '@/core/AppShell';

const V2BuilderView = dynamic(
  () => import('./components/V2BuilderView').then((mod) => mod.V2BuilderView),
  { ssr: false }
);

export default function MessageBuilderPage() {
  return (
    <AppShell currentView="v2_builder" title="Message Builder">
      <V2BuilderView />
    </AppShell>
  );
}
