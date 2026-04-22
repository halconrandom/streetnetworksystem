import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFlags, getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getOrCreateUserByClerkId(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'User disabled' });
    }

    // Admins get all flags — avoids needing manual DB inserts per admin user
    const ALL_FLAGS = [
      'dashboard', 'transcripts', 'message_builder', 'screenshot_editor',
      'nexus', 'users', 'audit_logs', 'vault',
      'review_channels', 'comic_maker', 'cache_drafts', 'premium_access',
      'finance',
    ];
    const flags = user.role === 'admin' ? ALL_FLAGS : await getUserFlags(user.id);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified,
      avatarUrl: user.avatar_url,
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
