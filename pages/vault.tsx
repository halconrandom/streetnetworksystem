import type { GetServerSideProps } from 'next';
import { useState, useMemo } from 'react';
import { query } from '@lib/db';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Archive, Users, Search, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Asset {
  id: string;
  name: string;
  kind: string;
  identifier: string | null;
  status: string;
  owner_email: string | null;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tier: string;
  internal_notes: string | null;
  created_at: string;
}

interface Props {
  assets: Asset[];
  clients: Client[];
}

function tierVariant(tier: string): 'default' | 'warning' | 'success' | 'danger' {
  if (tier === 'premium') return 'success';
  if (tier === 'vip') return 'warning';
  return 'default';
}

export default function VaultPage({ assets, clients }: Props) {
  const [tab, setTab] = useState<'assets' | 'clients'>('assets');
  const [search, setSearch] = useState('');

  const filteredAssets = useMemo(() =>
    assets.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.kind ?? '').toLowerCase().includes(search.toLowerCase())),
    [assets, search]
  );

  const filteredClients = useMemo(() =>
    clients.filter(c => !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.email ?? '').toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  const handleDeleteAsset = async (id: string) => {
    const res = await fetch(`/api/vault/assets?id=${id}`, { method: 'DELETE' });
    if (res.ok) toast.success('Asset eliminado');
    else toast.error('Error al eliminar');
  };

  const handleDeleteClient = async (id: string) => {
    const res = await fetch(`/api/vault/clients?id=${id}`, { method: 'DELETE' });
    if (res.ok) toast.success('Cliente eliminado');
    else toast.error('Error al eliminar');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-panel p-5 bg-yellow-300 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fdfbf7] border-2 border-black flex items-center justify-center neo-shadow-sm">
          <Archive className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Vault</h1>
          <p className="text-sm font-sans font-medium text-slate-700">
            {assets.length} assets · {clients.length} clientes
          </p>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1">
          {(['assets', 'clients'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(''); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 border-2 font-display font-bold text-sm uppercase transition-all duration-75',
                tab === t
                  ? 'bg-black text-white border-black neo-shadow-sm -translate-x-[2px] -translate-y-[2px]'
                  : 'bg-[#fdfbf7] text-slate-600 border-black hover:bg-[#f4f1ea]'
              )}
            >
              {t === 'assets' ? <Archive className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {t === 'assets' ? 'Assets' : 'Clientes'}
              <span className="opacity-60">({t === 'assets' ? assets.length : clients.length})</span>
            </button>
          ))}
        </div>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
      </div>

      {/* Assets table */}
      {tab === 'assets' && (
        <div className="neo-panel overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_160px_120px_40px] border-b-2 border-black bg-[#f4f1ea] px-4 py-2.5 gap-4">
            {['Nombre', 'Tipo', 'Owner', 'Estado', ''].map(h => (
              <span key={h} className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">{h}</span>
            ))}
          </div>
          {filteredAssets.length === 0 ? (
            <div className="py-12 text-center"><p className="font-display font-bold text-slate-400 uppercase text-sm">Sin assets</p></div>
          ) : (
            <div className="divide-y-2 divide-black">
              {filteredAssets.map(a => (
                <div key={a.id} className="grid grid-cols-[1fr_100px_160px_120px_40px] items-center px-4 py-3 gap-4 hover:bg-[#f4f1ea] transition-colors">
                  <div>
                    <p className="font-display font-bold text-sm text-black">{a.name}</p>
                    {a.identifier && <p className="text-xs font-sans text-slate-500 mt-0.5 truncate">{a.identifier}</p>}
                  </div>
                  <span className="font-sans text-xs text-slate-600">{a.kind}</span>
                  <span className="font-sans text-xs text-slate-600 truncate">{a.owner_email ?? '—'}</span>
                  <Badge variant={a.status === 'active' ? 'success' : 'default'} className="capitalize">{a.status}</Badge>
                  <button onClick={() => handleDeleteAsset(a.id)} className="p-1.5 hover:bg-rose-100 border-2 border-transparent hover:border-black transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clients table */}
      {tab === 'clients' && (
        <div className="neo-panel overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_120px_80px_40px] border-b-2 border-black bg-[#f4f1ea] px-4 py-2.5 gap-4">
            {['Cliente', 'Email', 'Teléfono', 'Tier', ''].map(h => (
              <span key={h} className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">{h}</span>
            ))}
          </div>
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center"><p className="font-display font-bold text-slate-400 uppercase text-sm">Sin clientes</p></div>
          ) : (
            <div className="divide-y-2 divide-black">
              {filteredClients.map(c => (
                <div key={c.id} className="grid grid-cols-[1fr_160px_120px_80px_40px] items-center px-4 py-3 gap-4 hover:bg-[#f4f1ea] transition-colors">
                  <p className="font-display font-bold text-sm text-black">{c.full_name}</p>
                  <span className="font-sans text-xs text-slate-600 truncate">{c.email ?? '—'}</span>
                  <span className="font-sans text-xs text-slate-600">{c.phone ?? '—'}</span>
                  <Badge variant={tierVariant(c.tier)} className="capitalize">{c.tier}</Badge>
                  <button onClick={() => handleDeleteClient(c.id)} className="p-1.5 hover:bg-rose-100 border-2 border-transparent hover:border-black transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [assets, clients] = await Promise.all([
      query<Asset>(`SELECT a.*, u.email as owner_email FROM sn_vault_assets a LEFT JOIN sn_users u ON u.id = a.owner_id ORDER BY a.name ASC`),
      query<Client>(`SELECT * FROM sn_vault_clients ORDER BY full_name ASC`),
    ]);
    return {
      props: {
        assets: assets.map(a => ({ ...a, created_at: new Date(a.created_at).toISOString() })),
        clients: clients.map(c => ({ ...c, created_at: new Date(c.created_at).toISOString() })),
      },
    };
  } catch (e) {
    console.error('[Vault getServerSideProps]', e);
    return { props: { assets: [], clients: [] } };
  }
};
