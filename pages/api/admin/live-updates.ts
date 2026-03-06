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

    // GET - List all updates (including inactive)
    if (req.method === 'GET') {
      const updates = await query<any>(
        `SELECT id, type, message, description, date, is_active, created_at, updated_at
         FROM sn_live_updates 
         ORDER BY created_at DESC`
      );
      return res.status(200).json(updates);
    }

    // POST - Create new update
    if (req.method === 'POST') {
      const { type, message, description, date, is_active } = req.body;
      
      if (!type || !message || !date) {
        return res.status(400).json({ error: 'Type, message, and date are required' });
      }

      const result = await queryOne<{ id: number }>(
        `INSERT INTO sn_live_updates (type, message, description, date, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [type, message, description || null, date, is_active !== false]
      );

      await logAudit(
        'admin.live_update.create',
        currentUser.id,
        null,
        { id: result?.id, type, message },
        req.headers['x-forwarded-for'] as string,
        req.headers['user-agent']
      );

      return res.status(201).json({ id: result?.id, success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/admin/live-updates] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}