import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '@lib/db';
import { getAuth0SessionUser } from './auth0';

/**
 * Verifica si la request tiene una sesión local válida (sn_session cookie).
 * Reemplaza getOrCreateUserByClerkId + isAdmin del sistema original.
 */
export function isAuthenticated(req: NextApiRequest): boolean {
  const hasAuth0Cookie = Object.keys(req.cookies || {}).some((name) => name.startsWith('appSession'));
  if (hasAuth0Cookie) return true;

  const token = req.cookies['sn_session'];
  if (!token) return false;

  const secret = process.env.SESSION_SECRET || 'dev-secret-change-me';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const expected = crypto.createHmac('sha256', secret).update(username).digest('hex');

  return token === expected;
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || 'admin';
}

export async function getAuthenticatedAdminUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ id: string; name: string | null; email: string } | null> {
  if (!isAuthenticated(req)) return null;

  const auth0User = await getAuth0SessionUser(req, res);
  if (auth0User?.email) {
    const byEmail = await queryOne<{ id: string; name: string | null; email: string }>(
      'SELECT id, name, email FROM sn_users WHERE email = $1 LIMIT 1',
      [auth0User.email]
    );
    if (byEmail) return byEmail;
  }

  // Temporary fallback during migration: use first admin row in DB.
  // No synthetic fallback is allowed because user_id columns are UUID.
  return queryOne<{ id: string; name: string | null; email: string }>(
    `SELECT id, name, email FROM sn_users WHERE role = 'admin' LIMIT 1`
  );
}
