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
        avatarUrl: user.avatar_url || null,
        discordId: user.discord_id || null,
        discordUsername: user.discord_username || null,
        discordAvatar: user.discord_avatar || null,
        discord_review_channel_id: user.discord_review_channel_id || null,
      });
    }

    if (req.method === 'PUT') {
      // Update user fields
      const { discord_review_channel_id, avatar_url } = req.body;
      
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (discord_review_channel_id !== undefined) {
        updates.push(`discord_review_channel_id = ${paramIndex++}`);
        values.push(discord_review_channel_id || null);
      }

      if (avatar_url !== undefined) {
        updates.push(`avatar_url = ${paramIndex++}`);
        values.push(avatar_url || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(user.id);

      await execute(
        `UPDATE sn_users SET ${updates.join(', ')} WHERE id = ${paramIndex}`,
        values
      );

      return res.status(200).json({ 
        success: true,
        discord_review_channel_id: discord_review_channel_id ?? null,
        avatar_url: avatar_url ?? null,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/users/me/review-channel] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}