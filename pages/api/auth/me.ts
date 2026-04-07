import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const claims = auth.sessionClaims as Record<string, any> | null | undefined;
  const email = claims?.email || claims?.email_address || null;
  const username = claims?.username || claims?.name || email || auth.userId;

  return res.status(200).json({
    username,
    role: 'admin',
    email,
    sub: auth.userId,
  });
}
