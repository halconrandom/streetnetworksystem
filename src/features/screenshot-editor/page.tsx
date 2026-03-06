'use client';

import dynamic from 'next/dynamic';
import AppShell from '@/core/AppShell';
import { I18nProvider } from './i18n/context';

const ScreenshotEditorView = dynamic(
  () => import('./components/ScreenshotEditorView').then((mod) => mod.ScreenshotEditorView),
  { ssr: false }
);

export default function ScreenshotEditorPage() {
  return (
    <AppShell currentView="screenshot_editor" title="Screenshot Editor">
      {({ flags }) => (
        <I18nProvider>
          <ScreenshotEditorView userFlags={flags} />
        </I18nProvider>
      )}
    </AppShell>
  );
}
