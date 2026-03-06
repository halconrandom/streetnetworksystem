import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { isAdmin, getUserFlags, getOrCreateUserByClerkId } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await isAdmin(currentUser.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 15;
    const offset = (page - 1) * pageSize;
    const search = (req.query.q as string)?.trim() || '';

    // Build query
    let whereClause = '';
    const params: any[] = [];
    
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause = 'WHERE LOWER(email) LIKE $1 OR LOWER(name) LIKE $1';
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sn_users ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    // Get users with flags
    const users = await query<any>(
      `SELECT id, email, name, role, is_active, is_verified, created_at, updated_at, last_login_at
       FROM sn_users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    // Get flags for each user
    const usersWithFlags = await Promise.all(
      users.map(async (user) => {
        const flags = await getUserFlags(user.id);
        return { ...user, flags };
      })
    );

    return res.status(200).json({
      rows: usersWithFlags,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[/api/users] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}