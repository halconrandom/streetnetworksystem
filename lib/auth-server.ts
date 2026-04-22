import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { queryOne } from '@lib/db';

/**
 * Verifica si la request tiene una sesión local válida (sn_session cookie).
 * Reemplaza getOrCreateUserByClerkId + isAdmin del sistema original.
 */
export function isAuthenticated(req: NextApiRequest): boolean {
  try {
    const { userId } = getAuth(req);
    if (userId) return true;
  } catch {
    // Continue with fallback legacy session auth.
  }

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

  let clerkUserId: string | null = null;
  let clerkEmail: string | null = null;

  try {
    const auth = getAuth(req);
    clerkUserId = auth.userId ?? null;
    const claims = auth.sessionClaims as Record<string, any> | null | undefined;
    clerkEmail = claims?.email || claims?.email_address || null;
  } catch {
    // Legacy session fallback path
  }

  if (clerkUserId) {
    const byClerkId = await queryOne<{ id: string; name: string | null; email: string }>(
      'SELECT id, name, email FROM sn_users WHERE clerk_id = $1 LIMIT 1',
      [clerkUserId]
    );
    if (byClerkId) return byClerkId;

    // Email not in session claims — fetch it directly from Clerk API
    if (!clerkEmail) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkUserId);
        clerkEmail = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      } catch {
        // Clerk API unavailable, continue without email
      }
    }
  }

  if (clerkEmail) {
    const byEmail = await queryOne<{ id: string; name: string | null; email: string }>(
      'SELECT id, name, email FROM sn_users WHERE email = $1 LIMIT 1',
      [clerkEmail]
    );
    if (byEmail) {
      if (clerkUserId) {
        await queryOne('UPDATE sn_users SET clerk_id = $1 WHERE id = $2', [clerkUserId, byEmail.id]);
      }
      return byEmail;
    }
  }

  // Fallback during migration: use first admin row in DB.
  // Never return synthetic IDs (user_id columns are UUID).
  return queryOne<{ id: string; name: string | null; email: string }>(
    `SELECT id, name, email FROM sn_users WHERE role = 'admin' LIMIT 1`
  );
}
