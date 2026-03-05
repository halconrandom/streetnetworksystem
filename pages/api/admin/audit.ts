import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { query, queryOne } from '@lib/db';
import { isAdmin } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user email from Clerk session claims
    const clerkUser = (sessionClaims as any)?.__clerk_user || {};
    const email = clerkUser.email_addresses?.find(
      (e: any) => e.id === clerkUser.primary_email_address_id
    )?.email_address;

    if (!email) {
      return res.status(400).json({ error: 'No email found' });
    }

    // Get current user from DB
    const currentUser = await queryOne<any>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check admin
    const admin = await isAdmin(currentUser.id);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 25;
    const offset = (page - 1) * pageSize;

    // Filters
    const { action, actorId, targetId, dateStart, dateEnd, search } = req.query;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      conditions.push(`al.action LIKE $${paramIndex++}`);
      params.push(`%${action}%`);
    }
    if (actorId) {
      conditions.push(`al.actor_user_id = $${paramIndex++}`);
      params.push(actorId);
    }
    if (targetId) {
      conditions.push(`al.target_user_id = $${paramIndex++}`);
      params.push(targetId);
    }
    if (dateStart) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(dateStart);
    }
    if (dateEnd) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(dateEnd);
    }
    if (search) {
      conditions.push(`(al.ip LIKE $${paramIndex} OR al.user_agent LIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sn_audit_logs al ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    // Get audit logs with actor email
    const logs = await query<any>(
      `SELECT 
        al.id, al.actor_user_id, al.action, al.target_user_id, 
        al.metadata, al.created_at, al.ip, al.user_agent,
        u.email as actor_email,
        t.email as target_email
       FROM sn_audit_logs al
       LEFT JOIN sn_users u ON al.actor_user_id = u.id
       LEFT JOIN sn_users t ON al.target_user_id = t.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, pageSize, offset]
    );

    return res.status(200).json({
      rows: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[/api/admin/audit] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}