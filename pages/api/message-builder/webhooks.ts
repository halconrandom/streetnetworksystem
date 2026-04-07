import type { NextApiRequest, NextApiResponse } from 'next';
import { query, execute } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalize = (row: any) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

const isNumericId = (value: any) => /^\d+$/.test(String(value || '').trim());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at
         FROM sn_messagebuilder_webhook_targets
         ORDER BY created_at DESC`
      );
      return res.json(result.map(normalize));
    }

    if (req.method === 'POST') {
      const { name, value, kind, is_thread_enabled, thread_id } = req.body || {};
      if (!name || !value || (kind !== 'webhook' && kind !== 'channel')) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }
      if (is_thread_enabled && !isNumericId(thread_id)) {
        return res.status(400).json({ error: 'Invalid thread_id' });
      }
      const result = await execute(
        `INSERT INTO sn_messagebuilder_webhook_targets (name, value, kind, is_thread_enabled, thread_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at`,
        [name, value, kind, !!is_thread_enabled, is_thread_enabled ? String(thread_id).trim() : null]
      );
      return res.status(201).json(normalize(result[0]));
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { name, value } = req.body || {};
      if (!id || (!name && !value)) return res.status(400).json({ error: 'Missing fields' });
      const fields: string[] = [];
      const params: any[] = [];
      let i = 1;
      if (name)  { fields.push(`name = $${i++}`); params.push(name); }
      if (value) { fields.push(`value = $${i++}`); params.push(value); }
      params.push(id);
      const result = await execute(
        `UPDATE sn_messagebuilder_webhook_targets SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${i} RETURNING id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at`,
        params
      );
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      return res.json(normalize(result[0]));
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Webhook ID required' });
      const result = await execute(
        `DELETE FROM sn_messagebuilder_webhook_targets WHERE id = $1 RETURNING id`,
        [id]
      );
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/message-builder/webhooks]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
