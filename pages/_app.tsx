import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import '../styles/globals.css';
import '../src/integrations/components-sdk/components-sdk.css';

export type NextPageWithLayout = NextPage & {
  noLayout?: boolean;
  fullWidth?: boolean;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const noLayout = Component.noLayout ?? false;
  const fullWidth = Component.fullWidth ?? false;

  return (
    <ClerkProvider>
      <AuthProvider>
        {noLayout ? (
          <Component {...pageProps} />
        ) : (
          <Layout fullWidth={fullWidth}>
            <Component {...pageProps} />
          </Layout>
        )}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#fdfbf7',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px #000',
              borderRadius: '0',
              fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
              fontWeight: '700',
              color: '#000',
            },
          }}
        />
      </AuthProvider>
    </ClerkProvider>
  );
}
