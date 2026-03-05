import { getAuth } from '@clerk/nextjs/server';
import { query, queryOne, execute, DBUser, DBUserFlag } from './db';

// Get or create user from DB based on Clerk auth
export async function getOrCreateUser(req: any): Promise<DBUser | null> {
  const { userId } = getAuth(req);
  if (!userId) return null;

  // Get Clerk user data from request
  const clerkUser = req.sessionClaims?.__clerk_user || {};
  const email = clerkUser.email_addresses?.[0]?.email_address || 
                clerkUser.primary_email_address_id || 
                req.sessionClaims?.email;

  if (!email) return null;

  // Try to find user by email
  let user = await queryOne<DBUser>(
    'SELECT * FROM sn_users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (!user) {
    // Create new user
    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO sn_users (id, email, role, is_active, is_verified, created_at, updated_at)
       VALUES ($1, $2, 'user', true, true, NOW(), NOW())`,
      [id, email.toLowerCase()]
    );
    
    user = await queryOne<DBUser>(
      'SELECT * FROM sn_users WHERE id = $1',
      [id]
    );
  }

  // Update last login
  if (user) {
    await execute(
      'UPDATE sn_users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
  }

  return user;
}

// Get user flags
export async function getUserFlags(userId: string): Promise<string[]> {
  const flags = await query<DBUserFlag>(
    'SELECT flag FROM sn_user_flags WHERE user_id = $1',
    [userId]
  );
  return flags.map(f => f.flag);
}

// Set user flags (replaces all)
export async function setUserFlags(userId: string, flags: string[], grantedBy: string): Promise<void> {
  // Delete existing flags
  await execute('DELETE FROM sn_user_flags WHERE user_id = $1', [userId]);
  
  // Insert new flags
  for (const flag of flags) {
    await execute(
      'INSERT INTO sn_user_flags (user_id, flag, granted_by, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, flag, grantedBy]
    );
  }
}

// Check if user has specific flag
export async function hasFlag(userId: string, flag: string): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM sn_user_flags WHERE user_id = $1 AND flag = $2) as exists',
    [userId, flag]
  );
  return result?.exists || false;
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await queryOne<DBUser>(
    'SELECT role FROM sn_users WHERE id = $1',
    [userId]
  );
  return user?.role === 'admin';
}

// Get user with flags
export async function getUserWithFlags(userId: string): Promise<(DBUser & { flags: string[] }) | null> {
  const user = await queryOne<DBUser>(
    'SELECT * FROM sn_users WHERE id = $1',
    [userId]
  );
  if (!user) return null;
  
  const flags = await getUserFlags(userId);
  return { ...user, flags };
}

// Log audit action
export async function logAudit(
  action: string,
  actorUserId: string | null,
  targetUserId: string | null = null,
  metadata: Record<string, any> | null = null,
  ip: string | null = null,
  userAgent: string | null = null
): Promise<void> {
  await execute(
    `INSERT INTO sn_audit_logs (actor_user_id, action, target_user_id, metadata, created_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
    [actorUserId, action, targetUserId, JSON.stringify(metadata), ip, userAgent]
  );
}
