import { NextApiRequest, NextApiResponse } from 'next';
import { execute } from '@lib/db';
import { getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Load point ID required' });
  }

  try {
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // PUT - Update load point name
    if (req.method === 'PUT') {
      const { name } = req.body || {};
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await execute(
        `UPDATE sn_seditorLoadPoints
         SET name = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING id, name, image_data_url, state_data, created_at`,
        [name, id, currentUser.id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Load point not found' });
      }

      return res.json(result[0]);
    }

    // DELETE - Delete load point
    if (req.method === 'DELETE') {
      const result = await execute(
        `DELETE FROM sn_seditorLoadPoints WHERE id = $1 AND user_id = $2`,
        [id, currentUser.id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Load point not found' });
      }

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/screenshot-editor/load-points/[id]] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
