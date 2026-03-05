'use client';

import AppShell from '@/core/AppShell';
import { HomeView } from './components/HomeView';

export default function HomePage() {
    return (
        <AppShell currentView="home" title="Control Center">
            {({ flags, role }) => <HomeView flags={flags} role={role} />}
        </AppShell>
    );
}
