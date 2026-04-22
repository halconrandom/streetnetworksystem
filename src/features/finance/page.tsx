import AppShell from '@/core/AppShell';
import { FinanceShell } from './components/FinanceShell';

export default function FinancePage() {
  return (
    <AppShell currentView="finance" title="Finance">
      <FinanceShell />
    </AppShell>
  );
}
