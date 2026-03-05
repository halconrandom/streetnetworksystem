import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { queryOne, query } from '@lib/db';
import { getUserFlags, logAudit } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, sessionClaims } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from Clerk session claims
    const clerkUser = (sessionClaims as any)?.__clerk_user || {};
    const email = clerkUser.email_addresses?.find(
      (e: any) => e.id === clerkUser.primary_email_address_id
    )?.email_address || 
      clerkUser.email_addresses?.[0]?.email_address;

    if (!email) {
      return res.status(400).json({ error: 'No email found' });
    }

    // Find or create user in DB
    let user = await queryOne<any>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      // Create new user
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO sn_users (id, email, role, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, 'user', true, true, NOW(), NOW())`,
        [id, email.toLowerCase()]
      );
      
      user = await queryOne<any>(
        'SELECT * FROM sn_users WHERE id = $1',
        [id]
      );
    }

    // Get user flags
    const flags = await getUserFlags(user.id);

    // Log login
    await logAudit(
      'auth.login',
      user.id,
      null,
      { method: 'clerk' },
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      req.headers['user-agent']
    );

    // Update last login
    await query(
      'UPDATE sn_users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified,
      discordId: user.discord_id,
      discordUsername: user.discord_username,
      discordAvatar: user.discord_avatar,
      discord_review_channel_id: user.discord_review_channel_id,
      flags,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    });
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
