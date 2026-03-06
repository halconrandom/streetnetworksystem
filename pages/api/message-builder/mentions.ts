import { NextApiRequest, NextApiResponse } from 'next';
import { query, execute } from '@lib/db';
import { hasFlag, getOrCreateUserByClerkId } from '@lib/clerk-sync';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeMention = (row: any) => ({
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

    // GET - List mentions (only user's own)
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, keyword, kind, target_id, display_name, created_at, updated_at
         FROM sn_messagebuilder_mentions
         WHERE user_id = $1 OR user_id IS NULL
         ORDER BY created_at DESC`,
        [user.id]
      );
      return res.json(result.map(normalizeMention));
    }

    // POST - Create mention
    if (req.method === 'POST') {
      const { keyword, kind, target_id, display_name } = req.body || {};
      if (!keyword || !target_id || !['role', 'user', 'channel', 'mentionable'].includes(kind)) {
        return res.status(400).json({ error: 'Invalid mention payload' });
      }
      if (!isNumericId(target_id)) {
        return res.status(400).json({ error: 'Invalid target_id' });
      }

      const result = await execute(
        `INSERT INTO sn_messagebuilder_mentions (keyword, kind, target_id, display_name, user_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, keyword, kind, target_id, display_name, created_at, updated_at`,
        [keyword, kind, String(target_id).trim(), display_name || null, user.id]
      );

      return res.status(201).json(normalizeMention(result[0]));
    }

    // DELETE - Delete mention (only user's own)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Mention ID required' });
      }

      const result = await execute(
        `DELETE FROM sn_messagebuilder_mentions WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, user.id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Not found or not authorized' });
      }

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/message-builder/mentions] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
