import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Street Network Solutions</title>
        <meta name="description" content="Street Network Solutions - Panel de Administración" />
        <link rel="icon" type="image/png" href="https://i.imgur.com/jJgEFWS.png" />
        <link rel="shortcut icon" href="https://i.imgur.com/jJgEFWS.png" />
        <link rel="apple-touch-icon" href="https://i.imgur.com/jJgEFWS.png" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=gg+sans:wght@400;500;600;700&display=swap"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
tailwind.config = {
  theme: {
    extend: {
      colors: {
        terminal: {
          accent: '#FF3B3B',
          dark: '#0a0a0a',
          panel: '#111111',
          border: '#222222',
          text: '#e5e5e5',
          muted: '#a1a1aa',
        }
      }
    }
  }
};`,
          }}
        />
      </Head>
      <body className="bg-terminal-dark text-terminal-text font-sans antialiased h-screen overflow-hidden flex flex-col">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
