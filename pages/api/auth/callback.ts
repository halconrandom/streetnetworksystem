import type { NextApiRequest, NextApiResponse } from 'next';
import { auth0Callback, isAuth0Enabled } from '@lib/auth0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuth0Enabled()) {
    return res.status(503).json({ error: 'Auth0 no est\u00e1 configurado' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return auth0Callback(req, res);
}

