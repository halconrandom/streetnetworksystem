import type { GetServerSideProps } from 'next';
import DashboardPage from '@features/dashboard/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default DashboardPage;
