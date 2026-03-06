import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@lib/db';
import { getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentUser = await getOrCreateUserByClerkId(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const channels = await query<any>(
        `SELECT id, name, channel_id, created_at FROM sn_review_channels WHERE user_id = $1 ORDER BY created_at DESC`,
        [currentUser.id]
      );
      return res.json({ channels });
    } catch (err) {
      console.error('[REVIEW_CHANNELS] DB error:', err);
      return res.status(500).json({ error: 'Error al obtener canales' });
    }
  }

  if (req.method === 'POST') {
    const { name, channelId } = req.body || {};
    
    if (!name || !channelId) {
      return res.status(400).json({ error: 'Nombre y Channel ID son requeridos' });
    }

    // Validate channelId is a valid Discord snowflake (numeric string)
    if (!/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({ error: 'Channel ID debe ser un ID válido de Discord (17-20 dígitos)' });
    }

    try {
      const result = await queryOne<any>(
        `INSERT INTO sn_review_channels (user_id, name, channel_id) VALUES ($1, $2, $3) RETURNING id, name, channel_id, created_at`,
        [currentUser.id, name.trim(), channelId.trim()]
      );
      return res.status(201).json({ channel: result });
    } catch (err) {
      console.error('[REVIEW_CHANNELS] DB error:', err);
      return res.status(500).json({ error: 'Error al crear canal' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
