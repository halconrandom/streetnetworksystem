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

    // GET - List clients
    if (req.method === 'GET') {
      const result = await query<any>(
        `SELECT * FROM sn_vault_clients ORDER BY full_name ASC`
      );
      return res.json(result);
    }

    // POST - Create client
    if (req.method === 'POST') {
      const { full_name, email: clientEmail, phone, tier, metadata, internal_notes } = req.body || {};
      if (!full_name) {
        return res.status(400).json({ error: 'Full name is required' });
      }

      const result = await execute(
        `INSERT INTO sn_vault_clients (full_name, email, phone, tier, metadata, internal_notes)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         RETURNING *`,
        [full_name, clientEmail || null, phone || null, tier || 'standard', metadata ? JSON.stringify(metadata) : '{}', internal_notes || null]
      );

      await logAudit('vault.client.create', user.id, null, { clientId: result[0]?.id, full_name }, req.headers['x-forwarded-for'] as string, req.headers['user-agent']);

      return res.status(201).json(result[0]);
    }

    // DELETE - Delete client
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Client ID required' });
      }

      const result = await execute(
        `DELETE FROM sn_vault_clients WHERE id = $1 RETURNING id`,
        [id]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      await logAudit('vault.client.delete', user.id, null, { clientId: id }, req.headers['x-forwarded-for'] as string, req.headers['user-agent']);

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[/api/vault/clients] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
