import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { Gamepad2, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import type { NextPageWithLayout } from '../_app';

const SignInPage: NextPageWithLayout = () => {
  const router = useRouter();
  const from = (router.query.from as string) || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth0Login = () => {
    const returnTo = encodeURIComponent(from);
    window.location.href = `/api/auth/login?returnTo=${returnTo}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al iniciar sesión.');
        return;
      }

      router.push(from);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="bg-[#fdfbf7] border-2 border-black shadow-[6px_6px_0px_#000000]">

          {/* Header */}
          <div className="bg-yellow-300 border-b-2 border-black px-8 py-6 text-center">
            <div className="w-12 h-12 bg-[#fdfbf7] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-6 h-6 text-violet-500" />
            </div>
            <h1 className="font-display font-bold text-2xl text-black uppercase tracking-tight">
              Street Network
            </h1>
            <p className="font-sans font-semibold text-sm text-slate-700 mt-1">
              Panel de Administración
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            <button
              type="button"
              onClick={handleAuth0Login}
              className="w-full h-11 mb-5 bg-black text-white border-2 border-black shadow-[4px_4px_0px_#000] font-display font-bold text-sm uppercase tracking-wide hover:bg-slate-900 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-75"
            >
              Continuar con Auth0
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 h-[2px] bg-black" />
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-500">Fallback local</span>
              <div className="flex-1 h-[2px] bg-black" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-rose-100 border-2 border-black px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-black shrink-0" />
                  <p className="text-sm font-sans font-bold text-black">{error}</p>
                </div>
              )}

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-xs uppercase tracking-widest text-slate-600">
                  Usuario
                </label>
                <div className="flex items-center gap-2 border-2 border-black bg-[#fdfbf7] px-3 focus-within:shadow-[4px_4px_0px_#000] transition-all duration-75">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="admin"
                    className="flex-1 h-10 bg-transparent text-sm font-sans font-medium text-black placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-bold text-xs uppercase tracking-widest text-slate-600">
                  Contraseña
                </label>
                <div className="flex items-center gap-2 border-2 border-black bg-[#fdfbf7] px-3 focus-within:shadow-[4px_4px_0px_#000] transition-all duration-75">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="flex-1 h-10 bg-transparent text-sm font-sans font-medium text-black placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full h-11 bg-violet-500 text-white border-2 border-black shadow-[4px_4px_0px_#000] font-display font-bold text-sm uppercase tracking-wide hover:bg-violet-600 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-75 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>

            </form>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-black bg-[#f4f1ea] px-8 py-3 flex justify-between items-center">
            <span className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500">
              Street Network
            </span>
            <span className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500">
              Admin v2
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

SignInPage.noLayout = true;
export default SignInPage;
