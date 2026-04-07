import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [usersCount, activeMembers, ticketsCount, openTickets] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM sn_users'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM sn_users WHERE is_active = true'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM sn_tickets'),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM sn_tickets WHERE status != 'closed'"),
    ]);

    return res.status(200).json({
      totalUsers: parseInt(usersCount?.count || '0'),
      activeMembers: parseInt(activeMembers?.count || '0'),
      totalTickets: parseInt(ticketsCount?.count || '0'),
      openTickets: parseInt(openTickets?.count || '0'),
    });
  } catch (error) {
    console.error('[/api/admin/stats]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
