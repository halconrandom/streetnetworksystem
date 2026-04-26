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
      const { month, year, type, category_id } = req.query;
      if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

      let sql = `SELECT t.*, c.name AS category_name, c.color AS category_color
                 FROM fn_transactions t
                 LEFT JOIN fn_transaction_categories c ON t.category_id = c.id
                 WHERE t.clerk_id = $1
                   AND EXTRACT(MONTH FROM t.date) = $2::int
                   AND EXTRACT(YEAR FROM t.date) = $3::int`;
      const params: any[] = [user.clerk_id, parseInt(month as string), parseInt(year as string)];

      if (type && ['income', 'expense'].includes(type as string)) {
        params.push(type);
        sql += ` AND t.type = $${params.length}`;
      }
      if (category_id) {
        params.push(category_id);
        sql += ` AND t.category_id = $${params.length}`;
      }

      sql += ' ORDER BY t.date DESC, t.created_at DESC';
      const txns = await query<any>(sql, params);
      return res.json(txns);
    }

    if (req.method === 'POST') {
      const { category_id, type, amount, description, date, is_recurring, recurring_id } = req.body || {};
      if (!type || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Valid type (income or expense) is required' });
      }
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }
      if (!date) return res.status(400).json({ error: 'date is required' });

      const txn = await queryOne<any>(
        `INSERT INTO fn_transactions (clerk_id, category_id, type, amount, description, date, is_recurring, recurring_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          user.clerk_id,
          category_id || null,
          type,
          parseFloat(amount),
          description || null,
          date,
          is_recurring || false,
          recurring_id || null,
        ]
      );
      return res.status(201).json(txn);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/transactions]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
