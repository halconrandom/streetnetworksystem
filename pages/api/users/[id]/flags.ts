import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { queryOne, execute, query } from '@lib/db';
import { isAdmin, logAudit } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current user from Clerk session claims
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

    if (req.method === 'GET') {
      const flags = await query<{ flag: string }>(
        'SELECT flag FROM sn_user_flags WHERE user_id = $1',
        [id]
      );
      
      return res.status(200).json({ flags: flags.map(f => f.flag) });
    }

    if (req.method === 'PUT') {
      const { flags } = req.body;
      
      if (!Array.isArray(flags)) {
        return res.status(400).json({ error: 'Flags must be an array' });
      }

      // Verify target user exists
      const targetUser = await queryOne<any>(
        'SELECT id FROM sn_users WHERE id = $1',
        [id]
      );
      
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete existing flags
      await execute('DELETE FROM sn_user_flags WHERE user_id = $1', [id]);
      
      // Insert new flags
      for (const flag of flags) {
        await execute(
          'INSERT INTO sn_user_flags (user_id, flag, granted_by, created_at) VALUES ($1, $2, $3, NOW())',
          [id, flag, currentUser.id]
        );
      }

      // Log audit
      await logAudit(
        'admin.flags.update',
        currentUser.id,
        id,
        { flags },
        req.headers['x-forwarded-for'] as string,
        req.headers['user-agent']
      );

      return res.status(200).json({ success: true, flags });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/users/[id]/flags] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}