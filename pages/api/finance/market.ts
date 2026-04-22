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
      const items = await query<any>(
        'SELECT * FROM fn_market_list WHERE clerk_id = $1 ORDER BY sort_order ASC, created_at ASC',
        [user.clerk_id]
      );
      return res.json(items);
    }

    if (req.method === 'POST') {
      const { name, quantity, estimated_price } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name is required' });

      const maxOrder = await queryOne<any>(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM fn_market_list WHERE clerk_id = $1',
        [user.clerk_id]
      );

      const item = await queryOne<any>(
        `INSERT INTO fn_market_list (clerk_id, name, quantity, estimated_price, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user.clerk_id, name, quantity || null, estimated_price ? parseFloat(estimated_price) : null, (parseInt(maxOrder?.max_order ?? 0) + 1)]
      );
      return res.status(201).json(item);
    }

    if (req.method === 'PUT') {
      const { id, name, quantity, estimated_price, is_checked } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const updated = await queryOne<any>(
        `UPDATE fn_market_list SET
           name = COALESCE($1, name),
           quantity = COALESCE($2, quantity),
           estimated_price = COALESCE($3, estimated_price),
           is_checked = COALESCE($4, is_checked),
           updated_at = NOW()
         WHERE id = $5 AND clerk_id = $6 RETURNING *`,
        [
          name ?? null,
          quantity ?? null,
          estimated_price !== undefined ? parseFloat(estimated_price) : null,
          is_checked !== undefined ? is_checked : null,
          id,
          user.clerk_id,
        ]
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const { id, checked } = req.query;

      // Bulk clear checked items
      if (checked === 'true') {
        await execute(
          'DELETE FROM fn_market_list WHERE clerk_id = $1 AND is_checked = TRUE',
          [user.clerk_id]
        );
        return res.json({ ok: true });
      }

      if (!id) return res.status(400).json({ error: 'id is required' });
      const deleted = await execute(
        'DELETE FROM fn_market_list WHERE id = $1 AND clerk_id = $2 RETURNING id',
        [id, user.clerk_id]
      );
      if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/market]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
