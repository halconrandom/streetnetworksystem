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
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

      const budgets = await query<any>(
        `SELECT b.*, c.name AS category_name, c.color AS category_color,
          COALESCE((
            SELECT SUM(t.amount) FROM fn_transactions t
            WHERE t.clerk_id = b.clerk_id AND t.category_id = b.category_id
              AND t.type = 'expense'
              AND EXTRACT(MONTH FROM t.date) = b.month
              AND EXTRACT(YEAR FROM t.date) = b.year
          ), 0) AS spent_amount
         FROM fn_budgets b
         JOIN fn_transaction_categories c ON b.category_id = c.id
         WHERE b.clerk_id = $1 AND b.month = $2 AND b.year = $3
         ORDER BY c.name ASC`,
        [user.clerk_id, parseInt(month as string), parseInt(year as string)]
      );
      return res.json(budgets);
    }

    if (req.method === 'POST') {
      const { category_id, month, year, limit_amount, alert_threshold } = req.body || {};
      if (!category_id || !month || !year || !limit_amount)
        return res.status(400).json({ error: 'category_id, month, year, and limit_amount are required' });

      const budget = await queryOne<any>(
        `INSERT INTO fn_budgets (clerk_id, category_id, month, year, limit_amount, alert_threshold)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (clerk_id, category_id, month, year)
         DO UPDATE SET limit_amount = $5, alert_threshold = $6, updated_at = NOW()
         RETURNING *`,
        [user.clerk_id, category_id, parseInt(month), parseInt(year), parseFloat(limit_amount), parseFloat(alert_threshold ?? 80)]
      );
      return res.status(201).json(budget);
    }

    if (req.method === 'PUT') {
      const { id, limit_amount, alert_threshold } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const updated = await queryOne<any>(
        `UPDATE fn_budgets SET
           limit_amount = COALESCE($1, limit_amount),
           alert_threshold = COALESCE($2, alert_threshold),
           updated_at = NOW()
         WHERE id = $3 AND clerk_id = $4 RETURNING *`,
        [limit_amount ? parseFloat(limit_amount) : null, alert_threshold ? parseFloat(alert_threshold) : null, id, user.clerk_id]
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const deleted = await execute(
        'DELETE FROM fn_budgets WHERE id = $1 AND clerk_id = $2 RETURNING id',
        [id, user.clerk_id]
      );
      if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/budgets]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
