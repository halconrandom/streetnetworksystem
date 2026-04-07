import { ClerkFailed, ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import type { NextPageWithLayout } from '../_app';
import { AuthShell } from '@/components/auth/AuthShell';
import { neoClerkAppearance } from '@/lib/clerk-appearance';

const SignUpPage: NextPageWithLayout = () => {
  return (
    <AuthShell title="Crear cuenta de administrador" subtitle="Registro inicial">
        <ClerkLoading>
          <div className="bg-[#fdfbf7] border-2 border-black border-t-0 p-8 shadow-[6px_6px_0px_#000000]">
            <p className="font-display font-bold text-sm uppercase tracking-wide text-slate-600">Cargando registro...</p>
          </div>
        </ClerkLoading>

        <ClerkFailed>
          <div className="bg-[#fdfbf7] border-2 border-black border-t-0 p-8 shadow-[6px_6px_0px_#000000]">
            <p className="font-display font-bold text-sm uppercase tracking-wide text-rose-600">
              Clerk no pudo inicializarse.
            </p>
            <p className="font-sans text-xs text-slate-700 mt-2">
              Revisa `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` y dominios permitidos.
            </p>
          </div>
        </ClerkFailed>

        <ClerkLoaded>
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" appearance={neoClerkAppearance} />
        </ClerkLoaded>
    </AuthShell>
  );
};

SignUpPage.noLayout = true;
export default SignUpPage;
