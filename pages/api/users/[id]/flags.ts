import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, execute, query } from '@lib/db';
import { isAuthenticated, getAdminUsername } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'User ID required' });

  try {
    if (req.method === 'GET') {
      const flags = await query<{ flag: string }>('SELECT flag FROM sn_user_flags WHERE user_id = $1', [id]);
      return res.status(200).json({ flags: flags.map((f) => f.flag) });
    }

    if (req.method === 'PUT') {
      const { flags } = req.body;
      if (!Array.isArray(flags)) return res.status(400).json({ error: 'Flags must be an array' });

      const target = await queryOne<any>('SELECT id FROM sn_users WHERE id = $1', [id]);
      if (!target) return res.status(404).json({ error: 'User not found' });

      await execute('DELETE FROM sn_user_flags WHERE user_id = $1', [id]);
      for (const flag of flags) {
        await execute(
          'INSERT INTO sn_user_flags (user_id, flag, granted_by, created_at) VALUES ($1, $2, $3, NOW())',
          [id, flag, getAdminUsername()]
        );
      }
      return res.status(200).json({ success: true, flags });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/users/[id]/flags]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
