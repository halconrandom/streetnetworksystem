import Link from 'next/link';
import { Gamepad2, ShieldAlert } from 'lucide-react';
import type { NextPageWithLayout } from '../_app';

const SignUpPage: NextPageWithLayout = () => {
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
          <div className="px-8 py-8 text-center flex flex-col items-center gap-5">
            <div className="w-14 h-14 bg-[#f4f1ea] border-2 border-black flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-black" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-black uppercase mb-2">
                Acceso Restringido
              </h2>
              <p className="font-sans font-medium text-sm text-slate-600 leading-relaxed">
                El registro en este panel es gestionado directamente por el equipo de administración.
                Contacta a un administrador para obtener acceso.
              </p>
            </div>

            <Link
              href="/sign-in"
              className="w-full h-11 bg-[#fdfbf7] text-black border-2 border-black shadow-[4px_4px_0px_#000] font-display font-bold text-sm uppercase hover:bg-[#f4f1ea] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-75 flex items-center justify-center"
            >
              Volver al inicio de sesión
            </Link>
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

SignUpPage.noLayout = true;
export default SignUpPage;
