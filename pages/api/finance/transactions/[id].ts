import { NextApiRequest, NextApiResponse } from 'next';
import { execute, queryOne } from '@lib/db';
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

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    if (req.method === 'PUT') {
      const { category_id, type, amount, description, date } = req.body || {};
      const updated = await queryOne<any>(
        `UPDATE fn_transactions SET
           category_id = COALESCE($1, category_id),
           type = COALESCE($2, type),
           amount = COALESCE($3, amount),
           description = COALESCE($4, description),
           date = COALESCE($5, date),
           updated_at = NOW()
         WHERE id = $6 AND clerk_id = $7 RETURNING *`,
        [
          category_id ?? null,
          type ?? null,
          amount ? parseFloat(amount) : null,
          description ?? null,
          date ?? null,
          id,
          user.clerk_id,
        ]
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await execute(
        'DELETE FROM fn_transactions WHERE id = $1 AND clerk_id = $2 RETURNING id',
        [id, user.clerk_id]
      );
      if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/transactions/[id]]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
