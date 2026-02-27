import dynamic from 'next/dynamic';
import AppShell from '@/core/AppShell';

const ScreenshotEditorView = dynamic(
  () => import('./components/ScreenshotEditorView').then((mod) => mod.ScreenshotEditorView),
  { ssr: false }
);

export default function ScreenshotEditorPage() {
  return (
    <AppShell currentView="screenshot_editor" title="Screenshot Editor">
      <ScreenshotEditorView />
    </AppShell>
  );
}
