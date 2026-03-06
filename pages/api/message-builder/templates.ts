import { NextApiRequest, NextApiResponse } from 'next';
import { query, execute } from '@lib/db';
import { hasFlag, getOrCreateUserByClerkId } from '@lib/clerk-sync';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeTemplate = (row: any) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  updated_at: toIsoUtc(row.updated_at),
});

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

    // GET - List templates
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, name, data, created_at, updated_at
         FROM sn_messagebuilder_templates
         ORDER BY created_at DESC`
      );
      return res.json(result.map(normalizeTemplate));
    }

    // POST - Create template
    if (req.method === 'POST') {
      const { name, data } = req.body || {};
      if (!name || data == null) {
        return res.status(400).json({ error: 'Invalid template payload' });
      }

      const result = await execute(
        `INSERT INTO sn_messagebuilder_templates (name, data)
         VALUES ($1, $2::jsonb)
         RETURNING id, name, data, created_at, updated_at`,
        [name, JSON.stringify(data)]
      );

      return res.status(201).json(normalizeTemplate(result[0]));
    }

    // DELETE - Delete template
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Template ID required' });
      }

      const result = await execute(
        `DELETE FROM sn_messagebuilder_templates WHERE id = $1 RETURNING id`,
        [id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/message-builder/templates] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
