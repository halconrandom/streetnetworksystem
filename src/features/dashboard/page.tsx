import AppShell from '@/App';
import { DashboardView } from './components/DashboardView';

export default function DashboardPage() {
  return (
    <AppShell currentView="dashboard" title="Dashboard">
      <DashboardView />
    </AppShell>
  );
}
