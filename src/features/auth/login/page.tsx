import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Login.module.css';
import { Shield, Lock, User, ArrowRight, AlertCircle, Terminal, MessageSquare } from '@/components/Icons';

type Mode = 'login' | 'register';

const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';

const getRedirectTarget = (value: string | string[] | undefined) => {
  if (!value) return '/';
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '/';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
};

export default function LoginPage() {
  const router = useRouter();
  const redirectTo = useMemo(() => getRedirectTarget(router.query.next), [router.query.next]);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!apiBase) return;
    const checkSession = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const payload = await res.json().catch(() => ({}));
          if (payload?.isVerified) {
            router.replace(redirectTo);
          } else {
            router.replace('/verify');
          }
        }
      } catch {
        // ignore
      }
    };
    checkSession();
  }, [redirectTo, router]);

  const submitLogin = async () => {
    if (!apiBase) {
      setError('No se configuró la URL del API.');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo iniciar sesión.');
      }
      const payload = await res.json().catch(() => ({}));
      if (payload?.isVerified) {
        router.replace(redirectTo);
      } else {
        router.replace('/verify');
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    if (!apiBase) {
      setError('No se configuró la URL del API.');
      return;
    }
    setError('');
    setInfo('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      // Nombre temporal derivado del email mientras no hay campo name
      const tempName = email.split('@')[0] || 'Usuario';
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name: tempName }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo crear la cuenta.');
      }
      setInfo('Cuenta creada. Ya puedes iniciar sesión.');
      setMode('login');
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'login') {
      submitLogin();
      return;
    }
    submitRegister();
  };

  return (
    <div className={styles.page}>
      <div className={styles.topGlow}></div>
      <div className={styles.glowLeft}></div>
      <div className={styles.glowRight}></div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge} style={{ background: 'transparent', border: 'none' }}>
            <img src="https://i.imgur.com/NBGmNrx.png" alt="Hub Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          </div>
          <h1>STREET NETWORK HUB CENTER</h1>
          <p>
            <span className={styles.dot}></span>
            System Access Restricted
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={mode === 'login' ? styles.modeActive : styles.modeButton}
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={mode === 'register' ? styles.modeActive : styles.modeButton}
              onClick={() => setMode('register')}
            >
              Registro
            </button>
          </div>

          <div className={styles.divider}>
            <span>{mode === 'login' ? 'O usa tu cuenta de Discord' : 'Vincular Discord después'}</span>
          </div>

          {mode === 'login' && (
            <button
              type="button"
              className={styles.submit}
              style={{ background: '#5865F2', marginBottom: '1.5rem', border: 'none' }}
              onClick={async () => {
                try {
                  const res = await fetch(`${apiBase}/auth/discord`, { credentials: 'include' });
                  if (!res.ok) throw new Error('Error al conectar con Discord');
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                } catch (err: any) {
                  setError(err.message);
                }
              }}
            >
              <MessageSquare size={16} />
              Ingresar con Discord
            </button>
          )}

          <div className={styles.divider}>
            <span>{mode === 'login' ? 'Inicia sesión con email' : 'Crea una cuenta con email'}</span>
          </div>

          <form onSubmit={onSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            {info && <div className={styles.info}>{info}</div>}

            <div className={styles.field}>
              <label>Correo</label>
              <div className={styles.inputWrap}>
                <User size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@streetnetwork"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Contraseña</label>
              <div className={styles.inputWrap}>
                <Lock size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className={styles.field}>
                  <label>Confirmar contraseña</label>
                  <div className={styles.inputWrap}>
                    <Lock size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <p className={styles.passwordHint}>Mínimo 12 caracteres con mayúscula, minúscula, número y símbolo.</p>
              </>
            )}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Procesando...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Acceder al sistema' : 'Crear cuenta'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className={styles.footer}>
          <span>
            <Terminal size={12} /> v2.4.0-stable
          </span>
          <span>Authorized Personnel Only</span>
        </div>
      </div>
    </div>
  );
}
