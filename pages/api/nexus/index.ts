import { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, execute } from '@lib/db';
import { hasFlag, getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasNexus = await hasFlag(currentUser.id, 'nexus');
    if (!hasNexus) {
      return res.status(403).json({ error: 'Missing required permission: nexus' });
    }

    // GET - Fetch nexus state
    if (req.method === 'GET') {
      const result = await queryOne<any>(
        `SELECT data FROM sn_nexus_states WHERE user_id = $1 LIMIT 1`,
        [currentUser.id]
      );
      return res.json(result?.data || { nodes: [], connections: [], camera: { x: 0, y: 0, zoom: 1 } });
    }

    // POST - Save nexus state
    if (req.method === 'POST') {
      const data = req.body || {};
      if (!data.nodes) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      await execute(
        `INSERT INTO sn_nexus_states (user_id, data)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
        [currentUser.id, JSON.stringify(data)]
      );

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/nexus] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
