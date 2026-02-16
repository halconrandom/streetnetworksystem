import AppShell from '@/App';
import VaultView from './components/VaultView';

export default function VaultPage() {
  return (
    <AppShell currentView="vault" title="The Vault">
      <VaultView />
    </AppShell>
  );
}
