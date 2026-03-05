import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { queryOne, execute } from '@lib/db';
import { isAdmin, logAudit } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Update ID required' });
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

    // Check if update exists
    const existingUpdate = await queryOne<any>(
      'SELECT * FROM sn_live_updates WHERE id = $1',
      [id]
    );

    if (!existingUpdate) {
      return res.status(404).json({ error: 'Update not found' });
    }

    // PUT - Update
    if (req.method === 'PUT') {
      const { type, message, description, date, is_active } = req.body;
      
      await execute(
        `UPDATE sn_live_updates 
         SET type = $1, message = $2, description = $3, date = $4, is_active = $5, updated_at = NOW()
         WHERE id = $6`,
        [type, message, description || null, date, is_active !== false, id]
      );

      await logAudit(
        'admin.live_update.update',
        currentUser.id,
        null,
        { id, type, message },
        req.headers['x-forwarded-for'] as string,
        req.headers['user-agent']
      );

      return res.status(200).json({ success: true });
    }

    // DELETE - Delete
    if (req.method === 'DELETE') {
      await execute('DELETE FROM sn_live_updates WHERE id = $1', [id]);

      await logAudit(
        'admin.live_update.delete',
        currentUser.id,
        null,
        { id },
        req.headers['x-forwarded-for'] as string,
        req.headers['user-agent']
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/admin/live-updates/[id]] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}