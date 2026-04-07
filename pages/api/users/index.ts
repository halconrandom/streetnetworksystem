import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const search = (req.query.q as string)?.trim() || '';

    const params: any[] = [];
    let whereClause = '';

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause = 'WHERE LOWER(email) LIKE $1 OR LOWER(name) LIKE $1';
    }

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sn_users ${whereClause}`, params
    );
    const total = parseInt(countResult[0]?.count || '0');

    const users = await query<any>(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, u.is_verified,
              u.discord_username, u.discord_avatar, u.created_at, u.last_login_at,
              COALESCE(
                json_agg(f.flag) FILTER (WHERE f.flag IS NOT NULL), '[]'
              ) as flags
       FROM sn_users u
       LEFT JOIN sn_user_flags f ON f.user_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    return res.status(200).json({ rows: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('[/api/users]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
