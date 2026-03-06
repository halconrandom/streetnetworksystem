/**
 * Clerk Webhook Handler for Next.js
 * Sincroniza usuarios de Clerk con la base de datos PostgreSQL
 * 
 * Eventos soportados:
 * - user.created: Crea nuevo usuario en DB
 * - user.updated: Actualiza usuario en DB
 * - user.deleted: Marca usuario como inactivo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { queryOne, execute } from '@lib/db';

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

interface ClerkWebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    external_accounts?: Array<{
      provider: string;
      external_id: string;
      username?: string;
    }>;
    public_metadata?: {
      flags?: string[];
      role?: string;
    };
  };
}

interface UserData {
  clerkId: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  discordId: string | null;
  discordUsername: string | null;
  flags: string[];
  role: string;
}

/**
 * Extrae información del usuario desde el payload de Clerk
 */
function extractUserData(payload: ClerkWebhookPayload): UserData {
  const { id, email_addresses, username, first_name, last_name, image_url, external_accounts, public_metadata } = payload.data;
  
  // Email primario
  const primaryEmail = email_addresses?.find(e => e.id === payload.data.primary_email_address_id)?.email_address 
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
 * vincula ese registro existente al nuevo clerk_id.
 */
async function createUser(userData: UserData): Promise<string | null> {
  try {
    // Verificar si ya existe un usuario con el mismo email
    let existingUser = null;
    if (userData.email) {
      existingUser = await queryOne<{ id: string; role: string }>(
        'SELECT id, role FROM sn_users WHERE email = $1',
        [userData.email]
      );
    }

    if (existingUser) {
      // Usuario existente: vincular al nuevo clerk_id preservando role y flags
      await execute(
        `UPDATE sn_users SET
          clerk_id = $1,
          discord_id = COALESCE($2, discord_id),
          discord_username = COALESCE($3, discord_username),
          discord_avatar = COALESCE($4, discord_avatar),
          updated_at = NOW()
         WHERE id = $5`,
        [
          userData.clerkId,
          userData.discordId,
          userData.discordUsername,
          userData.avatarUrl,
          existingUser.id,
        ]
      );

      console.log(`[CLERK_WEBHOOK] Existing user linked to Clerk: ${userData.clerkId} (${userData.email})`);
      return existingUser.id;
    }

    // Usuario nuevo: insertar con flags por defecto
    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO sn_users (id, clerk_id, email, name, role, is_active, is_verified, discord_id, discord_username, discord_avatar, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, true, $6, $7, $8, NOW(), NOW())`,
      [
        id,
        userData.clerkId,
        userData.email,
        userData.fullName,
        userData.role,
        userData.discordId,
        userData.discordUsername,
        userData.avatarUrl,
      ]
    );

    // Insertar flags por defecto
    const flagsToInsert = userData.flags.length > 0 ? userData.flags : DEFAULT_FLAGS;
    for (const flag of flagsToInsert) {
      await execute(
        'INSERT INTO sn_user_flags (user_id, flag, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
        [id, flag]
      );
    }

    console.log(`[CLERK_WEBHOOK] New user created: ${userData.clerkId} (${userData.email}) — flags: [${flagsToInsert.join(', ')}]`);
    return id;
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error creating user:', err);
    return null;
  }
}

/**
 * Actualiza un usuario existente
 */
async function updateUser(userData: UserData): Promise<string | null> {
  try {
    // Buscar usuario por clerk_id
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM sn_users WHERE clerk_id = $1',
      [userData.clerkId]
    );

    if (!existingUser) {
      // Si no existe, crear
      return createUser(userData);
    }

    // Actualizar usuario
    await execute(
      `UPDATE sn_users SET
        email = COALESCE($1, email),
        name = COALESCE($2, name),
        discord_id = COALESCE($3, discord_id),
        discord_username = COALESCE($4, discord_username),
        discord_avatar = COALESCE($5, discord_avatar),
        updated_at = NOW()
       WHERE clerk_id = $6`,
      [
        userData.email,
        userData.fullName,
        userData.discordId,
        userData.discordUsername,
        userData.avatarUrl,
        userData.clerkId,
      ]
    );

    console.log(`[CLERK_WEBHOOK] User updated: ${userData.clerkId}`);
    return existingUser.id;
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error updating user:', err);
    return null;
  }
}

/**
 * Marca un usuario como inactivo (soft delete)
 */
async function deleteUser(clerkId: string): Promise<boolean> {
  try {
    await execute(
      'UPDATE sn_users SET is_active = false, updated_at = NOW() WHERE clerk_id = $1',
      [clerkId]
    );
    console.log(`[CLERK_WEBHOOK] User deactivated: ${clerkId}`);
    return true;
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error deactivating user:', err);
    return false;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que el secreto esté configurado
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('[CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Obtener headers de Svix
  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[CLERK_WEBHOOK] Missing Svix headers');
    return res.status(400).json({ error: 'Missing Svix headers' });
  }

  // Leer el body como raw string
  let body: string;
  try {
    // @ts-expect-error - Next.js con bodyParser: false permite leer el body como stream
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    body = Buffer.concat(chunks).toString('utf-8');
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error reading body:', err);
    return res.status(400).json({ error: 'Error reading request body' });
  }

  // Verificar la firma del webhook
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  let payload: ClerkWebhookPayload;

  try {
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookPayload;
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Invalid signature:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const eventType = payload.type;
  console.log(`[CLERK_WEBHOOK] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created': {
        const userData = extractUserData(payload);
        await createUser(userData);
        break;
      }

      case 'user.updated': {
        const userData = extractUserData(payload);
        await updateUser(userData);
        break;
      }

      case 'user.deleted': {
        const { id } = payload.data;
        if (id) {
          await deleteUser(id);
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