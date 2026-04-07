import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body ?? {};
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';

  if (!username || !password || username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }

  const secret = process.env.SESSION_SECRET || 'dev-secret-change-me';
  const token = crypto.createHmac('sha256', secret).update(username).digest('hex');

  const maxAge = 60 * 60 * 24 * 7; // 7 días
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `sn_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`
  );

  return res.status(200).json({ ok: true });
}
