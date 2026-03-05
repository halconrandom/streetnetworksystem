import type { GetServerSideProps } from 'next';
import SettingsPage from '@features/settings/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default SettingsPage;
