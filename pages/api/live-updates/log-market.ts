import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, message, description } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    await query(
      `INSERT INTO sn_live_updates (type, message, description, date, is_active)
       VALUES ($1, $2, $3, NOW(), true)`,
      [type || 'market', message, description || '']
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[/api/live-updates/log-market] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
