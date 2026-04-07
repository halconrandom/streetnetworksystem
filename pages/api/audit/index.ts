import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { isAuthenticated } from '@lib/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 25;
    const offset = (page - 1) * pageSize;
    const { action, actorId, dateStart, dateEnd } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (action)    { conditions.push(`al.action ILIKE $${i++}`); params.push(`%${action}%`); }
    if (actorId)   { conditions.push(`al.actor_user_id = $${i++}`); params.push(actorId); }
    if (dateStart) { conditions.push(`al.created_at >= $${i++}`); params.push(dateStart); }
    if (dateEnd)   { conditions.push(`al.created_at <= $${i++}`); params.push(dateEnd); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sn_audit_logs al ${where}`, params
    );
    const total = parseInt(countResult[0]?.count || '0');

    const logs = await query<any>(
      `SELECT al.id, al.actor_user_id, al.action, al.target_user_id,
              al.metadata, al.created_at, al.ip, al.user_agent,
              u.email as actor_email, t.email as target_email
       FROM sn_audit_logs al
       LEFT JOIN sn_users u ON al.actor_user_id = u.id
       LEFT JOIN sn_users t ON al.target_user_id = t.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, pageSize, offset]
    );

    return res.status(200).json({
      rows: logs.map((l) => ({ ...l, created_at: new Date(l.created_at).toISOString() })),
      total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[/api/audit]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
