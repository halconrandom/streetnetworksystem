import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, execute } from '@lib/db';
import { isAuthenticated, getAdminUsername } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  const adminUser = getAdminUsername();

  try {
    if (req.method === 'GET') {
      const result = await queryOne<any>(
        `SELECT data FROM sn_nexus_states WHERE user_id = $1 LIMIT 1`,
        [adminUser]
      );
      return res.json(result?.data || { nodes: [], connections: [], camera: { x: 0, y: 0, zoom: 1 } });
    }

    if (req.method === 'POST') {
      const data = req.body || {};
      if (!data.nodes) return res.status(400).json({ error: 'Invalid data format' });

      await execute(
        `INSERT INTO sn_nexus_states (user_id, data)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
        [adminUser, JSON.stringify(data)]
      );
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/nexus]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
