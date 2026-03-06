import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { getOrCreateUserByClerkId } from '@lib/clerk-sync';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeNote = (row: any) => ({
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
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query<any>(
      `SELECT note_number, ticket_id, author_id, content, created_at
       FROM sn_notes
       WHERE ticket_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [id]
    );

    return res.json(result.map(normalizeNote));
  } catch (error) {
    console.error('[/api/tickets/[id]/notes] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
