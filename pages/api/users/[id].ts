import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, execute } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'User ID required' });

  try {
    if (req.method === 'GET') {
      const user = await queryOne<any>(
        'SELECT id, email, name, role, is_active, is_verified, created_at, updated_at, last_login_at FROM sn_users WHERE id = $1',
        [id]
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(user);
    }

    if (req.method === 'PATCH') {
      const { role, is_active, is_verified } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (role !== undefined)        { updates.push(`role = $${i++}`);        values.push(role); }
      if (is_active !== undefined)   { updates.push(`is_active = $${i++}`);   values.push(is_active); }
      if (is_verified !== undefined) { updates.push(`is_verified = $${i++}`); values.push(is_verified); }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(id);
        await execute(`UPDATE sn_users SET ${updates.join(', ')} WHERE id = $${i}`, values);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/users/[id]]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
