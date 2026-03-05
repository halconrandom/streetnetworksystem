import type { GetServerSideProps } from 'next';
import TranscriptDetailPage from '@features/transcript/page';

// Force server-side rendering to avoid prerendering issues
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

export default TranscriptDetailPage;
