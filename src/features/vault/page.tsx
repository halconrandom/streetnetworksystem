import AppShell from '@/core/AppShell';
import VaultView from './components/VaultView';

export default function VaultPage() {
  return (
    <AppShell currentView="vault" title="The Vault">
      <VaultView />
    </AppShell>
  );
}
