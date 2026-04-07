import { StickyNote } from 'lucide-react';

export default function NexusPage() {
  return (
    <div className="space-y-6">
      <div className="neo-panel p-5 bg-yellow-300 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fdfbf7] border-2 border-black flex items-center justify-center neo-shadow-sm">
          <StickyNote className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Nexus</h1>
          <p className="text-sm font-sans font-medium text-slate-700">Base de conocimiento y notas internas</p>
        </div>
      </div>

      <div className="neo-panel p-12 text-center bg-yellow-300">
        <h2 className="text-2xl font-display font-bold text-black uppercase mb-3">NEXUS MODULE</h2>
        <p className="text-base font-sans font-medium text-slate-800">Este módulo está en construcción. 🚧</p>
      </div>
    </div>
  );
}
