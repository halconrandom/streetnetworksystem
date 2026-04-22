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

    const { id: goalId } = req.query;
    if (!goalId) return res.status(400).json({ error: 'Goal id is required' });

    // Verify goal belongs to user
    const goal = await queryOne<any>(
      'SELECT id, target_amount FROM fn_savings_goals WHERE id = $1 AND clerk_id = $2',
      [goalId, user.clerk_id]
    );
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (req.method === 'GET') {
      const contributions = await query<any>(
        'SELECT * FROM fn_savings_contributions WHERE goal_id = $1 ORDER BY contributed_at DESC',
        [goalId]
      );
      return res.json(contributions);
    }

    if (req.method === 'POST') {
      const { amount, note, contributed_at } = req.body || {};
      if (!amount || parseFloat(amount) <= 0)
        return res.status(400).json({ error: 'Amount must be positive' });

      const contribution = await queryOne<any>(
        `INSERT INTO fn_savings_contributions (goal_id, clerk_id, amount, note, contributed_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [goalId, user.clerk_id, parseFloat(amount), note || null, contributed_at || new Date().toISOString().split('T')[0]]
      );

      // Check if goal is now completed
      const totalResult = await queryOne<any>(
        'SELECT COALESCE(SUM(amount), 0) AS total FROM fn_savings_contributions WHERE goal_id = $1',
        [goalId]
      );
      const total = parseFloat(totalResult?.total ?? 0);
      if (total >= goal.target_amount) {
        await execute(
          'UPDATE fn_savings_goals SET is_completed = TRUE, updated_at = NOW() WHERE id = $1',
          [goalId]
        );
      }

      return res.status(201).json(contribution);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/goals/[id]/contributions]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
