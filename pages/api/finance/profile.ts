import { NextApiRequest, NextApiResponse } from 'next';
import { query, execute, queryOne } from '@lib/db';
import { getOrCreateUserByClerkId, hasFlag } from '@lib/clerk-sync';
import { DEFAULT_CATEGORIES } from '@features/finance/types';

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
      const profile = await queryOne<any>(
        'SELECT * FROM fn_finance_profiles WHERE clerk_id = $1',
        [user.clerk_id]
      );
      if (!profile) return res.json({ exists: false });
      return res.json({ exists: true, ...profile });
    }

    if (req.method === 'POST') {
      const { currency, monthly_salary } = req.body || {};
      if (!currency || !['USD', 'COP'].includes(currency)) {
        return res.status(400).json({ error: 'Valid currency (USD or COP) is required' });
      }

      // Upsert profile
      const profile = await queryOne<any>(
        `INSERT INTO fn_finance_profiles (clerk_id, currency, monthly_salary, onboarding_completed)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (clerk_id) 
         DO UPDATE SET 
            currency = EXCLUDED.currency,
            monthly_salary = EXCLUDED.monthly_salary,
            onboarding_completed = TRUE,
            updated_at = NOW()
         RETURNING *`,
        [user.clerk_id, currency, parseFloat(monthly_salary) || 0]
      );

      // Seed default categories
      for (const cat of DEFAULT_CATEGORIES) {
        await execute(
          `INSERT INTO fn_transaction_categories (clerk_id, name, type, color, icon, is_default)
           SELECT $1, $2, $3, $4, $5, $6
           WHERE NOT EXISTS (
             SELECT 1 FROM fn_transaction_categories
             WHERE clerk_id = $1 AND name = $2 AND type = $3
           )
           ON CONFLICT DO NOTHING`,
          [user.clerk_id, cat.name, cat.type, cat.color, cat.icon || null, cat.is_default]
        );
      }

      return res.status(200).json({ exists: true, ...profile });
    }

    if (req.method === 'PUT') {
      const { monthly_salary } = req.body || {};
      if (monthly_salary === undefined) {
        return res.status(400).json({ error: 'monthly_salary is required' });
      }
      const updated = await queryOne<any>(
        `UPDATE fn_finance_profiles SET monthly_salary = $1, updated_at = NOW()
         WHERE clerk_id = $2 RETURNING *`,
        [parseFloat(monthly_salary), user.clerk_id]
      );
      if (!updated) return res.status(404).json({ error: 'Profile not found' });
      return res.json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/finance/profile]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
