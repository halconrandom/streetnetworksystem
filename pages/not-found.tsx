import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-dark text-terminal-text">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="text-terminal-muted mt-2">Page not found.</p>
      </div>
    </div>
  );
}