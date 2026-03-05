import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { query, queryOne } from '@lib/db';
import { isAdmin } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user email from Clerk session claims
    const clerkUser = (sessionClaims as any)?.__clerk_user || {};
    const email = clerkUser.email_addresses?.find(
      (e: any) => e.id === clerkUser.primary_email_address_id
    )?.email_address;

    if (!email) {
      return res.status(400).json({ error: 'No email found' });
    }

    // Get current user from DB
    const currentUser = await queryOne<any>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check admin
    const admin = await isAdmin(currentUser.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get stats
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
    console.error('[/api/admin/stats] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}