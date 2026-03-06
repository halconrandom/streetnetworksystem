import { NextApiRequest, NextApiResponse } from 'next';
import { query, execute } from '@lib/db';
import { hasFlag, getOrCreateUserByClerkId } from '@lib/clerk-sync';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeWebhook = (row: any) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

const isNumericId = (value: any) => /^\d+$/.test(String(value || '').trim());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getOrCreateUserByClerkId(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasMessageBuilder = await hasFlag(user.id, 'message_builder');
    if (!hasMessageBuilder) {
      return res.status(403).json({ error: 'Missing required permission: message_builder' });
    }

    // GET - List webhooks (only user's own)
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at
         FROM sn_messagebuilder_webhook_targets
         WHERE clerk_id = $1 OR clerk_id IS NULL
         ORDER BY created_at DESC`,
        [user.clerk_id]
      );
      return res.json(result.map(normalizeWebhook));
    }

    // POST - Create webhook
    if (req.method === 'POST') {
      const { name, value, kind, is_thread_enabled, thread_id } = req.body || {};
      if (!name || !value || (kind !== 'webhook' && kind !== 'channel')) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }
      if (is_thread_enabled && !isNumericId(thread_id)) {
        return res.status(400).json({ error: 'Invalid thread_id' });
      }

      const result = await execute(
        `INSERT INTO sn_messagebuilder_webhook_targets
         (name, value, kind, is_thread_enabled, thread_id, clerk_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, value, kind, is_thread_enabled, thread_id, created_at, updated_at`,
        [name, value, kind, !!is_thread_enabled, is_thread_enabled ? String(thread_id).trim() : null, user.clerk_id]
      );

      return res.status(201).json(normalizeWebhook(result[0]));
    }

    // DELETE - Delete webhook (only user's own)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Webhook ID required' });
      }

      const result = await execute(
        `DELETE FROM sn_messagebuilder_webhook_targets WHERE id = $1 AND clerk_id = $2 RETURNING id`,
        [id, user.clerk_id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Not found or not authorized' });
      }

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/message-builder/webhooks] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
