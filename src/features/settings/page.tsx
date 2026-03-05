'use client';

import AppShell from '@/core/AppShell';
import SettingsForm from './components/SettingsForm';

export default function SettingsPage() {
    return (
        <AppShell currentView="settings" title="Configuración">
            <div className="h-full w-full bg-[#0a0a0a] overflow-hidden">
                <SettingsForm />
            </div>
        </AppShell>
    );
}
