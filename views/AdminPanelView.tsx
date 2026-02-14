import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Check, X, Search, Save, RefreshCw, Shield } from '../components/Icons';

type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
  flags: string[];
};

type AuditRow = {
  id: number;
  action: string;
  actor_email: string | null;
  target_email: string | null;
  created_at: string | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
};

const FLAGS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'transcripts', label: 'Transcripts' },
  { id: 'message_builder', label: 'Message Builder' },
  { id: 'screenshot_editor', label: 'Screenshot Editor' },
  { id: 'users', label: 'Users' },
  { id: 'audit_logs', label: 'Audit Logs' },
  { id: 'nexus', label: 'The Nexus' },
  { id: 'vault', label: 'La Bóveda' },
];

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const deriveName = (email: string) => {
  const [name] = email.split('@');
  return name || email;
};

interface AdminPanelViewProps {
  activeTab?: 'users' | 'audit';
}

export default function AdminPanelView({ activeTab: initialTab = 'users' }: AdminPanelViewProps) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentTab, setCurrentTab] = useState<'users' | 'audit'>(initialTab);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 15;
  const [editMap, setEditMap] = useState<Record<string, AdminUser>>({});

  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const auditPageSize = 25;
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    actorId: '',
    targetId: '',
    dateStart: '',
    dateEnd: '',
    search: '',
  });

  const loadUsers = useCallback(async () => {
    if (!apiBase) return;
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`${apiBase}/admin/users?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.rows || []);
      setTotalUsers(data.total || 0);
      const nextMap: Record<string, AdminUser> = {};
      (data.rows || []).forEach((user: AdminUser) => {
        nextMap[user.id] = { ...user, flags: [...(user.flags || [])] };
      });
      setEditMap(nextMap);
    } catch (err: any) {
      setUsersError(err?.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [apiBase, page, pageSize, query]);

  const loadAudit = useCallback(async () => {
    if (!apiBase) return;
    setLoadingAudit(true);
    try {
      const qs = new URLSearchParams({
        page: String(auditPage),
        pageSize: String(auditPageSize),
        ...Object.fromEntries(Object.entries(auditFilters).filter(([_, v]) => v)),
      });
      const res = await fetch(`${apiBase}/admin/audit?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setAuditRows(data.rows || []);
      setAuditTotal(data.total || 0);
    } catch (err) {
      console.error('loadAudit failed', err);
    } finally {
      setLoadingAudit(false);
    }
  }, [apiBase, auditPage, auditPageSize, auditFilters]);

  useEffect(() => {
    if (!apiBase) return;
    const checkAccess = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/me`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const payload = await res.json();
        if (payload?.role !== 'admin') {
          setAccessDenied(true);
          return;
        }
        setAccessDenied(false);
      } catch {
        router.replace('/login');
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [apiBase, router]);

  useEffect(() => {
    if (!checkingAccess && !accessDenied) {
      if (currentTab === 'users') loadUsers();
      if (currentTab === 'audit') loadAudit();
    }
  }, [checkingAccess, accessDenied, currentTab, loadUsers, loadAudit]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalUsers / pageSize)), [totalUsers, pageSize]);
  const auditPages = useMemo(() => Math.max(1, Math.ceil(auditTotal / auditPageSize)), [auditTotal, auditPageSize]);

  const updateEdit = (id: string, patch: Partial<AdminUser>) => {
    setEditMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const toggleFlag = (id: string, flag: string) => {
    const current = editMap[id];
    if (!current) return;
    const nextFlags = new Set(current.flags || []);
    if (nextFlags.has(flag)) nextFlags.delete(flag);
    else nextFlags.add(flag);
    updateEdit(id, { flags: Array.from(nextFlags) });
  };

  const saveUser = async (id: string) => {
    if (!apiBase) return;
    const original = users.find((user) => user.id === id);
    const current = editMap[id];
    if (!original || !current) return;
    const patch: Record<string, unknown> = {};
    if (original.role !== current.role) patch.role = current.role;
    if (original.is_active !== current.is_active) patch.is_active = current.is_active;
    if (original.is_verified !== current.is_verified) patch.is_verified = current.is_verified;
    const flagsChanged = JSON.stringify(original.flags || []) !== JSON.stringify(current.flags || []);
    try {
      if (Object.keys(patch).length > 0) {
        const res = await fetch(`${apiBase}/admin/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Failed to update user');
      }
      if (flagsChanged) {
        const res = await fetch(`${apiBase}/admin/users/${id}/flags`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ flags: current.flags }),
        });
        if (!res.ok) throw new Error('Failed to update flags');
      }
      await loadUsers();
    } catch (err) {
      // ignore
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex h-[400px] items-center justify-center text-terminal-muted animate-pulse font-mono uppercase tracking-[0.2em] text-xs">
        <RefreshCw size={16} className="mr-3 animate-spin" />
        Deciphering Credentials...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-500/5 border border-red-500/20 rounded-xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <Shield size={32} className="text-red-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl text-white font-bold tracking-tight">Security Protocol Violation</h2>
            <p className="text-sm text-red-500/60 uppercase tracking-widest font-mono">Access Denied</p>
          </div>
          <p className="text-sm text-terminal-muted leading-relaxed">
            Your current authorization level is insufficient to access the core system management interface. Contact a terminal overseer.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-terminal-dark/30">
      {/* Tab Navigation */}
      <div className="px-6 pt-6 flex items-center justify-between border-b border-terminal-border bg-terminal-panel/30 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setCurrentTab('users')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${currentTab === 'users' ? 'text-terminal-accent' : 'text-terminal-muted hover:text-white'
              }`}
          >
            User Controller
            {currentTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-terminal-accent shadow-[0_0_10px_rgba(255,59,59,0.5)]"></div>}
          </button>
          <button
            onClick={() => setCurrentTab('audit')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${currentTab === 'audit' ? 'text-terminal-accent' : 'text-terminal-muted hover:text-white'
              }`}
          >
            Audit Matrix
            {currentTab === 'audit' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-terminal-accent shadow-[0_0_10px_rgba(255,59,59,0.5)]"></div>}
          </button>
        </div>
        <div className="pb-4 flex items-center gap-3 text-[10px] text-terminal-muted uppercase tracking-widest opacity-60">
          <Shield size={12} className="text-terminal-accent" />
          Authorized Access Mode
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {currentTab === 'users' ? (
          <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Search and Stats */}
            <div className="flex flex-wrap items-center gap-4 bg-terminal-panel border border-terminal-border rounded-xl p-4 shadow-xl">
              <div className="relative flex-1 min-w-[300px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setPage(1);
                      loadUsers();
                    }
                  }}
                  placeholder="Scan identifier or neural address..."
                  className="w-full bg-terminal-dark/50 border border-terminal-border/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-terminal-accent/50 transition-colors placeholder:text-terminal-muted/30 font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border border-terminal-border text-terminal-muted hover:bg-white/5 hover:text-white transition-all active:scale-95"
                  onClick={() => {
                    setPage(1);
                    loadUsers();
                  }}
                >
                  Query API
                </button>
                <button
                  className="p-2 border border-terminal-border rounded-lg text-terminal-muted hover:bg-white/5 hover:text-white transition-all active:scale-95 shadow-inner"
                  onClick={() => loadUsers()}
                  title="Reload Registry"
                >
                  <RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="px-4 border-l border-terminal-border h-8 flex items-center gap-4 ml-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] text-terminal-muted uppercase tracking-tighter">Registered Nodes</span>
                  <span className="text-sm font-mono text-white leading-none">{totalUsers}</span>
                </div>
              </div>
            </div>

            {usersError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-xs font-mono">
                [SYSTEM_ERROR]: {usersError}
              </div>
            )}

            <div className="bg-terminal-panel border border-terminal-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-xs text-terminal-text border-collapse">
                  <thead>
                    <tr className="text-left bg-terminal-dark/50 border-b border-terminal-border">
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Identity</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Neural Address</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted text-center">Status</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Authorization Flags</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Last Uplink</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terminal-border/40">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-terminal-muted animate-pulse font-mono uppercase tracking-[0.1em]">
                          Synchronizing Registry...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-terminal-muted font-mono uppercase tracking-[0.1em]">
                          No records found in database
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        const edited = editMap[user.id] || user;
                        const isChanged = JSON.stringify(user) !== JSON.stringify(edited);

                        return (
                          <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-terminal-dark to-terminal-border border border-terminal-border flex items-center justify-center overflow-hidden">
                                  <span className="text-[10px] font-bold text-white uppercase">{deriveName(user.email).slice(0, 2)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white font-medium">{deriveName(user.email)}</span>
                                  <span className="text-[9px] uppercase tracking-tighter text-terminal-muted font-mono">ID: {user.id.slice(0, 8)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-terminal-muted/80">{user.email}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-6">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] uppercase tracking-tighter text-terminal-muted">Active</span>
                                  <button
                                    onClick={() => updateEdit(user.id, { is_active: !edited.is_active })}
                                    className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative border ${edited.is_active ? 'bg-terminal-accent/20 border-terminal-accent/40' : 'bg-terminal-dark border-terminal-border'
                                      }`}
                                  >
                                    <div className={`w-3 h-3 rounded-full shadow-lg transform transition-transform duration-300 ${edited.is_active ? 'translate-x-5 bg-terminal-accent shadow-terminal-accent/50' : 'translate-x-0 bg-terminal-muted/50'
                                      }`} />
                                  </button>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] uppercase tracking-tighter text-terminal-muted">Verified</span>
                                  <button
                                    onClick={() => updateEdit(user.id, { is_verified: !edited.is_verified })}
                                    className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative border ${edited.is_verified ? 'bg-terminal-accent/20 border-terminal-accent/40' : 'bg-terminal-dark border-terminal-border'
                                      }`}
                                  >
                                    <div className={`w-3 h-3 rounded-full shadow-lg transform transition-transform duration-300 ${edited.is_verified ? 'translate-x-5 bg-terminal-accent shadow-terminal-accent/50' : 'translate-x-0 bg-terminal-muted/50'
                                      }`} />
                                  </button>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] uppercase tracking-tighter text-terminal-muted">Role</span>
                                  <select
                                    value={edited.role}
                                    onChange={(event) => updateEdit(user.id, { role: event.target.value as AdminUser['role'] })}
                                    className="bg-terminal-dark/50 border border-terminal-border/50 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-terminal-accent cursor-pointer uppercase font-mono"
                                  >
                                    <option value="user">Member</option>
                                    <option value="admin">Overseer</option>
                                  </select>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2 max-w-[300px]">
                                {FLAGS.map((flag) => {
                                  const active = edited.flags?.includes(flag.id);
                                  return (
                                    <button
                                      key={`${user.id}-${flag.id}`}
                                      onClick={() => toggleFlag(user.id, flag.id)}
                                      className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-tighter transition-all border ${active
                                        ? 'bg-terminal-accent/10 border-terminal-accent/30 text-terminal-accent shadow-[0_0_5px_rgba(255,59,59,0.1)]'
                                        : 'bg-terminal-dark border-terminal-border text-terminal-muted/40 hover:border-terminal-muted/60'
                                        }`}
                                    >
                                      {flag.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-terminal-muted font-mono leading-none">{formatDate(user.last_login_at)}</span>
                                <span className="text-[8px] uppercase tracking-tighter text-terminal-muted opacity-40 mt-1">Created: {formatDate(user.created_at).split(',')[0]}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => saveUser(user.id)}
                                disabled={!isChanged}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isChanged
                                  ? 'bg-terminal-accent text-white shadow-lg shadow-terminal-accent/20 hover:scale-105 active:scale-95'
                                  : 'bg-terminal-dark/50 text-terminal-muted opacity-40 cursor-default border border-terminal-border font-mono'
                                  }`}
                              >
                                <Save size={12} />
                                Update State
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-terminal-panel/50 border border-terminal-border p-4 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest text-terminal-muted font-mono">
                Registry Index: <span className="text-white">{(page - 1) * pageSize + 1} — {Math.min(page * pageSize, totalUsers)}</span> of {totalUsers} nodes
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-terminal-border rounded-lg text-terminal-muted hover:bg-white/5 hover:text-white transition-all disabled:opacity-20 flex items-center gap-1 active:scale-95"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  <X size={10} className="rotate-90 origin-center" /> Previous
                </button>
                <div className="flex items-center gap-1 px-4 font-mono text-xs">
                  <span className="text-terminal-accent">{page}</span>
                  <span className="text-terminal-muted opacity-30">/</span>
                  <span className="text-terminal-muted">{totalPages}</span>
                </div>
                <button
                  className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-terminal-border rounded-lg text-terminal-muted hover:bg-white/5 hover:text-white transition-all disabled:opacity-20 flex items-center gap-1 active:scale-95"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next <X size={10} className="-rotate-90 origin-center" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-4 bg-terminal-panel border border-terminal-border rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-widest">Chronological Security Audit</h3>
                  <p className="text-[10px] text-terminal-muted tracking-tight">Immutable history branch records.</p>
                </div>
                <button
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border border-terminal-border text-terminal-muted hover:bg-white/5 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                  onClick={() => loadAudit()}
                >
                  <RefreshCw size={14} className={loadingAudit ? 'animate-spin' : ''} />
                  Refresh Stream
                </button>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-terminal-border/20">
                <div className="space-y-1">
                  <label className="text-[9px] text-terminal-muted uppercase font-bold tracking-tighter">Action Type</label>
                  <input
                    type="text"
                    placeholder="e.g. vault.client.create"
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                    className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-terminal-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-terminal-muted uppercase font-bold tracking-tighter">Operator Mail / ID</label>
                  <input
                    type="text"
                    placeholder="Search by mail/id..."
                    value={auditFilters.actorId}
                    onChange={(e) => setAuditFilters({ ...auditFilters, actorId: e.target.value })}
                    className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-terminal-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-terminal-muted uppercase font-bold tracking-tighter">General Search</label>
                  <input
                    type="text"
                    placeholder="Search IP, UA..."
                    value={auditFilters.search}
                    onChange={(e) => setAuditFilters({ ...auditFilters, search: e.target.value })}
                    className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-terminal-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-terminal-muted uppercase font-bold tracking-tighter">Date Start</label>
                  <input
                    type="date"
                    value={auditFilters.dateStart}
                    onChange={(e) => setAuditFilters({ ...auditFilters, dateStart: e.target.value })}
                    className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-terminal-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-terminal-muted uppercase font-bold tracking-tighter">Date End</label>
                  <input
                    type="date"
                    value={auditFilters.dateEnd}
                    onChange={(e) => setAuditFilters({ ...auditFilters, dateEnd: e.target.value })}
                    className="w-full bg-terminal-dark border border-terminal-border rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-terminal-accent outline-none font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setAuditFilters({ action: '', actorId: '', targetId: '', dateStart: '', dateEnd: '', search: '' })}
                    className="w-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-terminal-accent/30 text-terminal-accent rounded-lg hover:bg-terminal-accent/10 transition-all"
                  >
                    Reset Link
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-terminal-panel border border-terminal-border rounded-xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-terminal-text border-collapse">
                  <thead>
                    <tr className="text-left bg-terminal-dark/50 border-b border-terminal-border">
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Timestamp</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Action Type</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Operator</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Subject Node</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-terminal-muted">Event Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terminal-border/20">
                    {loadingAudit ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-terminal-muted animate-pulse font-mono uppercase tracking-[0.1em]">
                          Streaming Event Logs...
                        </td>
                      </tr>
                    ) : auditRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-terminal-muted font-mono uppercase tracking-[0.1em]">
                          No telemetry data available
                        </td>
                      </tr>
                    ) : (
                      auditRows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.01] transition-colors border-b border-terminal-border/10">
                          <td className="px-6 py-4 font-mono text-terminal-muted text-[10px]">{formatDate(row.created_at)}</td>
                          <td className="px-6 py-4">
                            <span className="bg-terminal-accent/5 text-terminal-accent border border-terminal-accent/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter">
                              {row.action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white">{row.actor_email || '—'}</span>
                              <span className="text-[8px] font-mono text-terminal-muted opacity-40 uppercase tracking-tighter">{row.ip || 'INTERNAL_IPC'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-terminal-muted">{row.target_email || '—'}</td>
                          <td className="px-6 py-4">
                            <pre className="text-[9px] font-mono text-cyan-400/60 max-w-[250px] truncate bg-black/40 px-2 py-1 rounded cursor-help" title={row.metadata ? JSON.stringify(row.metadata, null, 2) : undefined}>
                              {row.metadata ? JSON.stringify(row.metadata) : 'EMPTY_DATA'}
                            </pre>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between bg-terminal-panel/50 border border-terminal-border p-4 rounded-xl">
              <div className="text-[10px] uppercase tracking-widest text-terminal-muted font-mono">
                Total Audit Stream: <span className="text-white">{auditTotal} records</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-terminal-border rounded-lg text-terminal-muted hover:bg-white/5 disabled:opacity-20 active:scale-95"
                  onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                  disabled={auditPage <= 1}
                >
                  Prev
                </button>
                <div className="px-4 font-mono text-xs">
                  <span className="text-terminal-accent">{auditPage}</span>
                  <span className="text-terminal-muted opacity-30 mx-1">/</span>
                  <span className="text-terminal-muted">{auditPages}</span>
                </div>
                <button
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-terminal-border rounded-lg text-terminal-muted hover:bg-white/5 disabled:opacity-20 active:scale-95"
                  onClick={() => setAuditPage((prev) => Math.min(auditPages, prev + 1))}
                  disabled={auditPage >= auditPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
