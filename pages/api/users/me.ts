import { NextApiRequest, NextApiResponse } from 'next';
import { execute } from '@lib/db';
import { getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getOrCreateUserByClerkId(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Return full DB-side user profile (extensible for future fields)
      return res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name || null,
        role: user.role,
        is_active: user.is_active,
        discordId: user.discord_id || null,
        discordUsername: user.discord_username || null,
        discordAvatar: user.discord_avatar || null,
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