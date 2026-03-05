import type { GetServerSideProps } from 'next';
import TicketsPage from '@features/tickets/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default TicketsPage;
