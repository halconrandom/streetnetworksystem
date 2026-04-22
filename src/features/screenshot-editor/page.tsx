'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/core/AppShell';
import { I18nProvider } from './i18n/context';

const ScreenshotEditorView = dynamic(
  () => import('./components/ScreenshotEditorView').then((mod) => mod.ScreenshotEditorView),
  { ssr: false }
);

const AdvancedEditorView = dynamic(
  () => import('@features/image-editor/components/AdvancedEditorView').then((mod) => mod.AdvancedEditorView),
  { ssr: false }
);

type EditorMode = 'screenshot' | 'advanced';

export default function ScreenshotEditorPage() {
  const [mode, setMode] = useState<EditorMode>('screenshot');

  return (
    <AppShell currentView="screenshot_editor" title="Screenshot Editor">
      {({ flags }) => (
        <I18nProvider>
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-[#0d0d0d] shrink-0">
              <button
                onClick={() => setMode('screenshot')}
                className={`px-4 py-1.5 text-[11px] font-mono font-bold rounded-md uppercase tracking-widest transition-all ${
                  mode === 'screenshot'
                    ? 'bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30'
                    : 'text-terminal-muted/50 hover:text-white border border-transparent hover:border-white/10'
                }`}
              >
                Screenshot Editor
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`px-4 py-1.5 text-[11px] font-mono font-bold rounded-md uppercase tracking-widest transition-all ${
                  mode === 'advanced'
                    ? 'bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30'
                    : 'text-terminal-muted/50 hover:text-white border border-transparent hover:border-white/10'
                }`}
              >
                Advanced Editor
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {mode === 'screenshot' ? (
                <ScreenshotEditorView userFlags={flags} />
              ) : (
                <AdvancedEditorView />
              )}
            </div>
          </div>
        </I18nProvider>
      )}
    </AppShell>
  );
}
