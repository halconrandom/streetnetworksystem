import AppShell from '@/App';
import SettingsForm from './components/SettingsForm';

export default function SettingsPage() {
    return (
        <AppShell currentView="settings" title="User Settings">
            <div className="h-full flex flex-col min-w-0 bg-terminal-dark/30 p-6 overflow-auto custom-scrollbar">
                <div className="max-w-2xl mx-auto w-full space-y-6">
                    <div className="bg-terminal-panel border border-terminal-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm p-8">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">System Configuration</h2>
                        <p className="text-xs text-terminal-muted mb-8 uppercase tracking-widest">Update your operator credentials and interface preferences</p>
                        <SettingsForm />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
