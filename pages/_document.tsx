import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Street Network — Admin</title>
        <meta name="description" content="Street Network Solutions - Panel de Administración" />
        <link rel="icon" type="image/png" href="https://i.imgur.com/jJgEFWS.png" />
        <link rel="shortcut icon" href="https://i.imgur.com/jJgEFWS.png" />
        <link rel="apple-touch-icon" href="https://i.imgur.com/jJgEFWS.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-[#f4f1ea] text-slate-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
