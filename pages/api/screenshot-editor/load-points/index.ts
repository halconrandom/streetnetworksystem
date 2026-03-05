import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { query, queryOne, execute } from '@lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clerkUser = (sessionClaims as any)?.__clerk_user || {};
    const email = clerkUser.email_addresses?.find(
      (e: any) => e.id === clerkUser.primary_email_address_id
    )?.email_address;

    if (!email) {
      return res.status(400).json({ error: 'No email found' });
    }

    const currentUser = await queryOne<any>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // GET - List load points
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT id, name, image_data_url, state_data, created_at
         FROM sn_seditorLoadPoints
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [currentUser.id]
      );
      return res.json({ rows: result });
    }

    // POST - Create load point
    if (req.method === 'POST') {
      const { name, imageDataUrl, stateData } = req.body || {};
      if (!name || !imageDataUrl || !stateData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check count limit (20 per user)
      const countResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM sn_seditorLoadPoints WHERE user_id = $1`,
        [currentUser.id]
      );

      if (countResult && countResult.count >= 20) {
        // Delete oldest
        await execute(
          `DELETE FROM sn_seditorLoadPoints
           WHERE id IN (
             SELECT id FROM sn_seditorLoadPoints
             WHERE user_id = $1
             ORDER BY created_at ASC
             LIMIT 1
           )`,
          [currentUser.id]
        );
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
