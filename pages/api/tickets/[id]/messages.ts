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
    const messages = await query<any>(
      `SELECT id, ticket_id, user_id, content, created_at, user_name
       FROM sn_ticket_messages
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return res.status(200).json(
      messages.map((m) => ({ ...m, created_at: toIso(m.created_at) }))
    );
  } catch (error) {
    console.error('[/api/tickets/[id]/messages]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
