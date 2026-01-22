import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Verify.module.css';
import { Shield, Terminal, LogOut } from '../components/Icons';

const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!apiBase) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    } finally {
      router.replace('/login');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge}>
            <Shield size={32} />
          </div>
          <h1>Verificación pendiente</h1>
          <p>Tu cuenta está creada, pero necesita aprobación manual.</p>
        </div>

        <div className={styles.body}>
          <p>
            Contacta al administrador para activar tu usuario. Una vez verificado,
            podrás acceder a toda la plataforma.
          </p>
          <button className={styles.logout} onClick={handleLogout} disabled={loading}>
            <LogOut size={16} />
            {loading ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>

        <div className={styles.footer}>
          <span>
            <Terminal size={12} /> Street Network Access
          </span>
        </div>
      </div>
    </div>
  );
}
