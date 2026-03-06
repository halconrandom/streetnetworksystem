import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { getOrCreateUserByClerkId, hasFlag } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentUser = await getOrCreateUserByClerkId(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Require audit_logs flag
    const canViewAudit = await hasFlag(currentUser.id, 'audit_logs');
    if (!canViewAudit) {
      return res.status(403).json({ error: 'Missing required permission: audit_logs' });
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
      conditions.push(`action LIKE $${paramIndex++}`);
      params.push(`%${action}%`);
    }
    if (actorId) {
      conditions.push(`actor_user_id = $${paramIndex++}`);
      params.push(actorId);
    }
    if (targetId) {
      conditions.push(`target_user_id = $${paramIndex++}`);
      params.push(targetId);
    }
    if (dateStart) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(dateStart);
    }
    if (dateEnd) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(dateEnd);
    }
    if (search) {
      conditions.push(`(ip LIKE $${paramIndex} OR user_agent LIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sn_audit_logs ${whereClause}`,
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
    console.error('[/api/audit] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}