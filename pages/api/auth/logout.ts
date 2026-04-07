import type { NextApiRequest, NextApiResponse } from 'next';
import { auth0Logout, isAuth0Enabled } from '@lib/auth0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (isAuth0Enabled()) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    return auth0Logout(req, res);
  }

  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();
  res.setHeader('Set-Cookie', 'sn_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  if (req.method === 'GET') {
    return res.redirect('/sign-in');
  }
  return res.status(200).json({ ok: true });
}
