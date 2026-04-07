import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { queryOne, query } from '@lib/db';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  UserCheck,
  Ticket,
  AlertCircle,
  MessageSquare,
  Image as ImageIcon,
  StickyNote,
  Archive,
  Settings,
  Zap,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  activeMembers: number;
  totalTickets: number;
  openTickets: number;
}

interface AuditEntry {
  id: number;
  action: string;
  actor_email: string | null;
  created_at: string;
}

interface Props {
  stats: Stats;
  recentActivity: AuditEntry[];
}

// ─── Static data ─────────────────────────────────────────────────────────────

const modules = [
  { title: 'Tickets',           description: 'Gestiona tickets de soporte y consultas.',              icon: Ticket,       path: '/tickets',           color: 'bg-cyan-300'    },
  { title: 'Message Builder',   description: 'Crea y administra templates de mensajes.',              icon: MessageSquare, path: '/message-builder',  color: 'bg-yellow-300'  },
  { title: 'Screenshot Editor', description: 'Editor visual de imágenes y screenshots.',              icon: ImageIcon,    path: '/screenshot-editor', color: 'bg-emerald-300' },
  { title: 'Nexus',             description: 'Base de conocimiento y notas internas.',                icon: StickyNote,   path: '/nexus',             color: 'bg-violet-300'  },
  { title: 'Vault',             description: 'Gestión de assets y clientes.',                        icon: Archive,      path: '/vault',             color: 'bg-orange-300'  },
  { title: 'Users',             description: 'Administra usuarios, roles y permisos.',               icon: Users,        path: '/users',             color: 'bg-pink-300'    },
  { title: 'Audit',             description: 'Registro de actividad del sistema.',                   icon: ClipboardList, path: '/audit',            color: 'bg-rose-300'    },
  { title: 'Settings',          description: 'Configuración general de la plataforma.',              icon: Settings,     path: '/settings',          color: 'bg-slate-300'   },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="neo-panel p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} border-2 border-black flex items-center justify-center neo-shadow-sm shrink-0`}>
        <Icon className="w-6 h-6 text-black" />
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-black leading-none">{value.toLocaleString()}</p>
        <p className="text-xs font-display font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage({ stats, recentActivity }: Props) {
  const { user } = useAuth();

  return (
    <div className="space-y-8">

      {/* Welcome Header */}
      <div className="neo-panel p-5 md:p-6 bg-yellow-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-black mb-1">
            Bienvenido, {user?.username ?? 'Admin'}!
          </h1>
          <p className="text-base font-sans text-slate-800 font-medium">
            Sistema operativo. ¿Qué vamos a construir hoy?
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
          <span className="font-display font-bold text-sm text-black uppercase">Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Usuarios"   value={stats.totalUsers}    icon={Users}      color="bg-cyan-300"    />
        <StatCard label="Miembros Activos" value={stats.activeMembers} icon={UserCheck}  color="bg-emerald-300" />
        <StatCard label="Total Tickets"    value={stats.totalTickets}  icon={Ticket}     color="bg-violet-300"  />
        <StatCard label="Tickets Abiertos" value={stats.openTickets}   icon={AlertCircle} color="bg-rose-300"  />
      </div>

      {/* Main + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Quick Access */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-black pb-2">
            <Zap className="w-6 h-6 text-violet-600 fill-violet-600" />
            <h2 className="text-2xl font-display font-bold text-black">Acceso Rápido</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <Link href={mod.path} key={mod.path} className="block group">
                <div className="neo-panel flex items-center p-4 transition-transform duration-150 group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#000000] bg-[#fdfbf7] hover:bg-white">
                  <div className={`w-11 h-11 ${mod.color} border-2 border-black flex items-center justify-center neo-shadow-sm mr-4 shrink-0`}>
                    <mod.icon className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base text-black leading-tight">{mod.title}</h3>
                    <p className="text-slate-500 font-sans text-xs mt-0.5 truncate">{mod.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 ml-3 shrink-0 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-black pb-2">
            <h2 className="text-2xl font-display font-bold text-black">Actividad Reciente</h2>
            <Link href="/audit" className="text-sm font-display font-bold text-violet-600 hover:text-violet-800 underline decoration-2 underline-offset-4">
              VER TODO
            </Link>
          </div>

          <div className="neo-panel overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-display font-bold text-slate-400 text-sm uppercase">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-[#f4f1ea] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="default" className="text-[10px]">
                        {entry.action.split('.')[0] ?? entry.action}
                      </Badge>
                      <span className="text-xs font-display font-bold text-slate-400">
                        {new Date(entry.created_at).toLocaleDateString('es', {
                          day: '2-digit', month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-display font-bold text-black leading-tight">{entry.action}</p>
                    {entry.actor_email && (
                      <p className="text-xs font-sans text-slate-500 mt-0.5 truncate">{entry.actor_email}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [usersCount, activeMembers, ticketsCount, openTickets, logs] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM sn_users'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM sn_users WHERE is_active = true'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM sn_tickets'),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM sn_tickets WHERE status != 'closed'"),
      query<AuditEntry>(
        `SELECT al.id, al.action, al.created_at, u.email as actor_email
         FROM sn_audit_logs al
         LEFT JOIN sn_users u ON al.actor_user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 8`
      ),
    ]);

    return {
      props: {
        stats: {
          totalUsers: parseInt(usersCount?.count || '0'),
          activeMembers: parseInt(activeMembers?.count || '0'),
          totalTickets: parseInt(ticketsCount?.count || '0'),
          openTickets: parseInt(openTickets?.count || '0'),
        },
        recentActivity: logs.map((l) => ({
          ...l,
          created_at: new Date(l.created_at).toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('[Dashboard getServerSideProps]', error);
    return {
      props: {
        stats: { totalUsers: 0, activeMembers: 0, totalTickets: 0, openTickets: 0 },
        recentActivity: [],
      },
    };
  }
};
