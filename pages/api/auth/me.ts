import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['sn_session'];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const secret = process.env.SESSION_SECRET || 'dev-secret-change-me';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const expected = crypto.createHmac('sha256', secret).update(username).digest('hex');

  if (token !== expected) return res.status(401).json({ error: 'Invalid session' });

  return res.status(200).json({ username, role: 'admin' });
}
