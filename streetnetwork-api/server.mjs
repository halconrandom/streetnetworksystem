import 'dotenv/config';
import argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const PORT = Number(process.env.PORT || 8788);
const DATABASE_URL = process.env.DATABASE_URL || '';
const API_KEY = process.env.API_KEY || '';
const APP_BASE_URL = process.env.APP_BASE_URL || '';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || APP_BASE_URL;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sn_session';
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24 * 7);
const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION === 'true';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const app = express();

const buildAllowedOrigins = () => {
  const raw = [FRONTEND_ORIGIN, APP_BASE_URL]
    .flatMap((value) => (value ? value.split(',') : []))
    .map((value) => value.trim())
    .filter(Boolean);
  const expanded = raw.flatMap((value) => {
    if (value.startsWith('http://') || value.startsWith('https://')) return [value];
    return [`https://${value}`, `http://${value}`];
  });
  return Array.from(new Set(expanded));
};

const allowedOrigins = buildAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const originUrl = new URL(origin);
      const match = allowedOrigins.some((allowed) => {
        try {
          return new URL(allowed).host === originUrl.host;
        } catch {
          return false;
        }
      });
      if (match) return callback(null, true);
    } catch {
      // ignore invalid origin
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

const toIsoUtc = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeTicket = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  closed_at: toIsoUtc(row.closed_at),
});

const normalizeMessage = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
});

const normalizeWebhook = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

const normalizeTemplate = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

const normalizeMention = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

const normalizeNote = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
});

const normalizeAudit = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
});

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isSecureCookie = () => (APP_BASE_URL || '').startsWith('https://');

const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    maxAge: SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: '/',
  });
};

const clearSessionCookie = (res) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    path: '/',
  });
};

const loginAttempts = new Map();
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const getAttemptKey = (email, ip) => `${email || 'unknown'}::${ip || 'unknown'}`;

const recordAttempt = (key, success) => {
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, last: now };
  if (now - entry.last > ATTEMPT_WINDOW_MS) {
    entry.count = 0;
  }
  entry.last = now;
  if (!success) entry.count += 1;
  if (success) entry.count = 0;
  loginAttempts.set(key, entry);
  return entry;
};

const isRateLimited = (key) => {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.last > ATTEMPT_WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
};

const passwordMeetsPolicy = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 12) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSymbol;
};

const createSession = async ({ userId, ip, userAgent }) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  await pool.query(
    `insert into public.sn_sessions (user_id, token_hash, expires_at, ip, user_agent)
     values ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ip || null, userAgent || null]
  );
  return token;
};

const getUserFlags = async (userId) => {
  const result = await pool.query(
    `select flag from public.sn_user_flags where user_id = $1 order by flag asc`,
    [userId]
  );
  return result.rows.map((row) => row.flag);
};

const loadSessionUser = async (req) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const result = await pool.query(
    `select s.id as session_id, s.user_id as id, s.expires_at, u.email, u.role, u.is_active, u.is_verified
     from public.sn_sessions s
     join public.sn_users u on u.id = s.user_id
     where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()
     limit 1`,
    [tokenHash]
  );
  if (!result.rowCount) return null;
  await pool.query(`update public.sn_sessions set last_used_at = now() where id = $1`, [result.rows[0].session_id]);
  return result.rows[0];
};

const auditLog = async ({ actorUserId, action, targetUserId, metadata, ip, userAgent }) => {
  try {
    await pool.query(
      `insert into public.sn_audit_logs (actor_user_id, action, target_user_id, metadata, ip, user_agent)
       values ($1, $2, $3, $4::jsonb, $5, $6)`,
      [actorUserId || null, action, targetUserId || null, metadata ? JSON.stringify(metadata) : null, ip || null, userAgent || null]
    );
  } catch (err) {
    console.error('audit log failed', err);
  }
};

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/message-builder/health', (_req, res) => res.json({ ok: true }));
app.get('/api/tickets/health', (_req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  const isWhitelisted =
    req.path.startsWith('/api/auth') ||
    req.path.startsWith('/api/admin') ||
    req.path.startsWith('/api/nexus') ||
    req.path.startsWith('/api/vault') ||
    req.path.startsWith('/api/tickets') ||
    req.path.startsWith('/api/screenshot-editor') ||
    req.path.startsWith('/api/message-builder');

  if (isWhitelisted) {
    return next();
  }

  if (req.path === '/health') return next();
  if (!API_KEY) return next();

  const headerKey = req.get('x-api-key');
  if (headerKey !== API_KEY) {
    console.warn(`[AUTH] 401 Blocked (Missing API Key): ${req.method} ${req.path}. Whitelist match: ${isWhitelisted}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
});

const isNumericId = (value) => /^\d+$/.test(String(value || '').trim());

const getRequestIp = (req) => {
  const forwarded = (req.headers['x-forwarded-for'] || '').toString().split(',')[0]?.trim();
  return forwarded || req.socket?.remoteAddress || '';
};

const buildUserPayload = async (userRow) => {
  const flags = await getUserFlags(userRow.id);
  return {
    id: userRow.id,
    name: userRow.name || null,
    email: userRow.email,
    role: userRow.role,
    isVerified: userRow.is_verified,
    flags,
  };
};

const ADMIN_FLAGS = [
  'dashboard',
  'tickets',
  'transcripts',
  'message_builder',
  'screenshot_editor',
  'users',
  'audit_logs',
  'nexus',
  'vault',
];

const normalizeFlags = (flags) => {
  if (!Array.isArray(flags)) return [];
  const filtered = flags
    .map((flag) => String(flag || '').trim())
    .filter((flag) => ADMIN_FLAGS.includes(flag));
  return Array.from(new Set(filtered));
};

const requireAdmin = async (req, res, next) => {
  try {
    const sessionUser = await loadSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' });
    if (!sessionUser.is_active) return res.status(403).json({ error: 'User disabled' });
    if (sessionUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // Fetch flags for the middleware context
    const flags = await getUserFlags(sessionUser.id);
    req.adminUser = { ...sessionUser, flags };
    return next();
  } catch (err) {
    console.error('admin auth failed', err);
    return res.status(500).json({ error: 'Failed to authorize' });
  }
};

const requireFlag = (flag) => async (req, res, next) => {
  try {
    const sessionUser = await loadSessionUser(req);
    if (!sessionUser) {
      console.warn(`[AUTH] 401 Unauthorized (No Session): ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!sessionUser.is_active) return res.status(403).json({ error: 'User disabled' });

    if (sessionUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const flags = await getUserFlags(sessionUser.id);
    if (!flags.includes(flag)) {
      console.warn(`[AUTH] 403 Forbidden (Missing Flag '${flag}'): ${sessionUser.email} on ${req.method} ${req.path}. User has: ${flags.join(', ')}`);
      return res.status(403).json({ error: `Missing required permission: ${flag}` });
    }

    req.adminUser = { ...sessionUser, flags };
    return next();
  } catch (err) {
    console.error(`flag check failed for ${flag}`, err);
    return res.status(500).json({ error: 'Authorization error' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  if (!ALLOW_REGISTRATION) {
    return res.status(403).json({ error: 'Registration disabled' });
  }
  const { email, password, name } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (!passwordMeetsPolicy(password)) {
    return res.status(400).json({
      error: 'Password must be at least 12 characters and include upper, lower, number, and symbol.',
    });
  }
  try {
    const hashed = await argon2.hash(password, { type: argon2.argon2id });
    const result = await pool.query(
      `insert into public.sn_users (email, password_hash, role, name)
       values ($1, $2, 'user', $3)
       returning id, email, role, is_active, is_verified, name`,
      [normalizedEmail, hashed, name]
    );
    await auditLog({
      action: 'user.register',
      targetUserId: result.rows[0].id,
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { method: 'password' },
    });
    return res.status(201).json(await buildUserPayload(result.rows[0]));
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('register failed', err);
    return res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const ip = getRequestIp(req);
  const attemptKey = getAttemptKey(normalizedEmail, ip);
  if (isRateLimited(attemptKey)) {
    return res.status(429).json({ error: 'Too many attempts, try again later' });
  }
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await pool.query(
      `select id, name, email, role, password_hash, is_active, is_verified
       from public.sn_users
       where email = $1
       limit 1`,
      [normalizedEmail]
    );
    if (!result.rowCount) {
      recordAttempt(attemptKey, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'User disabled' });
    }
    if (!user.password_hash) {
      recordAttempt(attemptKey, false);
      return res.status(401).json({ error: 'Password login not available' });
    }
    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) {
      recordAttempt(attemptKey, false);
      await auditLog({
        actorUserId: user.id,
        action: 'auth.login_failed',
        ip,
        userAgent: req.get('user-agent'),
        metadata: { method: 'password' },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    recordAttempt(attemptKey, true);
    const token = await createSession({ userId: user.id, ip, userAgent: req.get('user-agent') });
    setSessionCookie(res, token);
    await pool.query(`update public.sn_users set last_login_at = now() where id = $1`, [user.id]);
    await auditLog({
      actorUserId: user.id,
      action: 'auth.login',
      ip,
      userAgent: req.get('user-agent'),
      metadata: { method: 'password' },
    });
    return res.json(await buildUserPayload(user));
  } catch (err) {
    console.error('login failed', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      const tokenHash = hashToken(token);
      await pool.query(`update public.sn_sessions set revoked_at = now() where token_hash = $1`, [tokenHash]);
    }
    clearSessionCookie(res);
    await auditLog({
      action: 'auth.logout',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('logout failed', err);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const sessionUser = await loadSessionUser(req);
    if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await buildUserPayload(sessionUser);
    return res.json(payload);
  } catch (err) {
    console.error('auth me failed', err);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.put('/api/users/me', requireAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const userId = req.adminUser.id;

    // Updates
    const updates = [];
    const values = [];
    let idx = 1;

    if (name) {
      // Check if name is taken
      const nameCheck = await pool.query('SELECT id FROM public.sn_users WHERE name = $1 AND id != $2', [name, userId]);
      if (nameCheck.rowCount > 0) return res.status(409).json({ error: 'Nombre de usuario ya en uso' });
      updates.push(`name = $${idx++}`);
      values.push(name);
    }

    if (email) {
      const normalizedEmail = normalizeEmail(email);
      const emailCheck = await pool.query('SELECT id FROM public.sn_users WHERE email = $1 AND id != $2', [normalizedEmail, userId]);
      if (emailCheck.rowCount > 0) return res.status(409).json({ error: 'Correo ya en uso' });
      updates.push(`email = $${idx++}`);
      values.push(normalizedEmail);
    }

    if (password) {
      if (!passwordMeetsPolicy(password)) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas, números y símbolos.',
        });
      }
      const hashed = await argon2.hash(password, { type: argon2.argon2id });
      updates.push(`password_hash = $${idx++}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE public.sn_users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role, is_verified`,
      values
    );

    return res.json(await buildUserPayload(result.rows[0]));
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'El correo o nombre de usuario ya está en uso' });
    }
    console.error('Update failed', err);
    return res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

const requireAuth = async (req, res, next) => {
  try {
    const sessionUser = await loadSessionUser(req);
    if (!sessionUser) {
      console.warn('[AUTH] Unauthorized access attempt to:', req.path);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!sessionUser.is_active) {
      console.warn('[AUTH] Inactive user attempt:', sessionUser.email);
      return res.status(403).json({ error: 'User disabled' });
    }
    req.user = sessionUser;
    return next();
  } catch (err) {
    console.error('[AUTH] Middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

app.get('/api/nexus', requireFlag('nexus'), async (req, res) => {
  try {
    const result = await pool.query(
      `select data from public.sn_nexus_states where user_id = $1 limit 1`,
      [req.adminUser.id]
    );
    return res.json(result.rows[0]?.data || { nodes: [], connections: [], camera: { x: 0, y: 0, zoom: 1 } });
  } catch (err) {
    console.error('[NEXUS] Fetch failed for user:', req.adminUser.id, err);
    return res.status(500).json({ error: 'Failed to fetch nexus data' });
  }
});

app.post('/api/nexus', requireFlag('nexus'), async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.nodes) {
      console.warn('[NEXUS] Invalid data payload received from:', req.adminUser.email);
      return res.status(400).json({ error: 'Invalid data format' });
    }

    await pool.query(
      `insert into public.sn_nexus_states (user_id, data)
             values ($1, $2::jsonb)
             on conflict (user_id) do update set data = $2::jsonb, updated_at = now()`,
      [req.adminUser.id, JSON.stringify(data)]
    );
    console.log('[NEXUS] State saved successfully for:', req.adminUser.email);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[NEXUS] Save failed for user:', req.adminUser.id, err);
    if (err.code === '42P01') {
      return res.status(500).json({ error: 'Database table missing. Please run the SQL migration 003_nexus.sql.' });
    }
    return res.status(500).json({ error: 'Failed to save nexus data' });
  }
});

app.get('/api/screenshot-editor/load-points', requireFlag('screenshot_editor'), async (req, res) => {
  try {
    const result = await pool.query(
      `select id, name, image_data_url, state_data, created_at
       from public.sn_seditorLoadPoints
       where user_id = $1
       order by created_at desc
       limit 50`,
      [req.adminUser.id]
    );
    return res.json({ rows: result.rows });
  } catch (err) {
    console.error('[S_EDITOR] Fetch failed for user:', req.adminUser.id, err);
    return res.status(500).json({ error: 'Failed to fetch load points' });
  }
});

app.post('/api/screenshot-editor/load-points', requireFlag('screenshot_editor'), async (req, res) => {
  try {
    const { name, imageDataUrl, stateData } = req.body || {};
    if (!name || !imageDataUrl || !stateData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const countResult = await pool.query(
      `select count(*)::int from public.sn_seditorLoadPoints where user_id = $1`,
      [req.adminUser.id]
    );

    // Limit points to 20 per user to avoid bloat
    if (countResult.rows[0].count >= 20) {
      // delete oldest
      await pool.query(
        `delete from public.sn_seditorLoadPoints
         where id in (
             select id from public.sn_seditorLoadPoints
             where user_id = $1
             order by created_at asc
             limit 1
         )`,
        [req.adminUser.id]
      );
    }

    const result = await pool.query(
      `insert into public.sn_seditorLoadPoints (user_id, name, image_data_url, state_data)
       values ($1, $2, $3, $4::jsonb)
       returning id, name, image_data_url, state_data, created_at`,
      [req.adminUser.id, name, imageDataUrl, JSON.stringify(stateData)]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[S_EDITOR] Save failed for user:', req.adminUser.id, err);
    return res.status(500).json({ error: 'Failed to save load point' });
  }
});

app.put('/api/screenshot-editor/load-points/:id', requireFlag('screenshot_editor'), async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = await pool.query(
      `update public.sn_seditorLoadPoints
       set name = $1, updated_at = now()
       where id = $2 and user_id = $3
       returning id, name, image_data_url, state_data, created_at`,
      [name, req.params.id, req.adminUser.id]
    );

    if (!result.rowCount) return res.status(404).json({ error: 'Load point not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[S_EDITOR] Update failed for user:', req.adminUser.id, err);
    return res.status(500).json({ error: 'Failed to update load point' });
  }
});

app.delete('/api/screenshot-editor/load-points/:id', requireFlag('screenshot_editor'), async (req, res) => {
  try {
    const result = await pool.query(
      `delete from public.sn_seditorLoadPoints
       where id = $1 and user_id = $2`,
      [req.params.id, req.adminUser.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Load point not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[S_EDITOR] Delete failed for user:', req.adminUser.id, err);
    return res.status(500).json({ error: 'Failed to delete load point' });
  }
});

app.get('/api/admin/flags', requireAdmin, (_req, res) => {
  return res.json({ flags: ADMIN_FLAGS });
});

app.get('/api/admin/stats', requireFlag('dashboard'), async (_req, res) => {
  try {
    const [users, tickets, audit] = await Promise.all([
      pool.query(`select count(*)::int as total from public.sn_users`),
      pool.query(`select count(*)::int as total, count(*) filter (where status = 'open')::int as open from public.sn_tickets`),
      pool.query(`select count(*)::int as total from public.sn_audit_logs`),
    ]);

    const activeSessions = await pool.query(`select count(distinct user_id)::int as total from public.sn_sessions where expires_at > now() and revoked_at is null`);

    return res.json({
      totalUsers: users.rows[0].total,
      totalTickets: tickets.rows[0].total,
      openTickets: tickets.rows[0].open,
      activeMembers: activeSessions.rows[0].total,
      auditRecords: audit.rows[0].total,
      avgResponse: '12m', // Placeholder for now
    });
  } catch (err) {
    console.error('admin stats failed', err);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/admin/users', requireFlag('users'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(200, Math.max(10, Number(req.query.pageSize || 25)));
  const search = String(req.query.q || '').trim();
  const params = [];
  const conditions = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.email ilike $${params.length} or u.id::text ilike $${params.length})`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const countResult = await pool.query(`select count(*)::int as total from public.sn_users u ${where}`, params);
  const total = countResult.rows[0]?.total ?? 0;
  params.push(pageSize);
  params.push((page - 1) * pageSize);
  const rowsResult = await pool.query(
    `select u.id, u.email, u.role, u.is_active, u.is_verified, u.created_at, u.updated_at, u.last_login_at
     from public.sn_users u
     ${where}
     order by u.created_at desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  );
  const users = rowsResult.rows;
  const ids = users.map((row) => row.id);
  let flagsByUser = {};
  if (ids.length) {
    const flagsResult = await pool.query(
      `select user_id, flag from public.sn_user_flags where user_id = any($1::uuid[]) order by flag asc`,
      [ids]
    );
    flagsByUser = flagsResult.rows.reduce((acc, row) => {
      if (!acc[row.user_id]) acc[row.user_id] = [];
      acc[row.user_id].push(row.flag);
      return acc;
    }, {});
  }
  const payload = users.map((row) => ({
    ...row,
    created_at: toIsoUtc(row.created_at),
    updated_at: toIsoUtc(row.updated_at),
    last_login_at: toIsoUtc(row.last_login_at),
    flags: flagsByUser[row.id] || [],
  }));
  return res.json({ rows: payload, total, page, pageSize });
});

app.patch('/api/admin/users/:id', requireFlag('users'), async (req, res) => {
  const id = req.params.id;
  const { role, is_active, is_verified } = req.body || {};
  const nextRole = typeof role === 'string' ? role.trim() : undefined;
  if (nextRole && !['admin', 'user'].includes(nextRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const result = await pool.query(
      `update public.sn_users
       set role = coalesce($2, role),
           is_active = coalesce($3, is_active),
           is_verified = coalesce($4, is_verified),
           updated_at = now()
       where id = $1
       returning id, email, role, is_active, is_verified, created_at, updated_at, last_login_at`,
      [
        id,
        nextRole || null,
        typeof is_active === 'boolean' ? is_active : null,
        typeof is_verified === 'boolean' ? is_verified : null,
      ]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'User not found' });
    await auditLog({
      actorUserId: req.adminUser?.id,
      targetUserId: id,
      action: 'admin.user.update',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { role: nextRole, is_active, is_verified },
    });
    const row = result.rows[0];
    return res.json({
      ...row,
      created_at: toIsoUtc(row.created_at),
      updated_at: toIsoUtc(row.updated_at),
      last_login_at: toIsoUtc(row.last_login_at),
    });
  } catch (err) {
    console.error('admin user update failed', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

app.put('/api/admin/users/:id/flags', requireFlag('users'), async (req, res) => {
  const id = req.params.id;
  const flags = normalizeFlags(req.body?.flags);
  try {
    await pool.query('begin');
    await pool.query(`delete from public.sn_user_flags where user_id = $1`, [id]);
    if (flags.length) {
      const values = flags.map((flag, idx) => `($1, $${idx + 2}, $${flags.length + 2})`).join(', ');
      await pool.query(
        `insert into public.sn_user_flags (user_id, flag, granted_by)
         values ${values}`,
        [id, ...flags, req.adminUser?.id || null]
      );
    }
    await pool.query('commit');
    await auditLog({
      actorUserId: req.adminUser?.id,
      targetUserId: id,
      action: 'admin.flags.update',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { flags },
    });
    return res.json({ ok: true, flags });
  } catch (err) {
    await pool.query('rollback');
    console.error('admin flags update failed', err);
    return res.status(500).json({ error: 'Failed to update flags' });
  }
});

app.get('/api/admin/audit', requireFlag('audit_logs'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(200, Math.max(10, Number(req.query.pageSize || 25)));
  const { action, actorId, targetId, dateStart, dateEnd, search } = req.query;

  const params = [];
  const where = [];

  if (action) {
    params.push(action);
    where.push(`a.action = $${params.length}`);
  }
  if (actorId) {
    params.push(actorId);
    where.push(`a.actor_user_id = $${params.length}`);
  }
  if (targetId) {
    params.push(targetId);
    where.push(`a.target_user_id = $${params.length}`);
  }
  if (dateStart) {
    params.push(dateStart);
    where.push(`a.created_at >= $${params.length}`);
  }
  if (dateEnd) {
    params.push(dateEnd);
    where.push(`a.created_at <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(a.ip ilike $${params.length} or a.user_agent ilike $${params.length} or a.action ilike $${params.length})`);
  }

  const whereSql = where.length ? `where ${where.join(' and ')}` : '';
  const countResult = await pool.query(`select count(*)::int as total from public.sn_audit_logs a ${whereSql}`, params);
  const total = countResult.rows[0]?.total ?? 0;

  params.push(pageSize);
  params.push((page - 1) * pageSize);

  const rowsResult = await pool.query(
    `select a.id, a.action, a.metadata, a.created_at, a.ip, a.user_agent,
            actor.email as actor_email, target.email as target_email
     from public.sn_audit_logs a
     left join public.sn_users actor on actor.id = a.actor_user_id
     left join public.sn_users target on target.id = a.target_user_id
     ${whereSql}
     order by a.created_at desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  );
  const rows = rowsResult.rows.map(normalizeAudit);
  return res.json({ rows, total, page, pageSize });
});


app.get('/api/tickets', requireFlag('tickets'), async (_req, res) => {
  try {
    const result = await pool.query(
      `select id, ticket_number, user_id, thread_id, category, status, claimed_by, claimed_by_name,
              closed_by, closed_by_name, created_at, closed_at, opened_by_name, full_name,
              contact_preference, active_project_name, bug_reported, support_needed,
              project_description, project_budget, inquiry_description, transcript_code, resolution
       from public.sn_tickets
       order by created_at desc`
    );
    res.json(result.rows.map(normalizeTicket));
  } catch (err) {
    console.error('list tickets failed', err);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `select id, ticket_number, user_id, thread_id, category, status, claimed_by, claimed_by_name,
              closed_by, closed_by_name, created_at, closed_at, opened_by_name, full_name,
              contact_preference, active_project_name, bug_reported, support_needed,
              project_description, project_budget, inquiry_description, transcript_code, resolution
       from public.sn_tickets
       where id = $1
       limit 1`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(normalizeTicket(result.rows[0]));
  } catch (err) {
    console.error('get ticket failed', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

app.get('/api/tickets/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `select id, ticket_id, user_id, content, created_at, user_name
       from public.sn_ticket_messages
       where ticket_id = $1
       order by created_at asc`,
      [id]
    );
    res.json(result.rows.map(normalizeMessage));
  } catch (err) {
    console.error('list ticket messages failed', err);
    res.status(500).json({ error: 'Failed to list messages' });
  }
});

app.get('/api/tickets/:id/notes', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `select note_number, ticket_id, author_id, content, created_at
       from public.sn_notes
       where ticket_id = $1 and deleted_at is null
       order by created_at asc`,
      [id]
    );
    res.json(result.rows.map(normalizeNote));
  } catch (err) {
    console.error('list ticket notes failed', err);
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

app.get('/api/message-builder/webhooks', requireFlag('message_builder'), async (_req, res) => {
  try {
    const result = await pool.query(
      `select id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at
       from public.sn_messagebuilder_webhook_targets
       order by created_at desc`
    );
    res.json(result.rows.map(normalizeWebhook));
  } catch (err) {
    console.error('list webhooks failed', err);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

app.post('/api/message-builder/webhooks', async (req, res) => {
  const { name, value, kind, is_thread_enabled, thread_id } = req.body || {};
  if (!name || !value || (kind !== 'webhook' && kind !== 'channel')) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
  if (is_thread_enabled && !isNumericId(thread_id)) {
    return res.status(400).json({ error: 'Invalid thread_id' });
  }

  try {
    const result = await pool.query(
      `insert into public.sn_messagebuilder_webhook_targets
       (name, value, kind, is_thread_enabled, thread_id)
       values ($1, $2, $3, $4, $5)
       returning id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at`,
      [name, value, kind, !!is_thread_enabled, is_thread_enabled ? String(thread_id).trim() : null]
    );
    res.status(201).json(normalizeWebhook(result.rows[0]));
  } catch (err) {
    console.error('create webhook failed', err);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

app.delete('/api/message-builder/webhooks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `delete from public.sn_messagebuilder_webhook_targets where id = $1 returning id`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete webhook failed', err);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

app.get('/api/message-builder/templates', async (_req, res) => {
  try {
    const result = await pool.query(
      `select id, name, data, created_at, updated_at
       from public.sn_messagebuilder_templates
       order by created_at desc`
    );
    res.json(result.rows.map(normalizeTemplate));
  } catch (err) {
    console.error('list templates failed', err);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

app.post('/api/message-builder/templates', async (req, res) => {
  const { name, data } = req.body || {};
  if (!name || data == null) {
    return res.status(400).json({ error: 'Invalid template payload' });
  }
  try {
    const result = await pool.query(
      `insert into public.sn_messagebuilder_templates (name, data)
       values ($1, $2::jsonb)
       returning id, name, data, created_at, updated_at`,
      [name, JSON.stringify(data)]
    );
    res.status(201).json(normalizeTemplate(result.rows[0]));
  } catch (err) {
    console.error('create template failed', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.delete('/api/message-builder/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `delete from public.sn_messagebuilder_templates where id = $1 returning id`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete template failed', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

app.get('/api/message-builder/mentions', async (_req, res) => {
  try {
    const result = await pool.query(
      `select id, keyword, kind, target_id, display_name, created_at, updated_at
       from public.sn_messagebuilder_mentions
       order by created_at desc`
    );
    res.json(result.rows.map(normalizeMention));
  } catch (err) {
    console.error('list mentions failed', err);
    res.status(500).json({ error: 'Failed to list mentions' });
  }
});

app.post('/api/message-builder/mentions', async (req, res) => {
  const { keyword, kind, target_id, display_name } = req.body || {};
  if (!keyword || !target_id || !['role', 'user', 'channel', 'mentionable'].includes(kind)) {
    return res.status(400).json({ error: 'Invalid mention payload' });
  }
  if (!isNumericId(target_id)) {
    return res.status(400).json({ error: 'Invalid target_id' });
  }
  try {
    const result = await pool.query(
      `insert into public.sn_messagebuilder_mentions (keyword, kind, target_id, display_name)
       values ($1, $2, $3, $4)
       returning id, keyword, kind, target_id, display_name, created_at, updated_at`,
      [keyword, kind, String(target_id).trim(), display_name || null]
    );
    res.status(201).json(normalizeMention(result.rows[0]));
  } catch (err) {
    console.error('create mention failed', err);
    res.status(500).json({ error: 'Failed to create mention' });
  }
});

app.delete('/api/message-builder/mentions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `delete from public.sn_messagebuilder_mentions where id = $1 returning id`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete mention failed', err);
    res.status(500).json({ error: 'Failed to delete mention' });
  }
});

/**
 * --- LA BÓVEDA (THE VAULT) ---
 */

const normalizeVaultAsset = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

const normalizeVaultClient = (row) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
  last_interaction: toIsoUtc(row.last_interaction),
});

// Assets CRUD
app.get('/api/vault/assets', requireFlag('vault'), async (req, res) => {
  try {
    const result = await pool.query(
      `select a.*, u.email as owner_email
       from public.sn_vault_assets a
       left join public.sn_users u on u.id = a.owner_id
       order by a.name asc`
    );
    res.json(result.rows.map(normalizeVaultAsset));
  } catch (err) {
    console.error('list assets failed', err);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

app.post('/api/vault/assets', requireFlag('vault'), async (req, res) => {
  const { name, kind, identifier, owner_id, status, metadata } = req.body || {};
  if (!name || !kind) return res.status(400).json({ error: 'Name and kind are required' });
  try {
    const result = await pool.query(
      `insert into public.sn_vault_assets (name, kind, identifier, owner_id, status, metadata)
       values ($1, $2, $3, $4, $5, $6::jsonb)
       returning *`,
      [name, kind, identifier || null, owner_id || null, status || 'active', metadata ? JSON.stringify(metadata) : '{}']
    );
    await auditLog({
      actorUserId: req.adminUser.id,
      action: 'vault.asset.create',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { assetId: result.rows[0].id, name },
    });
    res.status(201).json(normalizeVaultAsset(result.rows[0]));
  } catch (err) {
    console.error('create asset failed', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

app.delete('/api/vault/assets/:id', requireFlag('vault'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`delete from public.sn_vault_assets where id = $1 returning id`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    await auditLog({
      actorUserId: req.adminUser.id,
      action: 'vault.asset.delete',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { assetId: id },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete asset failed', err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Clients CRUD
app.get('/api/vault/clients', requireFlag('vault'), async (req, res) => {
  try {
    const result = await pool.query(`select * from public.sn_vault_clients order by full_name asc`);
    res.json(result.rows.map(normalizeVaultClient));
  } catch (err) {
    console.error('list clients failed', err);
    res.status(500).json({ error: 'Failed to list clients' });
  }
});

app.post('/api/vault/clients', requireFlag('vault'), async (req, res) => {
  const { full_name, email, phone, tier, metadata, internal_notes } = req.body || {};
  if (!full_name) return res.status(400).json({ error: 'Full name is required' });
  try {
    const result = await pool.query(
      `insert into public.sn_vault_clients (full_name, email, phone, tier, metadata, internal_notes)
       values ($1, $2, $3, $4, $5::jsonb, $6)
       returning *`,
      [full_name, email || null, phone || null, tier || 'standard', metadata ? JSON.stringify(metadata) : '{}', internal_notes || null]
    );
    await auditLog({
      actorUserId: req.adminUser.id,
      action: 'vault.client.create',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { clientId: result.rows[0].id, full_name },
    });
    res.status(201).json(normalizeVaultClient(result.rows[0]));
  } catch (err) {
    console.error('create client failed', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.delete('/api/vault/clients/:id', requireFlag('vault'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`delete from public.sn_vault_clients where id = $1 returning id`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Not found' });
    await auditLog({
      actorUserId: req.adminUser.id,
      action: 'vault.client.delete',
      ip: getRequestIp(req),
      userAgent: req.get('user-agent'),
      metadata: { clientId: id },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete client failed', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins:`, allowedOrigins);
});
