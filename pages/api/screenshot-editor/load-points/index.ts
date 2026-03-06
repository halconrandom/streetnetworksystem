import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne, execute } from '@lib/db';
import { getOrCreateUserByClerkId } from '@lib/clerk-sync';

const CACHE_LIMIT = 20;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has premium_access flag
    const flagsResult = await query<{ flag: string }>(
      'SELECT flag FROM sn_user_flags WHERE user_id = $1',
      [currentUser.id]
    );
    const userFlags = flagsResult.map(f => f.flag);
    const hasPremiumAccess = userFlags.includes('premium_access');

    // GET - List load points
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, name, image_data_url, state_data, created_at
         FROM sn_seditorLoadPoints
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [currentUser.id]
      );

      const countResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM sn_seditorLoadPoints WHERE user_id = $1`,
        [currentUser.id]
      );

      return res.json({
        rows: result,
        limit: hasPremiumAccess ? null : CACHE_LIMIT,
        count: countResult?.count || 0,
        hasPremiumAccess
      });
    }

    // POST - Create load point
    if (req.method === 'POST') {
      const { name, imageDataUrl, stateData } = req.body || {};
      if (!name || !imageDataUrl || !stateData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check count limit
      const countResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM sn_seditorLoadPoints WHERE user_id = $1`,
        [currentUser.id]
      );

      const currentCount = countResult?.count || 0;

      // If user doesn't have premium_access and has reached the limit, reject
      if (!hasPremiumAccess && currentCount >= CACHE_LIMIT) {
        return res.status(403).json({
          error: 'Cache limit reached',
          message: `Has alcanzado el límite de ${CACHE_LIMIT} caches. Contacta a un administrador para obtener Premium Access.`,
          limit: CACHE_LIMIT,
          currentCount
        });
      }

      const result = await execute(
        `INSERT INTO sn_seditorLoadPoints (user_id, name, image_data_url, state_data)
         VALUES ($1, $2, $3, $4::jsonb)
         RETURNING id, name, image_data_url, state_data, created_at`,
        [currentUser.id, name, imageDataUrl, JSON.stringify(stateData)]
      );

      return res.json(result[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/screenshot-editor/load-points] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
