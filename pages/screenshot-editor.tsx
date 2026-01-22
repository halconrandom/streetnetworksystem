import AppShell from '../App';
import { ScreenshotEditorView } from '../views/ScreenshotEditorView';

export default function ScreenshotEditorPage() {
  return (
    <AppShell currentView="screenshot_editor" title="Screenshot Editor">
      <ScreenshotEditorView />
    </AppShell>
  );
}
