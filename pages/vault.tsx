import { useRouter } from 'next/router';
import AppShell from '../App';
import VaultView from '../views/VaultView';

export default function VaultPage() {
    return (
        <AppShell currentView="vault" title="The Vault">
            <VaultView />
        </AppShell>
    );
}
