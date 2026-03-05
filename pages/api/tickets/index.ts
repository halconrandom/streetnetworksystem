import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { query, queryOne } from '@lib/db';

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

    // Get tickets
    const tickets = await query<any>(
      `SELECT 
        id, ticket_number, category, status, created_at, closed_at,
        full_name, opened_by_name, active_project_name, 
        bug_reported, support_needed, inquiry_description, project_description
       FROM sn_tickets 
       ORDER BY created_at DESC 
       LIMIT 100`
    );

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('[/api/tickets] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}