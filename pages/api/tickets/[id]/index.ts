import { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@lib/db';

const toIsoUtc = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeTicket = (row: any) => ({
  ...row,
  created_at: toIsoUtc(row.created_at),
  closed_at: toIsoUtc(row.closed_at),
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
    const result = await queryOne<any>(
      `SELECT id, ticket_number, user_id, thread_id, category, status, claimed_by, claimed_by_name,
              closed_by, closed_by_name, created_at, closed_at, opened_by_name, full_name,
              contact_preference, active_project_name, bug_reported, support_needed,
              project_description, project_budget, inquiry_description, transcript_code, resolution
       FROM sn_tickets
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(normalizeTicket(result));
  } catch (error) {
    console.error('[/api/tickets/[id]] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
