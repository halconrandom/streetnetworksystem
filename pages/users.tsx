import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { query } from '@lib/db';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Shield, UserCheck, UserX, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  discord_username: string | null;
  discord_avatar: string | null;
  created_at: string;
  last_login_at: string | null;
  flags: string[];
}

interface Props {
  users: UserRow[];
  total: number;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage({ users: initialUsers, total }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setSearch(q);
    setLoading(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(q)}&pageSize=50`);
      const data = await res.json();
      setUsers(data.rows ?? []);
    } catch {
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) {
      setUsers(u => u.map(x => x.id === id ? { ...x, is_active: !current } : x));
      toast.success(`Usuario ${!current ? 'activado' : 'desactivado'}`);
    } else {
      toast.error('Error al actualizar usuario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-panel p-5 bg-yellow-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fdfbf7] border-2 border-black flex items-center justify-center neo-shadow-sm">
            <Users className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-black">Usuarios</h1>
            <p className="text-sm font-sans font-medium text-slate-700">{total} usuarios registrados</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="neo-panel overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_100px_80px_140px_80px] border-b-2 border-black bg-[#f4f1ea] px-4 py-2.5 gap-4">
          {['', 'Usuario', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
            <span key={h} className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="font-display font-bold text-slate-400 uppercase text-sm">Buscando...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-display font-bold text-slate-400 uppercase text-sm">Sin resultados</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {users.map(u => (
              <div key={u.id} className="grid grid-cols-[48px_1fr_100px_80px_140px_80px] items-center px-4 py-3 gap-4 hover:bg-[#f4f1ea] transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 bg-violet-200 border-2 border-black overflow-hidden">
                  {u.discord_avatar ? (
                    <img src={u.discord_avatar} alt={u.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.id}`} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-black truncate">{u.name ?? u.email}</p>
                  <p className="text-xs font-sans text-slate-500 truncate">{u.email}</p>
                  {u.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {u.flags.map(f => (
                        <span key={f} className="text-[9px] font-display font-bold bg-violet-100 border border-violet-300 text-violet-700 px-1 uppercase">{f}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role */}
                <Badge variant={u.role === 'admin' ? 'danger' : 'default'} className="capitalize w-fit">
                  {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : null}
                  {u.role}
                </Badge>

                {/* Active */}
                <Badge variant={u.is_active ? 'success' : 'outline'}>
                  {u.is_active ? 'Activo' : 'Inactivo'}
                </Badge>

                {/* Last login */}
                <span className="text-xs font-sans text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatDate(u.last_login_at)}
                </span>

                {/* Actions */}
                <button
                  onClick={() => toggleActive(u.id, u.is_active)}
                  className="p-1.5 border-2 border-black neo-shadow-sm hover:bg-[#f4f1ea] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                  title={u.is_active ? 'Desactivar' : 'Activar'}
                >
                  {u.is_active
                    ? <UserX className="w-3.5 h-3.5 text-rose-500" />
                    : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM sn_users');
    const total = parseInt(countResult[0]?.count || '0');

    const users = await query<any>(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, u.is_verified,
              u.discord_username, u.discord_avatar, u.created_at, u.last_login_at,
              COALESCE(json_agg(f.flag) FILTER (WHERE f.flag IS NOT NULL), '[]') as flags
       FROM sn_users u
       LEFT JOIN sn_user_flags f ON f.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT 50`
    );

    return {
      props: {
        total,
        users: users.map(u => ({
          ...u,
          created_at: new Date(u.created_at).toISOString(),
          last_login_at: u.last_login_at ? new Date(u.last_login_at).toISOString() : null,
        })),
      },
    };
  } catch (e) {
    console.error('[Users getServerSideProps]', e);
    return { props: { users: [], total: 0 } };
  }
};
