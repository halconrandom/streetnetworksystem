import type { GetServerSideProps } from 'next';
import MessageBuilderPage from '@features/message-builder/page';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default MessageBuilderPage;
