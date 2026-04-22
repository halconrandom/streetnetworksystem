import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { query, queryOne, execute, DBUser, DBUserFlag } from './db';

// Flags por defecto para nuevos usuarios registrados con Discord
const DEFAULT_FLAGS = ['screenshot_editor'];

/**
 * Extrae datos de Discord desde los external_accounts de Clerk.
 * Soporta la estructura de Clerk v6 (oauth_discord) y variantes anteriores.
 */
function extractDiscordFromExternalAccounts(externalAccounts: any[]): {
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  found: boolean;
} {
  for (const account of externalAccounts) {
    const provider = (
      account.provider ||
      account.providerType ||
      account.provider_type ||
      ''
    ).toLowerCase();

    if (provider.includes('discord')) {
      const discordId =
        account.externalId ||
        account.external_id ||
        account.providerUserId ||
        account.provider_user_id ||
        null;

      const discordUsername =
        account.username ||
        account.name ||
        account.label ||
        account.displayName ||
        account.display_name ||
        null;

      // Prefer Discord's own avatar; fall back to Clerk's image_url for this account
      const discordAvatar =
        account.avatarUrl ||
        account.avatar_url ||
        account.imageUrl ||
        account.image_url ||
        null;

      console.log('[extractDiscord] Found:', discordUsername);

      return { discordId, discordUsername, discordAvatar, found: true };
    }
  }

  return { discordId: null, discordUsername: null, discordAvatar: null, found: false };
}

/**
 * Obtiene o crea un usuario en la DB basándose en el clerk_id del token de sesión.
 *
 * Flujo:
 * 1. Fast path: busca por clerk_id (funciona después de que el webhook corre)
 * 2. Fallback: obtiene datos de Clerk API y busca/crea por discord_id o email
 *
 * IMPORTANTE: Solo se aceptan usuarios que hayan autenticado con Discord OAuth.
 * Si no se encuentra una cuenta de Discord vinculada, se registra una advertencia
 * pero el usuario se crea igualmente (para no bloquear el acceso si Clerk aún
 * no ha propagado los external_accounts).
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
    // Solo actualizar last_login_at si ha pasado más de 1 hora
    const lastLogin = user.last_login_at ? new Date(user.last_login_at).getTime() : 0;
    if (Date.now() - lastLogin > 3600000) {
      execute('UPDATE sn_users SET last_login_at = NOW() WHERE id = $1', [user.id]).catch(() => {});
    }
    return user;
  }

  console.log('[getOrCreateUserByClerkId] Fetching from Clerk...');

  // Fallback: obtener datos desde Clerk API
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // ── Discord data ──────────────────────────────────────────────────────────
    const externalAccounts = (clerkUser as any).externalAccounts || [];
    const { discordId, discordUsername, discordAvatar, found: hasDiscord } =
      extractDiscordFromExternalAccounts(externalAccounts);

    if (!hasDiscord) {
      console.warn('[getOrCreateUserByClerkId] No Discord account (ext accounts:', externalAccounts.length, ')');
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    const primaryEmailObj = clerkUser.emailAddresses.find(
      (e: any) => e.id === clerkUser.primaryEmailAddressId
    );
    const email =
      primaryEmailObj?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      null;

    if (!email) return null;

    // ── Full name ─────────────────────────────────────────────────────────────
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      discordUsername ||
      clerkUser.username ||
      null;

    // ── Avatar: prefer Discord's, fall back to Clerk's ───────────────────────
    const avatarUrl = discordAvatar || clerkUser.imageUrl || null;

    console.log('[getOrCreateUserByClerkId] User:', email);

    // ── Try to find existing user by discord_id first, then email ─────────────
    if (discordId) {
      user = await queryOne<DBUser>(
        'SELECT * FROM sn_users WHERE discord_id = $1',
        [discordId]
      );
      if (user) {
        console.log('[getOrCreateUserByClerkId] Found by discord_id:', user.id);
      }
    }

    if (!user) {
      user = await queryOne<DBUser>(
        'SELECT * FROM sn_users WHERE email = $1',
        [email.toLowerCase()]
      );
      if (user) {
        console.log('[getOrCreateUserByClerkId] Found by email:', user.id);
      }
    }

    if (user) {
      // Vincular usuario existente al clerk_id y actualizar datos de Discord
      // IMPORTANTE: Siempre actualizar clerk_id si es null
      
      await execute(
        `UPDATE sn_users SET
          clerk_id = COALESCE($1, clerk_id),
          discord_id = COALESCE($2, discord_id),
          discord_username = COALESCE($3, discord_username),
          discord_avatar = COALESCE($4, discord_avatar),
          name = COALESCE($5, name),
          updated_at = NOW()
         WHERE id = $6`,
        [userId, discordId, discordUsername, avatarUrl, fullName, user.id]
      );

      user = await queryOne<DBUser>('SELECT * FROM sn_users WHERE id = $1', [user.id]);
      console.log('[getOrCreateUserByClerkId] Linked to Clerk:', email);
    } else {
      // Crear nuevo usuario
      const id = crypto.randomUUID();
      await execute(
        `INSERT INTO sn_users (id, clerk_id, email, name, role, is_active, is_verified, discord_id, discord_username, discord_avatar, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', true, true, $5, $6, $7, NOW(), NOW())`,
        [id, userId, email.toLowerCase(), fullName, discordId, discordUsername, avatarUrl]
      );

      // Insertar flags por defecto
      for (const flag of DEFAULT_FLAGS) {
        await execute(
          'INSERT INTO sn_user_flags (user_id, flag, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
          [id, flag]
        );
      }

      user = await queryOne<DBUser>('SELECT * FROM sn_users WHERE id = $1', [id]);
      console.log('[getOrCreateUserByClerkId] Created new user:', email);
    }

    if (user) {
      await execute('UPDATE sn_users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    }

    return user;
  } catch (err) {
    console.error('[getOrCreateUserByClerkId] Error:', err);
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

// Check if user has specific flag (admins have all flags)
export async function hasFlag(userId: string, flag: string): Promise<boolean> {
  const admin = await isAdmin(userId);
  if (admin) return true;

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