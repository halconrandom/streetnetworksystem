import { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@lib/db';
import { getAuthenticatedAdminUser } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentUser = await getAuthenticatedAdminUser(req, res);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID requerido' });
  }

  if (req.method === 'PUT') {
    const { name, channelId } = req.body || {};

    if (!name && !channelId) {
      return res.status(400).json({ error: 'Nombre o Channel ID requerido' });
    }

    // Validate channelId if provided
    if (channelId && !/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({ error: 'Channel ID debe ser un ID válido de Discord (17-20 dígitos)' });
    }

    try {
      // Verify ownership
      const existing = await queryOne<any>(
        `SELECT id FROM sn_review_channels WHERE id = $1 AND user_id = $2`,
        [id, currentUser.id]
      );

      if (!existing) {
        return res.status(404).json({ error: 'Canal no encontrado' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name.trim());
      }
      if (channelId) {
        updates.push(`channel_id = $${paramIndex++}`);
        values.push(channelId.trim());
      }

      values.push(id, currentUser.id);

      const result = await queryOne<any>(
        `UPDATE sn_review_channels SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING id, name, channel_id, created_at`,
        values
      );

      return res.json({ channel: result });
    } catch (err) {
      console.error('[REVIEW_CHANNELS] DB error:', err);
      return res.status(500).json({ error: 'Error al actualizar canal' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await queryOne<any>(
        `DELETE FROM sn_review_channels WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, currentUser.id]
      );

      if (!result) {
        return res.status(404).json({ error: 'Canal no encontrado' });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('[REVIEW_CHANNELS] DB error:', err);
      return res.status(500).json({ error: 'Error al eliminar canal' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
