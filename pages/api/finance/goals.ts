import { NextApiRequest, NextApiResponse } from 'next';
import { query, execute, queryOne } from '@lib/db';
import { getOrCreateUserByClerkId, hasFlag } from '@lib/clerk-sync';

async function authGuard(req: NextApiRequest, res: NextApiResponse) {
  const user = await getOrCreateUserByClerkId(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  const allowed = await hasFlag(user.id, 'finance');
  if (!allowed) { res.status(403).json({ error: 'Missing flag: finance' }); return null; }
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await authGuard(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const goals = await query<any>(
        `SELECT g.*,
          COALESCE((SELECT SUM(c.amount) FROM fn_savings_contributions c WHERE c.goal_id = g.id), 0) AS current_amount
         FROM fn_savings_goals g
         WHERE g.clerk_id = $1
         ORDER BY g.is_completed ASC, g.created_at DESC`,
        [user.clerk_id]
      );
      return res.json(goals);
    }

    if (req.method === 'POST') {
      const { name, target_amount, deadline, notes } = req.body || {};
      if (!name || !target_amount || parseFloat(target_amount) <= 0)
        return res.status(400).json({ error: 'name and target_amount are required' });

      const goal = await queryOne<any>(
        `INSERT INTO fn_savings_goals (clerk_id, name, target_amount, deadline, notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user.clerk_id, name, parseFloat(target_amount), deadline || null, notes || null]
      );
      return res.status(201).json(goal);
    }

    if (req.method === 'PUT') {
      const { id, name, target_amount, deadline, notes, is_completed } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const updated = await queryOne<any>(
        `UPDATE fn_savings_goals SET
           name = COALESCE($1, name),
           target_amount = COALESCE($2, target_amount),
           deadline = COALESCE($3, deadline),
           notes = COALESCE($4, notes),
           is_completed = COALESCE($5, is_completed),
           updated_at = NOW()
         WHERE id = $6 AND clerk_id = $7 RETURNING *`,
        [
          name ?? null,
          target_amount ? parseFloat(target_amount) : null,
          deadline ?? null,
          notes ?? null,
          is_completed !== undefined ? is_completed : null,
          id,
          user.clerk_id,
        ]
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const deleted = await execute(
        'DELETE FROM fn_savings_goals WHERE id = $1 AND clerk_id = $2 RETURNING id',
        [id, user.clerk_id]
      );
      if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/goals]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
