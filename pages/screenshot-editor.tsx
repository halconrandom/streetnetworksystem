import type { NextPageWithLayout } from './_app';
import ScreenshotEditorPage from '@features/screenshot-editor/page';

const ScreenshotEditor: NextPageWithLayout = () => {
  return <ScreenshotEditorPage />;
};

ScreenshotEditor.fullWidth = true;

export default ScreenshotEditor;
