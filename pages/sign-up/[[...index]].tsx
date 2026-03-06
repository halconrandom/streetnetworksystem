import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Sign-up page — redirects to sign-in.
 * Discord OAuth (via Clerk) handles both sign-in and sign-up in a single flow:
 * new users are automatically registered when they authenticate with Discord.
 */
export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'inherit',
      }}
    >
      <p
        style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Redirigiendo...
      </p>
    </div>
  );
}
