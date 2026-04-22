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

    const { id: debtId } = req.query;
    if (!debtId) return res.status(400).json({ error: 'Debt id is required' });

    const debt = await queryOne<any>(
      'SELECT id, current_balance FROM fn_debts WHERE id = $1 AND clerk_id = $2',
      [debtId, user.clerk_id]
    );
    if (!debt) return res.status(404).json({ error: 'Debt not found' });

    if (req.method === 'GET') {
      const payments = await query<any>(
        'SELECT * FROM fn_debt_payments WHERE debt_id = $1 ORDER BY payment_date DESC',
        [debtId]
      );
      return res.json(payments);
    }

    if (req.method === 'POST') {
      const { amount, payment_date, note } = req.body || {};
      if (!amount || parseFloat(amount) <= 0)
        return res.status(400).json({ error: 'Amount must be positive' });
      if (!payment_date) return res.status(400).json({ error: 'payment_date is required' });

      const payment = await queryOne<any>(
        `INSERT INTO fn_debt_payments (debt_id, clerk_id, amount, payment_date, note)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [debtId, user.clerk_id, parseFloat(amount), payment_date, note || null]
      );

      // Reduce current_balance, cap at 0
      const newBalance = Math.max(0, parseFloat(debt.current_balance) - parseFloat(amount));
      await execute(
        `UPDATE fn_debts SET current_balance = $1, is_paid_off = $2, updated_at = NOW() WHERE id = $3`,
        [newBalance, newBalance === 0, debtId]
      );

      return res.status(201).json(payment);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/debts/[id]/payments]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
