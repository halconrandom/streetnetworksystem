import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { query, queryOne, execute, DBUser, DBUserFlag } from './db';

// Flags por defecto para nuevos usuarios
const DEFAULT_FLAGS = ['dashboard'];

/**
 * Obtiene o crea un usuario en la DB basándose en el clerk_id del token de sesión.
 * 
 * Flujo:
 * 1. Fast path: busca por clerk_id (funciona después de que el webhook corre)
 * 2. Fallback: obtiene datos de Clerk API y busca/crea por email
 * 
 * Extrae datos de Discord desde external_accounts si están disponibles.
 */
export async function getOrCreateUserByClerkId(req: any): Promise<DBUser | null> {
  const { userId } = getAuth(req);
  if (!userId) return null;

  // Fast path: buscar por clerk_id (después de que el webhook vinculó la cuenta)
  let user = await queryOne<DBUser>(
    'SELECT * FROM sn_users WHERE clerk_id = $1',
    [userId]
  );

  if (user) {
    await execute('UPDATE sn_users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    return user;
  }

  // Fallback: obtener datos desde Clerk API
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // Email primario
    const email = clerkUser.emailAddresses.find(
      (e: any) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.error('[getOrCreateUserByClerkId] No email found for user:', userId);
      return null;
    }

    // Extraer datos de Discord desde external_accounts
    const discordAccount = (clerkUser as any).externalAccounts?.find(
      (acc: any) => acc.provider === 'discord' || acc.provider === 'oauth_discord'
    );
    
    const discordId = discordAccount?.externalId || discordAccount?.external_id || null;
    const discordUsername = discordAccount?.username || null;
    const discordAvatar = clerkUser.imageUrl || null;
    
    // Nombre completo
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') 
      || clerkUser.username 
      || null;

    // Buscar usuario existente por email
    user = await queryOne<DBUser>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (user) {
      // Vincular usuario existente al clerk_id y actualizar datos de Discord
      await execute(
        `UPDATE sn_users SET 
          clerk_id = $1, 
          discord_id = COALESCE($2, discord_id),
          discord_username = COALESCE($3, discord_username),
          discord_avatar = COALESCE($4, discord_avatar),
          name = COALESCE($5, name),
          updated_at = NOW() 
         WHERE id = $6`,
        [userId, discordId, discordUsername, discordAvatar, fullName, user.id]
      );
      user = { ...user, clerk_id: userId } as any;
      console.log(`[getOrCreateUserByClerkId] Linked existing user to Clerk: ${userId} (${email})`);
    } else {
      // Crear nuevo usuario con datos de Discord
      const id = crypto.randomUUID();
      await execute(
        `INSERT INTO sn_users (id, clerk_id, email, name, role, is_active, is_verified, discord_id, discord_username, discord_avatar, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', true, true, $5, $6, $7, NOW(), NOW())`,
        [id, userId, email.toLowerCase(), fullName, discordId, discordUsername, discordAvatar]
      );
      
      // Insertar flags por defecto
      for (const flag of DEFAULT_FLAGS) {
        await execute(
          'INSERT INTO sn_user_flags (user_id, flag, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
          [id, flag]
        );
      }
      
      user = await queryOne<DBUser>('SELECT * FROM sn_users WHERE id = $1', [id]);
      console.log(`[getOrCreateUserByClerkId] Created new user: ${userId} (${email}) — flags: [${DEFAULT_FLAGS.join(', ')}]`);
    }

    if (user) {
      await execute('UPDATE sn_users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    }

    return user;
  } catch (err) {
    console.error('[getOrCreateUserByClerkId] Error fetching from Clerk:', err);
    return null;
  }
}

// Alias para compatibilidad con código existente
export const getOrCreateUser = getOrCreateUserByClerkId;

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
