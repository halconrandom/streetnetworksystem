import type { GetServerSideProps } from 'next';
import ScreenshotEditorPage from '@features/screenshot-editor/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default ScreenshotEditorPage;
