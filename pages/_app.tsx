import type { AppProps } from 'next/app';
import '../styles/globals.css';
import 'emoji-mart/css/emoji-mart.css';
import 'components-sdk/components-sdk.css';
import '../website/src/index.css';
import '../website/src/slider.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
