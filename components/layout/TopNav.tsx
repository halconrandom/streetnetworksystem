import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Image as ImageIcon,
  MessageSquare,
  StickyNote,
  Archive,
  Users,
  ClipboardList,
  Settings,
  Gamepad2,
  Bell,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Overview',  path: '/',                 icon: LayoutDashboard },
  { name: 'Tickets',   path: '/tickets',           icon: Ticket          },
  { name: 'Builder',   path: '/message-builder',   icon: MessageSquare   },
  { name: 'Forge',     path: '/screenshot-editor', icon: ImageIcon       },
  { name: 'Nexus',     path: '/nexus',             icon: StickyNote      },
  { name: 'Vault',     path: '/vault',             icon: Archive         },
  { name: 'Users',     path: '/users',             icon: Users           },
  { name: 'Audit',     path: '/audit',             icon: ClipboardList   },
  { name: 'Settings',  path: '/settings',          icon: Settings        },
];

export function TopNav() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  };

  return (
    <header className="bg-[#fdfbf7] border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-violet-500 border-2 border-black flex items-center justify-center neo-shadow-sm">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-black tracking-tight leading-none">
                STREET<br />NETWORK
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 border-2 font-display font-bold text-sm transition-all duration-75 uppercase',
                    isActive(item.path)
                      ? 'bg-yellow-300 text-black border-black neo-shadow-sm -translate-x-[2px] -translate-y-[2px]'
                      : 'bg-transparent text-slate-600 border-transparent hover:border-black hover:text-black hover:bg-[#f4f1ea]'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Bell + Profile + Burger */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-[#fdfbf7] border-2 border-black text-black hover:bg-yellow-300 neo-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 border-2 border-black rounded-full">
                3
              </span>
            </button>

            <div className="hidden sm:block h-8 w-0.5 bg-slate-300" />

            {/* Profile + Logout */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-3 p-1 bg-[#fdfbf7] border-2 border-black neo-shadow-sm pr-4">
                <div className="w-8 h-8 bg-violet-200 border-2 border-black overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username ?? 'Admin'}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-sm font-display font-bold text-black leading-none capitalize">
                    {user?.username ?? 'Admin'}
                  </div>
                  <div className="text-xs font-sans text-slate-500 leading-none mt-0.5">
                    {user?.role ?? 'admin'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 bg-[#fdfbf7] border-2 border-black text-black hover:bg-rose-400 neo-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile burger */}
            <button
              className="lg:hidden p-2 bg-[#fdfbf7] border-2 border-black neo-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t-4 border-black bg-[#fdfbf7]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 border-2 font-display font-bold text-sm uppercase transition-all duration-75',
                  isActive(item.path)
                    ? 'bg-yellow-300 text-black border-black neo-shadow-sm'
                    : 'bg-transparent text-slate-600 border-transparent hover:border-black hover:text-black hover:bg-[#f4f1ea]'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2.5 border-2 border-transparent font-display font-bold text-sm uppercase text-rose-600 hover:border-black hover:bg-rose-100 transition-all duration-75 mt-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
