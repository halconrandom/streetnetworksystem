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
  { id: 'settings', label: 'Settings' },
  { id: 'admin_panel', label: 'Admin Panel' },
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

export default function AdminPanelView() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API || '';
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 25;
  const [editMap, setEditMap] = useState<Record<string, AdminUser>>({});

  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const auditPageSize = 25;
  const [loadingAudit, setLoadingAudit] = useState(false);

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
      const params = new URLSearchParams({
        page: String(auditPage),
        pageSize: String(auditPageSize),
      });
      const res = await fetch(`${apiBase}/admin/audit?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setAuditRows(data.rows || []);
      setAuditTotal(data.total || 0);
    } catch (err) {
      // ignore
    } finally {
      setLoadingAudit(false);
    }
  }, [apiBase, auditPage, auditPageSize]);

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
      loadUsers();
      loadAudit();
    }
  }, [checkingAccess, accessDenied, loadUsers, loadAudit]);

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
      <div className="flex h-full items-center justify-center text-terminal-muted">
        Verifying access...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-full items-center justify-center text-terminal-muted">
        <div className="text-center space-y-2">
          <div className="text-lg text-white">Access Denied</div>
          <div className="text-xs uppercase tracking-wide">Admin role required</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-white font-semibold">Admin Panel</h2>
          <p className="text-xs text-terminal-muted">Manage users, roles, verification and access flags.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-terminal-muted">
          <Shield size={14} />
          Role protected
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center gap-2">
            <Search size={14} className="text-terminal-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(1);
                  loadUsers();
                }
              }}
              placeholder="Search by email or id"
              className="bg-terminal-dark border border-terminal-border rounded px-3 py-1 text-xs text-white w-64"
            />
          </div>
          <button
            className="px-3 py-1 text-xs rounded border border-terminal-border text-terminal-muted"
            onClick={() => {
              setPage(1);
              loadUsers();
            }}
          >
            Search
          </button>
          <button
            className="px-3 py-1 text-xs rounded border border-terminal-border text-terminal-muted flex items-center gap-2"
            onClick={() => loadUsers()}
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <div className="ml-auto text-xs text-terminal-muted">
            {totalUsers} users
          </div>
        </div>

        {usersError && <div className="text-xs text-terminal-accent">{usersError}</div>}

        <div className="overflow-auto">
          <table className="w-full text-xs text-terminal-muted">
            <thead>
              <tr className="text-left border-b border-terminal-border">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>ID</th>
                <th>Role</th>
                <th>Active</th>
                <th>Verified</th>
                <th>Flags</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers && (
                <tr>
                  <td colSpan={9} className="py-4 text-center">Loading...</td>
                </tr>
              )}
              {!loadingUsers && users.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-4 text-center">No users found.</td>
                </tr>
              )}
              {users.map((user) => {
                const edited = editMap[user.id] || user;
                return (
                  <tr key={user.id} className="border-b border-terminal-border/60 align-top">
                    <td className="py-3 text-white">{deriveName(user.email)}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">{user.id.slice(0, 8)}...</td>
                    <td className="py-3">
                      <select
                        value={edited.role}
                        onChange={(event) => updateEdit(user.id, { role: event.target.value as AdminUser['role'] })}
                        className="bg-terminal-dark border border-terminal-border rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => updateEdit(user.id, { is_active: !edited.is_active })}
                        className="flex items-center gap-1 text-xs"
                      >
                        {edited.is_active ? <Check size={14} className="text-terminal-accent" /> : <X size={14} />}
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => updateEdit(user.id, { is_verified: !edited.is_verified })}
                        className="flex items-center gap-1 text-xs"
                      >
                        {edited.is_verified ? <Check size={14} className="text-terminal-accent" /> : <X size={14} />}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="grid grid-cols-2 gap-2">
                        {FLAGS.map((flag) => (
                          <label key={`${user.id}-${flag.id}`} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={edited.flags?.includes(flag.id)}
                              onChange={() => toggleFlag(user.id, flag.id)}
                            />
                            <span>{flag.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">{formatDate(user.last_login_at)}</td>
                    <td className="py-3">
                      <button
                        className="px-3 py-1 text-xs rounded border border-terminal-border text-terminal-muted flex items-center gap-2"
                        onClick={() => saveUser(user.id)}
                      >
                        <Save size={12} /> Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span>Page {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border border-terminal-border rounded"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 border border-terminal-border rounded"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-sm font-semibold">Audit Logs</h3>
            <p className="text-xs text-terminal-muted">Recent administrative actions.</p>
          </div>
          <button
            className="px-3 py-1 text-xs rounded border border-terminal-border text-terminal-muted flex items-center gap-2"
            onClick={() => loadAudit()}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs text-terminal-muted">
            <thead>
              <tr className="text-left border-b border-terminal-border">
                <th className="py-2">Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {loadingAudit && (
                <tr>
                  <td colSpan={5} className="py-4 text-center">Loading...</td>
                </tr>
              )}
              {!loadingAudit && auditRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center">No audit entries.</td>
                </tr>
              )}
              {auditRows.map((row) => (
                <tr key={row.id} className="border-b border-terminal-border/60">
                  <td className="py-2">{formatDate(row.created_at)}</td>
                  <td>{row.action}</td>
                  <td>{row.actor_email || '—'}</td>
                  <td>{row.target_email || '—'}</td>
                  <td className="max-w-xs truncate">
                    {row.metadata ? JSON.stringify(row.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span>Page {auditPage} / {auditPages}</span>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border border-terminal-border rounded"
              onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
              disabled={auditPage <= 1}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 border border-terminal-border rounded"
              onClick={() => setAuditPage((prev) => Math.min(auditPages, prev + 1))}
              disabled={auditPage >= auditPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
