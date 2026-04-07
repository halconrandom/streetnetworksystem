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

const VALID_KINDS = ['role', 'user', 'channel', 'mentionable'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, keyword, kind, target_id, display_name, created_at, updated_at
         FROM sn_messagebuilder_mentions
         ORDER BY created_at DESC`
      );
      return res.json(result.map(normalize));
    }

    if (req.method === 'POST') {
      const { keyword, kind, target_id, display_name } = req.body || {};
      if (!keyword || !VALID_KINDS.includes(kind) || !/^\d+$/.test(String(target_id || '').trim())) {
        return res.status(400).json({ error: 'Invalid mention payload' });
      }
      const result = await execute(
        `INSERT INTO sn_messagebuilder_mentions (keyword, kind, target_id, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, keyword, kind, target_id, display_name, created_at, updated_at`,
        [keyword, kind, String(target_id).trim(), display_name || null]
      );
      return res.status(201).json(normalize(result[0]));
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { keyword, target_id, display_name } = req.body || {};
      if (!id || !keyword || !/^\d+$/.test(String(target_id || '').trim())) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      const result = await execute(
        `UPDATE sn_messagebuilder_mentions
         SET keyword = $1, target_id = $2, display_name = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, keyword, kind, target_id, display_name, created_at, updated_at`,
        [keyword, String(target_id).trim(), display_name || null, id]
      );
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      return res.json(normalize(result[0]));
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Mention ID required' });
      const result = await execute(
        `DELETE FROM sn_messagebuilder_mentions WHERE id = $1 RETURNING id`,
        [id]
      );
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/message-builder/mentions]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
