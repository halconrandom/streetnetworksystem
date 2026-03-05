import type { GetServerSideProps } from 'next';
import VaultPage from '@features/vault/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default VaultPage;
