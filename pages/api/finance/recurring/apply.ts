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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authGuard(req, res);
    if (!user) return;

    const { template_ids, apply_date } = req.body || {};
    if (!Array.isArray(template_ids) || template_ids.length === 0) {
      return res.status(400).json({ error: 'template_ids array is required' });
    }
    if (!apply_date) return res.status(400).json({ error: 'apply_date is required' });

    const applied: any[] = [];

    for (const templateId of template_ids) {
      const tpl = await queryOne<any>(
        'SELECT * FROM fn_recurring_templates WHERE id = $1 AND clerk_id = $2 AND is_active = TRUE',
        [templateId, user.clerk_id]
      );
      if (!tpl) continue;

      // Insert transaction
      const txn = await queryOne<any>(
        `INSERT INTO fn_transactions (clerk_id, category_id, type, amount, description, date, is_recurring, recurring_id)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7) RETURNING *`,
        [user.clerk_id, tpl.category_id, tpl.type, tpl.amount, tpl.description, apply_date, tpl.id]
      );

      // Advance next_due based on frequency
      await execute(
        `UPDATE fn_recurring_templates SET
           next_due = CASE
             WHEN frequency = 'daily'   THEN next_due + INTERVAL '1 day'
             WHEN frequency = 'weekly'  THEN next_due + INTERVAL '7 days'
             WHEN frequency = 'monthly' THEN next_due + INTERVAL '1 month'
           END,
           updated_at = NOW()
         WHERE id = $1 AND clerk_id = $2`,
        [tpl.id, user.clerk_id]
      );

      applied.push(txn);
    }

    return res.json({ applied: applied.length, transactions: applied });
  } catch (error) {
    console.error('[/api/finance/recurring/apply]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
