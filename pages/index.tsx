import type { GetServerSideProps } from 'next';
import HomePage from '@features/home/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default HomePage;
