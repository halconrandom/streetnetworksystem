import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@lib/db';
import { isAdmin, logAudit, getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await isAdmin(currentUser.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.query;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const updateId = Number(id);

    // PUT - Update existing update
    if (req.method === 'PUT') {
      const { type, message, description, date, is_active } = req.body;
      
      if (!type || !message || !date) {
        return res.status(400).json({ error: 'Type, message, and date are required' });
      }

      const result = await queryOne<{ id: number }>(
        `UPDATE sn_live_updates 
         SET type = $1, message = $2, description = $3, date = $4, is_active = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING id`,
        [type, message, description || null, date, is_active !== false, updateId]
      );

      if (!result) {
        return res.status(404).json({ error: 'Update not found' });
      }

      await logAudit(
        'admin.live_update.update',
        currentUser.id,
        null,
        { id: updateId, type, message },
        req.headers['x-forwarded-for'] as string,
        req.headers['user-agent']
      );

      return res.status(200).json({ id: result.id, success: true });
    }

    // DELETE - Delete update
    if (req.method === 'DELETE') {
      const result = await queryOne<{ id: number }>(
        `DELETE FROM sn_live_updates WHERE id = $1 RETURNING id`,
        [updateId]
      );

      if (!result) {
        return res.status(404).json({ error: 'Update not found' });
      }

      await logAudit(
        'admin.live_update.delete',
        currentUser.id,
        null,
        { id: updateId },
        req.headers['x-forwarded-for'] as string,
        req.headers['user-agent']
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/admin/live-updates/[id]] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}