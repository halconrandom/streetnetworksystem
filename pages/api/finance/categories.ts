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
      const cats = await query<any>(
        'SELECT * FROM fn_transaction_categories WHERE clerk_id = $1 ORDER BY type ASC, name ASC',
        [user.clerk_id]
      );
      return res.json(cats);
    }

    if (req.method === 'POST') {
      const { name, type, color, icon } = req.body || {};
      if (!name || !type || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'name and valid type are required' });
      }
      const cat = await queryOne<any>(
        `INSERT INTO fn_transaction_categories (clerk_id, name, type, color, icon, is_default)
         VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING *`,
        [user.clerk_id, name, type, color || '#64748b', icon || null]
      );
      return res.status(201).json(cat);
    }

    if (req.method === 'PUT') {
      const { id, name, color, icon } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const updated = await queryOne<any>(
        `UPDATE fn_transaction_categories SET name = COALESCE($1, name), color = COALESCE($2, color),
         icon = COALESCE($3, icon) WHERE id = $4 AND clerk_id = $5 RETURNING *`,
        [name || null, color || null, icon || null, id, user.clerk_id]
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const cat = await queryOne<any>(
        'SELECT is_default FROM fn_transaction_categories WHERE id = $1 AND clerk_id = $2',
        [id, user.clerk_id]
      );
      if (!cat) return res.status(404).json({ error: 'Not found' });
      if (cat.is_default) return res.status(400).json({ error: 'Cannot delete default categories' });
      await execute('DELETE FROM fn_transaction_categories WHERE id = $1 AND clerk_id = $2', [id, user.clerk_id]);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/categories]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
