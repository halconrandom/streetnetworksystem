import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@lib/db';
import { getOrCreateUserByClerkId, hasFlag } from '@lib/clerk-sync';

async function authGuard(req: NextApiRequest, res: NextApiResponse) {
  const user = await getOrCreateUserByClerkId(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  const allowed = await hasFlag(user.id, 'finance');
  if (!allowed) { res.status(403).json({ error: 'Missing flag: finance' }); return null; }
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authGuard(req, res);
    if (!user) return;

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Valid month and year are required' });
    }

    const [totals, byCategory, monthlyHistory, dailyBurn] = await Promise.all([
      // Totals for the selected month
      queryOne<any>(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
         FROM fn_transactions
         WHERE clerk_id = $1 AND EXTRACT(MONTH FROM date) = $2::int AND EXTRACT(YEAR FROM date) = $3::int`,
        [user.clerk_id, month, year]
      ),

      // Expenses by category for pie chart
      query<any>(
        `SELECT t.category_id, c.name, c.color,
          COALESCE(SUM(t.amount), 0) AS total
         FROM fn_transactions t
         LEFT JOIN fn_transaction_categories c ON t.category_id = c.id
         WHERE t.clerk_id = $1 AND t.type = 'expense'
           AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
         GROUP BY t.category_id, c.name, c.color
         ORDER BY total DESC`,
        [user.clerk_id, month, year]
      ),

      // Last 6 months for bar chart
      query<any>(
        `SELECT
          EXTRACT(MONTH FROM date)::int AS month,
          EXTRACT(YEAR FROM date)::int AS year,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
         FROM fn_transactions
         WHERE clerk_id = $1
           AND date >= (DATE_TRUNC('month', MAKE_DATE($3::int, $2::int, 1)) - INTERVAL '5 months')
           AND date < DATE_TRUNC('month', MAKE_DATE($3::int, $2::int, 1)) + INTERVAL '1 month'
         GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
         ORDER BY year ASC, month ASC`,
        [user.clerk_id, month, year]
      ),

      // Daily cumulative expenses for burn rate line chart
      query<any>(
        `SELECT
          date::text AS date,
          SUM(SUM(amount)) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_expense
         FROM fn_transactions
         WHERE clerk_id = $1 AND type = 'expense'
           AND EXTRACT(MONTH FROM date) = $2::int AND EXTRACT(YEAR FROM date) = $3::int
         GROUP BY date
         ORDER BY date ASC`,
        [user.clerk_id, month, year]
      ),
    ]);

    const totalIncome = parseFloat(totals?.total_income ?? '0') || 0;
    const totalExpenses = parseFloat(totals?.total_expenses ?? '0') || 0;
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    return res.json({
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_balance: netBalance,
      savings_rate: savingsRate,
      by_category: byCategory,
      monthly_history: monthlyHistory,
      daily_burn: dailyBurn,
    });
  } catch (error) {
    console.error('[/api/finance/overview]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
