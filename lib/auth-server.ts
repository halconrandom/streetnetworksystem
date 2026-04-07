import crypto from 'crypto';
import type { NextApiRequest } from 'next';

/**
 * Verifica si la request tiene una sesión local válida (sn_session cookie).
 * Reemplaza getOrCreateUserByClerkId + isAdmin del sistema original.
 */
export function isAuthenticated(req: NextApiRequest): boolean {
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
