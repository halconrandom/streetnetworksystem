/**
 * Clerk Webhook Handler
 * Sincroniza usuarios de Clerk con la base de datos PostgreSQL.
 *
 * Eventos soportados:
 * - user.created  → Crea nuevo usuario en DB con datos de Discord
 * - user.updated  → Actualiza usuario en DB (Discord data, name, avatar)
 * - user.deleted  → Marca usuario como inactivo (soft delete)
 *
 * Seguridad: verifica la firma Svix antes de procesar cualquier evento.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { queryOne, execute } from '@lib/db';

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

// Flags asignados automáticamente a nuevos usuarios
const DEFAULT_FLAGS = ['screenshot_editor', 'nexus'];

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkExternalAccount {
  id?: string;
  provider?: string;
  provider_type?: string;
  providerType?: string;
  external_id?: string;
  externalId?: string;
  provider_user_id?: string;
  providerUserId?: string;
  username?: string;
  name?: string;
  label?: string;
  display_name?: string;
  displayName?: string;
  avatar_url?: string;
  avatarUrl?: string;
  image_url?: string;
  imageUrl?: string;
}

interface ClerkWebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses?: ClerkEmailAddress[];
    primary_email_address_id?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    external_accounts?: ClerkExternalAccount[];
    public_metadata?: {
      flags?: string[];
      role?: string;
    };
  };
}

interface UserData {
  clerkId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrae datos de Discord desde external_accounts de Clerk.
 * Soporta Clerk v6 (oauth_discord) y variantes anteriores.
 */
function extractDiscordAccount(accounts: ClerkExternalAccount[]): {
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  found: boolean;
} {
  for (const account of accounts) {
    const provider = (
      account.provider ||
      account.providerType ||
      account.provider_type ||
      ''
    ).toLowerCase();

    if (!provider.includes('discord')) continue;

    const discordId =
      account.externalId ||
      account.external_id ||
      account.providerUserId ||
      account.provider_user_id ||
      null;

    const discordUsername =
      account.username ||
      account.displayName ||
      account.display_name ||
      account.name ||
      account.label ||
      null;

    const discordAvatar =
      account.avatarUrl ||
      account.avatar_url ||
      account.imageUrl ||
      account.image_url ||
      null;

    console.log('[CLERK_WEBHOOK] Discord account extracted:', {
      provider,
      discordId,
      discordUsername,
      hasAvatar: !!discordAvatar,
    });

    return { discordId, discordUsername, discordAvatar, found: true };
  }

  return { discordId: null, discordUsername: null, discordAvatar: null, found: false };
}

/**
 * Extrae y normaliza los datos del usuario desde el payload de Clerk.
 */
function extractUserData(payload: ClerkWebhookPayload): UserData {
  const {
    id,
    email_addresses,
    primary_email_address_id,
    username,
    first_name,
    last_name,
    image_url,
    external_accounts = [],
  } = payload.data;

  // Email primario
  const primaryEmail =
    email_addresses?.find((e) => e.id === primary_email_address_id)?.email_address ||
    email_addresses?.[0]?.email_address ||
    null;

  // Discord
  const { discordId, discordUsername, discordAvatar, found: hasDiscord } =
    extractDiscordAccount(external_accounts);

  if (!hasDiscord) {
    console.warn(
      `[CLERK_WEBHOOK] ⚠️  No Discord account in payload for user ${id}. ` +
      `external_accounts count: ${external_accounts.length}. ` +
      `This platform requires Discord OAuth.`
    );
  }

  // Full name: prefer first+last, then Discord username, then Clerk username
  const fullName =
    [first_name, last_name].filter(Boolean).join(' ') ||
    discordUsername ||
    username ||
    null;

  // Avatar: prefer Discord's, fall back to Clerk's image_url
  const avatarUrl = discordAvatar || image_url || null;

  return {
    clerkId: id,
    email: primaryEmail,
    fullName,
    avatarUrl,
    discordId,
    discordUsername,
    discordAvatar: avatarUrl,
  };
}

// ── DB operations ─────────────────────────────────────────────────────────────

async function createUser(data: UserData): Promise<void> {
  const { clerkId, email, fullName, discordId, discordUsername, discordAvatar } = data;

  if (!email) {
    console.error('[CLERK_WEBHOOK] Cannot create user without email. clerkId:', clerkId);
    return;
  }

  // Check if user already exists (by clerk_id, discord_id, or email)
  let existing = await queryOne<{ id: string; clerk_id: string | null }>(
    'SELECT id, clerk_id FROM sn_users WHERE clerk_id = $1 OR discord_id = $2 OR email = $3 LIMIT 1',
    [clerkId, discordId, email.toLowerCase()]
  );

  if (existing) {
    console.log(`[CLERK_WEBHOOK] User already exists (id: ${existing.id}), updating instead of creating.`);
    // Link clerk_id if not already set
    await execute(
      `UPDATE sn_users SET
        clerk_id = COALESCE(clerk_id, $1),
        discord_id = COALESCE($2, discord_id),
        discord_username = COALESCE($3, discord_username),
        discord_avatar = COALESCE($4, discord_avatar),
        name = COALESCE($5, name),
        updated_at = NOW()
       WHERE id = $6`,
      [clerkId, discordId, discordUsername, discordAvatar, fullName, existing.id]
    );
    return;
  }

  // Create new user
  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO sn_users (id, clerk_id, email, name, role, is_active, is_verified, discord_id, discord_username, discord_avatar, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'user', true, true, $5, $6, $7, NOW(), NOW())`,
    [id, clerkId, email.toLowerCase(), fullName, discordId, discordUsername, discordAvatar]
  );

  // Assign default flags
  for (const flag of DEFAULT_FLAGS) {
    await execute(
      'INSERT INTO sn_user_flags (user_id, flag, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [id, flag]
    );
  }

  console.log(
    `[CLERK_WEBHOOK] ✅ Created user: ${clerkId} (${email}) — discord: ${discordId ?? 'none'} — flags: [${DEFAULT_FLAGS.join(', ')}]`
  );
}

async function updateUser(data: UserData): Promise<void> {
  const { clerkId, email, fullName, discordId, discordUsername, discordAvatar } = data;

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM sn_users WHERE clerk_id = $1',
    [clerkId]
  );

  if (!existing) {
    console.log(`[CLERK_WEBHOOK] User not found for update (clerk_id: ${clerkId}), creating instead.`);
    await createUser(data);
    return;
  }

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
      email ? email.toLowerCase() : null,
      fullName,
      discordId,
      discordUsername,
      discordAvatar,
      clerkId,
    ]
  );

  console.log(`[CLERK_WEBHOOK] ✅ Updated user: ${clerkId} (${email ?? 'no email'})`);
}

async function deleteUser(clerkId: string): Promise<void> {
  // Soft delete: mark as inactive
  const result = await execute(
    `UPDATE sn_users SET is_active = false, updated_at = NOW() WHERE clerk_id = $1`,
    [clerkId]
  );

  console.log(`[CLERK_WEBHOOK] ✅ Soft-deleted user: ${clerkId}`);
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const config = {
  api: {
    bodyParser: false, // Required: read raw body for Svix signature verification
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Svix signature headers
  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[CLERK_WEBHOOK] Missing Svix headers');
    return res.status(400).json({ error: 'Missing Svix headers' });
  }

  // Read raw body
  let body: string;
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    body = Buffer.concat(chunks).toString('utf-8');
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error reading body:', err);
    return res.status(400).json({ error: 'Error reading request body' });
  }

  // Verify Svix signature
  let payload: ClerkWebhookPayload;

  if (CLERK_WEBHOOK_SECRET) {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    try {
      payload = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookPayload;
    } catch (err) {
      console.error('[CLERK_WEBHOOK] Invalid signature:', err);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  } else {
    // Development fallback: no secret configured
    console.warn('[CLERK_WEBHOOK] ⚠️  CLERK_WEBHOOK_SECRET not set — skipping signature verification (dev only)');
    try {
      payload = JSON.parse(body) as ClerkWebhookPayload;
    } catch (err) {
      console.error('[CLERK_WEBHOOK] Error parsing JSON:', err);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const eventType = payload.type;
  console.log(`[CLERK_WEBHOOK] Event: ${eventType} — user: ${payload.data?.id}`);

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

    return res.status(200).json({ received: true, event: eventType });
  } catch (err) {
    console.error('[CLERK_WEBHOOK] Error processing event:', err);
    console.error('[CLERK_WEBHOOK] Stack:', (err as Error).stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
