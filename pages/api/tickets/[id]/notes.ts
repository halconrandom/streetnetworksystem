import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

const toIso = (v: any) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? v : d.toISOString();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Ticket ID required' });

  try {
    const notes = await query<any>(
      `SELECT note_number, ticket_id, author_id, content, created_at
       FROM sn_notes
       WHERE ticket_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [id]
    );

    return res.status(200).json(
      notes.map((n) => ({ ...n, created_at: toIso(n.created_at) }))
    );
  } catch (error) {
    console.error('[/api/tickets/[id]/notes]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
