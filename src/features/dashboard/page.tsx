import AppShell from '@/core/AppShell';
import { DashboardView } from './components/DashboardView';

export default function DashboardPage() {
  return (
    <AppShell currentView="dashboard" title="System Overview">
      <DashboardView />
    </AppShell>
  );
}
