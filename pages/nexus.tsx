import dynamic from 'next/dynamic';
import AppShell from '../App';

const NexusView = dynamic(
    () => import('../views/NexusView'),
    { ssr: false }
);

export default function NexusPage() {
    return (
        <AppShell currentView="nexus" title="The Nexus">
            <NexusView />
        </AppShell>
    );
}
