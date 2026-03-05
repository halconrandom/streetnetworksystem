import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { queryOne, execute } from '@lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const user = await queryOne<any>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      // Get review channel
      return res.status(200).json({
        discord_review_channel_id: user.discord_review_channel_id || null,
      });
    }

    if (req.method === 'PUT') {
      // Update review channel
      const { discord_review_channel_id } = req.body;
      
      await execute(
        'UPDATE sn_users SET discord_review_channel_id = $1, updated_at = NOW() WHERE id = $2',
        [discord_review_channel_id || null, user.id]
      );

      return res.status(200).json({ 
        success: true,
        discord_review_channel_id: discord_review_channel_id || null,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/users/me/review-channel] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}