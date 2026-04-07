import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne, execute } from '@lib/db';
import { getAuthenticatedAdminUser } from '@lib/auth-server';

const CACHE_LIMIT = 20;

// Increase body size limit for large screenshot images (base64)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthenticatedAdminUser(req, res);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin always has premium access
    const hasPremiumAccess = true;

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
