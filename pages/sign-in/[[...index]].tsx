import { useEffect, useState } from 'react';
import { useSignIn, SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';

/**
 * Sign-in page — Discord OAuth only.
 *
 * Flow:
 *  1. If the URL contains the SSO callback params (Clerk redirects back here after Discord),
 *     render the hidden <SignIn /> component so Clerk can complete the OAuth handshake.
 *  2. Otherwise, immediately trigger `authenticateWithRedirect` to send the user to Discord.
 *     A branded loading screen is shown while the redirect happens.
 */
export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Detect if we are in the SSO callback phase (Clerk redirects back to this URL)
  const isCallback =
    typeof window !== 'undefined' &&
    (window.location.search.includes('__clerk') ||
      window.location.hash.includes('__clerk') ||
      router.asPath.includes('sso-callback'));

  useEffect(() => {
    if (!isLoaded || isCallback || redirecting) return;

    setRedirecting(true);

    signIn
      ?.authenticateWithRedirect({
        strategy: 'oauth_discord',
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: '/',
      })
      .catch((err: any) => {
        console.error('[SignIn] Discord OAuth error:', err);
        setError(err?.errors?.[0]?.message || 'Error al conectar con Discord. Intenta de nuevo.');
        setRedirecting(false);
      });
  }, [isLoaded, isCallback, redirecting, signIn]);

  // ── SSO callback: let Clerk handle the OAuth response ──────────────────────
  if (isCallback) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
        }}
      >
        {/* Hidden Clerk component processes the OAuth callback */}
        <SignIn routing="path" path="/sign-in" />
      </div>
    );
  }

  // ── Branded loading / error screen ─────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: 'inherit',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#111',
        }}
      >
        <img
          src="https://i.imgur.com/NBGmNrx.png"
          alt="Street Network"
          style={{ width: 56, height: 56, objectFit: 'contain' }}
        />
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
        <p
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          STREET NETWORK
        </p>
        <p
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: '4px 0 0',
          }}
        >
          Hub Center
        </p>
      </div>

      {error ? (
        /* Error state */
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <p style={{ color: '#ff4444', fontSize: 13, marginBottom: 16 }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setRedirecting(false);
            }}
            style={{
              background: '#5865F2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Reintentar con Discord
          </button>
        </div>
      ) : (
        /* Loading / redirecting state */
        <div style={{ textAlign: 'center' }}>
          {/* Discord brand button (visual only while redirecting) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#5865F2',
              color: '#fff',
              borderRadius: 8,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.03em',
              opacity: 0.85,
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {/* Discord icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Conectando con Discord...
          </div>
          <p
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 11,
              marginTop: 12,
              letterSpacing: '0.05em',
            }}
          >
            Serás redirigido automáticamente
          </p>
        </div>
      )}
    </div>
  );
}
