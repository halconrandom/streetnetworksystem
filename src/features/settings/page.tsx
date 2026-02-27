import AppShell from '@/core/AppShell';
import SettingsForm from './components/SettingsForm';

export default function SettingsPage() {
    return (
        <AppShell currentView="settings" title="Configuración">
            <div className="h-full flex flex-col min-w-0 bg-terminal-dark/30 p-8 overflow-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto w-full space-y-10 animate-fade-in pb-20">
                    <div className="relative flex flex-col items-center text-center">
                        <div className="h-1 w-12 bg-terminal-accent rounded-full mb-4 opacity-50" />
                        <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-white">Configuración de Operador</h2>
                        <p className="text-[10px] text-terminal-muted uppercase tracking-[0.4em] mt-2 font-bold">Terminal v2.4 Entorno de Gestión de Identidad</p>
                    </div>

                    <div className="bg-[#0c0c0d] border border-terminal-border/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden group transition-all duration-500 hover:border-terminal-accent/30">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-terminal-accent/20 to-transparent" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-terminal-accent/2 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-700 pointer-events-none" />
                        <SettingsForm />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
