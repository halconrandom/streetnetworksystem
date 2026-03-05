import type { GetServerSideProps } from 'next';
import AuditPage from '@features/audit/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default AuditPage;
