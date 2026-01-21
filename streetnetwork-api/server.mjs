import 'dotenv/config';
import express from 'express';
import pg from 'pg';

const { Pool } = pg;

const PORT = Number(process.env.PORT || 8788);
const DATABASE_URL = process.env.DATABASE_URL || '';
const API_KEY = process.env.API_KEY || '';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const app = express();

app.use(express.json({ limit: '2mb' }));

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

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/message-builder/health', (_req, res) => res.json({ ok: true }));
app.get('/api/tickets/health', (_req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  if (!API_KEY) return next();
  const headerKey = req.get('x-api-key');
  if (headerKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
});

const isNumericId = (value) => /^\d+$/.test(String(value || '').trim());

app.get('/api/tickets', async (_req, res) => {
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

app.get('/api/message-builder/webhooks', async (_req, res) => {
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

app.listen(PORT, () => {
  console.log(`Message Builder API listening on :${PORT}`);
});
