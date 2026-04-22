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
      const templates = await query<any>(
        `SELECT r.*, c.name AS category_name, c.color AS category_color
         FROM fn_recurring_templates r
         LEFT JOIN fn_transaction_categories c ON r.category_id = c.id
         WHERE r.clerk_id = $1 AND r.is_active = TRUE
         ORDER BY r.next_due ASC`,
        [user.clerk_id]
      );
      return res.json(templates);
    }

    if (req.method === 'POST') {
      const { category_id, type, amount, description, frequency, start_date } = req.body || {};
      if (!type || !['income', 'expense'].includes(type))
        return res.status(400).json({ error: 'Valid type is required' });
      if (!amount || parseFloat(amount) <= 0)
        return res.status(400).json({ error: 'Amount must be positive' });
      if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency))
        return res.status(400).json({ error: 'Valid frequency is required' });
      if (!start_date) return res.status(400).json({ error: 'start_date is required' });

      const tpl = await queryOne<any>(
        `INSERT INTO fn_recurring_templates (clerk_id, category_id, type, amount, description, frequency, start_date, next_due)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *`,
        [user.clerk_id, category_id || null, type, parseFloat(amount), description || null, frequency, start_date]
      );
      return res.status(201).json(tpl);
    }

    if (req.method === 'PUT') {
      const { id, amount, description, frequency, is_active } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const updated = await queryOne<any>(
        `UPDATE fn_recurring_templates SET
           amount = COALESCE($1, amount),
           description = COALESCE($2, description),
           frequency = COALESCE($3, frequency),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
         WHERE id = $5 AND clerk_id = $6 RETURNING *`,
        [
          amount ? parseFloat(amount) : null,
          description ?? null,
          frequency ?? null,
          is_active !== undefined ? is_active : null,
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
      const updated = await queryOne<any>(
        `UPDATE fn_recurring_templates SET is_active = FALSE, updated_at = NOW()
         WHERE id = $1 AND clerk_id = $2 RETURNING id`,
        [id, user.clerk_id]
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/recurring]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
