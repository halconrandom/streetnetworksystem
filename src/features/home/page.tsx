import AppShell from '@/App';
import { HomeView } from './components/HomeView';

export default function HomePage() {
    return (
        <AppShell currentView="home" title="Control Center">
            {({ flags }) => <HomeView flags={flags} />}
        </AppShell>
    );
}
