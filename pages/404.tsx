export default function NotFoundPage() {
  return (
    <html lang="en">
      <head>
        <title>404 - Halcon.dev</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              background: #0a0a0a;
              color: #e5e5e5;
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .muted { color: #a1a1aa; }
          `
        }} />
      </head>
      <body>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>404</h1>
          <p className="muted" style={{ marginTop: '0.5rem' }}>Page not found.</p>
        </div>
      </body>
    </html>
  );
}
