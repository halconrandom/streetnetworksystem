import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';
import 'emoji-mart/css/emoji-mart.css';
import '@integrations/components-sdk/components-sdk.css';
import '@features/message-builder/legacy/index.css';
import '@features/message-builder/legacy/slider.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
