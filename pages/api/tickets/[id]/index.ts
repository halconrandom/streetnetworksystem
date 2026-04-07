import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@lib/db';
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
    const ticket = await queryOne<any>(
      `SELECT id, ticket_number, user_id, thread_id, category, status,
              claimed_by, claimed_by_name, closed_by, closed_by_name,
              created_at, closed_at, opened_by_name, full_name,
              contact_preference, active_project_name, bug_reported, support_needed,
              project_description, project_budget, inquiry_description, transcript_code, resolution
       FROM sn_tickets WHERE id = $1`,
      [id]
    );

    if (!ticket) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      ...ticket,
      created_at: toIso(ticket.created_at),
      closed_at: toIso(ticket.closed_at),
    });
  } catch (error) {
    console.error('[/api/tickets/[id]]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
