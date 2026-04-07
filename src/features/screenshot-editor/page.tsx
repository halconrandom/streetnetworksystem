'use client';

import dynamic from 'next/dynamic';
import { I18nProvider } from './i18n/context';

const ScreenshotEditorView = dynamic(
  () => import('./components/ScreenshotEditorView').then((mod) => mod.ScreenshotEditorView),
  { ssr: false }
);

// In the redesign, the logged-in user is always the admin — all premium flags are granted.
const ADMIN_FLAGS = ['review_channels', 'comic_maker', 'cache_drafts', 'premium_access'];

export default function ScreenshotEditorPage() {
  return (
    <I18nProvider>
      <ScreenshotEditorView userFlags={ADMIN_FLAGS} />
    </I18nProvider>
  );
}
