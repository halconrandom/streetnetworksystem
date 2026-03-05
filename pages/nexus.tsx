import type { GetServerSideProps } from 'next';
import NexusPage from '@features/nexus/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default NexusPage;
