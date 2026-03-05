import type { GetServerSideProps } from 'next';
import UsersPage from '@features/users/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default UsersPage;
