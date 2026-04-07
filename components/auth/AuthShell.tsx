import { Gamepad2 } from 'lucide-react';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="bg-yellow-300 border-2 border-black border-b-0 px-8 py-6 text-center shadow-[6px_6px_0px_#000000]">
          <div className="w-12 h-12 bg-[#fdfbf7] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-6 h-6 text-violet-500" />
          </div>
          <h1 className="font-display font-bold text-2xl text-black uppercase tracking-tight">Street Network</h1>
          <p className="font-sans font-semibold text-sm text-slate-700 mt-1">{title}</p>
          <p className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-600 mt-2">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
