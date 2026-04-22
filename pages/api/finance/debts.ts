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
      const debts = await query<any>(
        `SELECT d.*,
          COALESCE((SELECT SUM(p.amount) FROM fn_debt_payments p WHERE p.debt_id = d.id), 0) AS total_paid
         FROM fn_debts d
         WHERE d.clerk_id = $1
         ORDER BY d.is_paid_off ASC, d.current_balance DESC`,
        [user.clerk_id]
      );
      return res.json(debts);
    }

    if (req.method === 'POST') {
      const { creditor_name, original_amount, current_balance, interest_rate, minimum_payment, due_day, notes } = req.body || {};
      if (!creditor_name || !original_amount || !current_balance)
        return res.status(400).json({ error: 'creditor_name, original_amount, and current_balance are required' });

      const debt = await queryOne<any>(
        `INSERT INTO fn_debts (clerk_id, creditor_name, original_amount, current_balance, interest_rate, minimum_payment, due_day, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          user.clerk_id,
          creditor_name,
          parseFloat(original_amount),
          parseFloat(current_balance),
          parseFloat(interest_rate ?? 0),
          minimum_payment ? parseFloat(minimum_payment) : null,
          due_day ? parseInt(due_day) : null,
          notes || null,
        ]
      );
      return res.status(201).json(debt);
    }

    if (req.method === 'PUT') {
      const { id, creditor_name, interest_rate, minimum_payment, due_day, notes } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const updated = await queryOne<any>(
        `UPDATE fn_debts SET
           creditor_name = COALESCE($1, creditor_name),
           interest_rate = COALESCE($2, interest_rate),
           minimum_payment = COALESCE($3, minimum_payment),
           due_day = COALESCE($4, due_day),
           notes = COALESCE($5, notes),
           updated_at = NOW()
         WHERE id = $6 AND clerk_id = $7 RETURNING *`,
        [
          creditor_name ?? null,
          interest_rate !== undefined ? parseFloat(interest_rate) : null,
          minimum_payment !== undefined ? parseFloat(minimum_payment) : null,
          due_day !== undefined ? parseInt(due_day) : null,
          notes ?? null,
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
        'DELETE FROM fn_debts WHERE id = $1 AND clerk_id = $2 RETURNING id',
        [id, user.clerk_id]
      );
      if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/debts]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
