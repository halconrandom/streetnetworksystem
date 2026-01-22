import AppShell from '../App';
import { DashboardView } from '../views/Dashboard';

export default function DashboardPage() {
  return (
    <AppShell currentView="dashboard" title="Dashboard">
      <DashboardView />
    </AppShell>
  );
}
