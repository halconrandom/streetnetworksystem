import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tickets = await query<any>(
      `SELECT
        id, ticket_number, category, status, created_at, closed_at,
        full_name, opened_by_name, claimed_by_name, closed_by_name,
        active_project_name, bug_reported, support_needed, inquiry_description, project_description
       FROM sn_tickets
       ORDER BY created_at DESC
       LIMIT 200`
    );

    return res.status(200).json(
      tickets.map((t) => ({
        ...t,
        created_at: t.created_at ? new Date(t.created_at).toISOString() : null,
        closed_at: t.closed_at ? new Date(t.closed_at).toISOString() : null,
      }))
    );
  } catch (error) {
    console.error('[/api/tickets]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
