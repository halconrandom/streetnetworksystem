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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, name, data, created_at, updated_at
         FROM sn_messagebuilder_templates
         ORDER BY created_at DESC`
      );
      return res.json(result.map(normalize));
    }

    if (req.method === 'POST') {
      const { name, data } = req.body || {};
      if (!name || !data) return res.status(400).json({ error: 'Invalid template payload' });
      const result = await execute(
        `INSERT INTO sn_messagebuilder_templates (name, data)
         VALUES ($1, $2)
         RETURNING id, name, data, created_at, updated_at`,
        [name, JSON.stringify(data)]
      );
      return res.status(201).json(normalize(result[0]));
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { name } = req.body || {};
      if (!id || !name) return res.status(400).json({ error: 'Missing fields' });
      const result = await execute(
        `UPDATE sn_messagebuilder_templates SET name = $1, updated_at = NOW()
         WHERE id = $2 RETURNING id, name, data, created_at, updated_at`,
        [name, id]
      );
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      return res.json(normalize(result[0]));
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Template ID required' });
      const result = await execute(
        `DELETE FROM sn_messagebuilder_templates WHERE id = $1 RETURNING id`,
        [id]
      );
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/message-builder/templates]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
