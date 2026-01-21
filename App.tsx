import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/Dashboard';
import { TicketList } from './views/TicketList';
import { TranscriptView } from './views/TranscriptView';
import { V2BuilderView } from './views/V2BuilderView';
import { Menu, Bell, User } from './components/Icons';

type ViewState = 'dashboard' | 'tickets' | 'transcript_detail' | 'v2_builder' | 'users' | 'settings' | 'audit';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Render content based on current view state
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'tickets':
        return (
          <TicketList
            onSelectTicket={(ticketId) => {
              setSelectedTicketId(ticketId);
              setCurrentView('transcript_detail');
            }}
          />
        );
      case 'transcript_detail':
        return <TranscriptView ticketId={selectedTicketId} onBack={() => setCurrentView('tickets')} />;
      case 'v2_builder':
        return <V2BuilderView />;
      case 'users':
      case 'settings':
      case 'audit':
        return (
            <div className="flex items-center justify-center h-full text-terminal-muted">
                <div className="text-center">
                    <p className="mb-2">Module Under Construction</p>
                    <code className="bg-black/30 px-2 py-1 rounded text-xs">{currentView}_view.tsx</code>
                </div>
            </div>
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-terminal-dark text-terminal-text font-sans overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => setCurrentView(view as ViewState)} 
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-terminal-panel/50 backdrop-blur-sm border-b border-terminal-border flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
                <button 
                    className="md:hidden text-terminal-muted hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <Menu size={20} />
                </button>
                {/* Breadcrumbs or Title could go here */}
                <h2 className="text-sm font-medium text-white capitalize hidden sm:block">
                    System / {currentView.replace('_', ' ')}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative text-terminal-muted hover:text-white transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-terminal-accent rounded-full"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-gray-500 flex items-center justify-center">
                    <User size={16} className="text-white" />
                </div>
            </div>
        </header>

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-auto relative">
             {renderContent()}
        </main>
      </div>

      {/* Global decorative background element */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-terminal-panel via-terminal-dark to-terminal-dark opacity-40"></div>
    </div>
  );
}

export default App;
