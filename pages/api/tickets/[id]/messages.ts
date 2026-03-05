import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeMessage = (row: any) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ticket ID required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query<any>(
      `SELECT id, ticket_id, user_id, content, created_at, user_name
       FROM sn_ticket_messages
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return res.json(result.map(normalizeMessage));
  } catch (error) {
    console.error('[/api/tickets/[id]/messages] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
