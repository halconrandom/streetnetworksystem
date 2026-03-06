import { NextApiRequest, NextApiResponse } from 'next';
import { query, execute } from '@lib/db';
import { hasFlag, logAudit, getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getOrCreateUserByClerkId(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasVault = await hasFlag(user.id, 'vault');
    if (!hasVault) {
      return res.status(403).json({ error: 'Missing required permission: vault' });
    }

    // GET - List assets
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT a.*, u.email as owner_email
         FROM sn_vault_assets a
         LEFT JOIN sn_users u ON u.id = a.owner_id
         ORDER BY a.name ASC`
      );
      return res.json(result);
    }

    // POST - Create asset
    if (req.method === 'POST') {
      const { name, kind, identifier, owner_id, status, metadata } = req.body || {};
      if (!name || !kind) {
        return res.status(400).json({ error: 'Name and kind are required' });
      }

      const result = await execute(
        `INSERT INTO sn_vault_assets (name, kind, identifier, owner_id, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING *`,
        [name, kind, identifier || null, owner_id || null, status || 'active', metadata ? JSON.stringify(metadata) : '{}']
      );

      await logAudit('vault.asset.create', user.id, null, { assetId: result[0]?.id, name }, req.headers['x-forwarded-for'] as string, req.headers['user-agent']);

      return res.status(201).json(result[0]);
    }

    // DELETE - Delete asset
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Asset ID required' });
      }

      const result = await execute(
        `DELETE FROM sn_vault_assets WHERE id = $1 RETURNING id`,
        [id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      await logAudit('vault.asset.delete', user.id, null, { assetId: id }, req.headers['x-forwarded-for'] as string, req.headers['user-agent']);

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/vault/assets] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
