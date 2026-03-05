import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get active live updates
    const updates = await query<any>(
      `SELECT id, type, message, description, date, is_active, created_at
       FROM sn_live_updates 
       WHERE is_active = true
       ORDER BY date DESC, created_at DESC
       LIMIT 20`
    );

    return res.status(200).json(updates);
  } catch (error) {
    console.error('[/api/live-updates] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}