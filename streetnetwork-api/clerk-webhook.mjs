/**
 * Clerk Webhook Handler
 * Sincroniza usuarios de Clerk con la base de datos PostgreSQL
 * 
 * Eventos soportados:
 * - user.created: Crea nuevo usuario en DB
 * - user.updated: Actualiza usuario en DB
 * - user.deleted: Marca usuario como inactivo
 */

import { Webhook } from 'svix';
import { clerkClient } from './clerk-auth.mjs';

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

// Flags por defecto para nuevos usuarios
const DEFAULT_FLAGS = ['dashboard'];

// Todos los flags disponibles
const ALL_FLAGS = [
  'dashboard',
  'tickets',
  'transcripts',
  'message_builder',
  'screenshot_editor',
  'users',
  'audit_logs',
  'nexus',
  'vault',
];

/**
 * Verifica la firma del webhook de Clerk usando Svix
 */
export function verifyWebhookSignature(req, res, next) {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('[CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.warn('[CLERK_WEBHOOK] Missing Svix headers');
    return res.status(400).json({ error: 'Missing Svix headers' });
  }

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  
  try {
    const payload = wh.verify(JSON.stringify(req.body), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    req.webhookPayload = payload;
    return next();
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Invalid signature:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }
}

/**
 * Extrae información del usuario desde el payload de Clerk
 */
function extractUserData(payload) {
  const { id, email_addresses, username, first_name, last_name, image_url, external_accounts, public_metadata } = payload.data || payload;
  
  // Email primario
  const primaryEmail = email_addresses?.find(e => e.id === payload.data?.primary_email_address_id)?.email_address 
    || email_addresses?.[0]?.email_address 
    || null;

  // Discord account si existe
  const discordAccount = external_accounts?.find(acc => acc.provider === 'discord');
  
  // Flags desde publicMetadata
  const metadataFlags = public_metadata?.flags || [];
  const role = public_metadata?.role || 'user';

  return {
    clerkId: id,
    email: primaryEmail?.toLowerCase() || null,
    username: username || null,
    firstName: first_name || null,
    lastName: last_name || null,
    fullName: [first_name, last_name].filter(Boolean).join(' ') || username || null,
    avatarUrl: image_url || null,
    discordId: discordAccount?.external_id || null,
    discordUsername: discordAccount?.username || null,
    flags: Array.isArray(metadataFlags) ? metadataFlags.filter(f => ALL_FLAGS.includes(f)) : DEFAULT_FLAGS,
    role,
  };
}

/**
 * Crea un nuevo usuario en la base de datos.
 * Si ya existe un usuario con el mismo email (migración desde sistema anterior),
 * vincula ese registro existente al nuevo clerk_id en lugar de crear un duplicado.
 * Esto preserva los flags y el rol del usuario original, y los sincroniza
 * de vuelta a Clerk publicMetadata para que AppShell los pueda leer.
 */
async function createUser(pool, userData) {
  const client = await pool.connect();
  let userId;
  let syncToClerk = null; // { flags, role } para sincronizar después del commit

  try {
    await client.query('BEGIN');

    // Verificar si ya existe un usuario con el mismo email (caso de migración)
    let existingUser = null;
    if (userData.email) {
      const existing = await client.query(
        `SELECT id FROM public.sn_users WHERE email = $1`,
        [userData.email]
      );
      existingUser = existing.rows[0] || null;
    }

    if (existingUser) {
      // Leer flags y role existentes ANTES de actualizar (para sincronizar a Clerk)
      const flagsResult = await client.query(
        `SELECT flag FROM public.sn_user_flags WHERE user_id = $1`,
        [existingUser.id]
      );
      const existingFlags = flagsResult.rows.map(r => r.flag);

      const roleResult = await client.query(
        `SELECT role FROM public.sn_users WHERE id = $1`,
        [existingUser.id]
      );
      const existingRole = roleResult.rows[0]?.role || 'user';

      // Usuario existente: vincular al nuevo clerk_id preservando role y flags
      const updateResult = await client.query(
        `UPDATE public.sn_users SET
          clerk_id = $2,
          discord_id = COALESCE($3, discord_id),
          discord_username = COALESCE($4, discord_username),
          discord_avatar = COALESCE($5, discord_avatar),
          updated_at = now()
         WHERE id = $1
         RETURNING id`,
        [
          existingUser.id,
          userData.clerkId,
          userData.discordId,
          userData.discordUsername,
          userData.avatarUrl,
        ]
      );
      userId = updateResult.rows[0]?.id;
      syncToClerk = { flags: existingFlags, role: existingRole };
      console.log(`[CLERK_WEBHOOK] Existing user linked to Clerk: ${userData.clerkId} (${userData.email}) — flags: [${existingFlags.join(', ')}]`);
    } else {
      // Usuario nuevo: insertar con flags por defecto
      const userResult = await client.query(
        `INSERT INTO public.sn_users 
          (clerk_id, email, name, role, is_active, is_verified, discord_id, discord_username, discord_avatar, created_at)
         VALUES ($1, $2, $3, $4, true, true, $5, $6, $7, now())
         ON CONFLICT (clerk_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          discord_id = EXCLUDED.discord_id,
          discord_username = EXCLUDED.discord_username,
          discord_avatar = EXCLUDED.discord_avatar,
          updated_at = now()
         RETURNING id`,
        [
          userData.clerkId,
          userData.email,
          userData.fullName,
          userData.role,
          userData.discordId,
          userData.discordUsername,
          userData.avatarUrl,
        ]
      );
      userId = userResult.rows[0]?.id;

      if (!userId) {
        throw new Error('Failed to create user');
      }

      // Insertar flags por defecto para usuarios nuevos
      const flagsToInsert = userData.flags.length > 0 ? userData.flags : DEFAULT_FLAGS;
      for (const flag of flagsToInsert) {
        await client.query(
          `INSERT INTO public.sn_user_flags (user_id, flag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, flag]
        );
      }
      syncToClerk = { flags: flagsToInsert, role: userData.role || 'user' };
      console.log(`[CLERK_WEBHOOK] New user created: ${userData.clerkId} (${userData.email})`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Sincronizar flags y role a Clerk publicMetadata (fuera de la transacción)
  // AppShell.tsx lee user?.publicMetadata?.flags — sin esto el usuario no tiene acceso
  if (syncToClerk && clerkClient) {
    try {
      await clerkClient.users.updateUserMetadata(userData.clerkId, {
        publicMetadata: {
          flags: syncToClerk.flags,
          role: syncToClerk.role,
        },
      });
      console.log(`[CLERK_WEBHOOK] Clerk publicMetadata synced for: ${userData.clerkId} — flags: [${syncToClerk.flags.join(', ')}]`);
    } catch (err) {
      console.error(`[CLERK_WEBHOOK] Failed to sync publicMetadata to Clerk for ${userData.clerkId}:`, err.message);
    }
  }

  return userId;
}

/**
 * Actualiza un usuario existente
 */
async function updateUser(pool, userData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar usuario
    const userResult = await client.query(
      `UPDATE public.sn_users SET
        email = $2,
        name = $3,
        discord_id = $4,
        discord_username = $5,
        discord_avatar = $6,
        updated_at = now()
       WHERE clerk_id = $1
       RETURNING id`,
      [
        userData.clerkId,
        userData.email,
        userData.fullName,
        userData.discordId,
        userData.discordUsername,
        userData.avatarUrl,
      ]
    );

    const userId = userResult.rows[0]?.id;

    if (!userId) {
      // Si no existe, crear
      await client.query('ROLLBACK');
      return createUser(pool, userData);
    }

    // Actualizar flags (eliminar existentes y crear nuevos)
    await client.query(`DELETE FROM public.sn_user_flags WHERE user_id = $1`, [userId]);
    for (const flag of userData.flags) {
      await client.query(
        `INSERT INTO public.sn_user_flags (user_id, flag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, flag]
      );
    }

    await client.query('COMMIT');
    console.log(`[CLERK_WEBHOOK] User updated: ${userData.clerkId}`);
    return userId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Marca un usuario como inactivo (soft delete)
 */
async function deleteUser(pool, clerkId) {
  const result = await pool.query(
    `UPDATE public.sn_users SET is_active = false, updated_at = now() WHERE clerk_id = $1 RETURNING id`,
    [clerkId]
  );
  
  if (result.rowCount > 0) {
    console.log(`[CLERK_WEBHOOK] User deactivated: ${clerkId}`);
  }
  return result.rowCount > 0;
}

/**
 * Handler principal del webhook
 */
export async function handleClerkWebhook(req, res, pool) {
  const payload = req.webhookPayload;
  const eventType = payload?.type;

  console.log(`[CLERK_WEBHOOK] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created': {
        const userData = extractUserData(payload);
        await createUser(pool, userData);
        break;
      }

      case 'user.updated': {
        const userData = extractUserData(payload);
        await updateUser(pool, userData);
        break;
      }

      case 'user.deleted': {
        const { id } = payload.data || {};
        if (id) {
          await deleteUser(pool, id);
        }
        break;
      }

      default:
        console.log(`[CLERK_WEBHOOK] Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error processing webhook:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
