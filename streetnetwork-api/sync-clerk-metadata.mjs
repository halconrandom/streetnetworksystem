/**
 * sync-clerk-metadata.mjs
 * 
 * Script de migración one-time: sincroniza los flags y role de todos los usuarios
 * que ya tienen clerk_id en la DB hacia Clerk publicMetadata.
 * 
 * Esto es necesario cuando el webhook user.created ya se disparó pero no sincronizó
 * los flags (usuarios migrados antes del fix en clerk-webhook.mjs).
 * 
 * Uso:
 *   node sync-clerk-metadata.mjs
 * 
 * Requiere en el entorno:
 *   DATABASE_URL=...
 *   CLERK_SECRET_KEY=...
 */

import 'dotenv/config';
import pg from 'pg';
import { createClerkClient } from '@clerk/backend';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

if (!DATABASE_URL) {
  console.error('[SYNC] ❌ DATABASE_URL is required');
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error('[SYNC] ❌ CLERK_SECRET_KEY is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

async function run() {
  console.log('[SYNC] 🚀 Starting Clerk publicMetadata sync...\n');

  // 1. Obtener todos los usuarios con clerk_id
  const usersResult = await pool.query(
    `SELECT id, clerk_id, email, role
     FROM public.sn_users
     WHERE clerk_id IS NOT NULL
     ORDER BY created_at ASC`
  );

  const users = usersResult.rows;
  console.log(`[SYNC] Found ${users.length} user(s) with clerk_id to sync.\n`);

  if (users.length === 0) {
    console.log('[SYNC] ✅ Nothing to sync.');
    await pool.end();
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      // 2. Obtener flags del usuario desde la DB
      const flagsResult = await pool.query(
        `SELECT flag FROM public.sn_user_flags WHERE user_id = $1 ORDER BY flag ASC`,
        [user.id]
      );
      const flags = flagsResult.rows.map(r => r.flag);

      // 3. Actualizar Clerk publicMetadata
      await clerkClient.users.updateUserMetadata(user.clerk_id, {
        publicMetadata: {
          flags,
          role: user.role || 'user',
        },
      });

      console.log(`[SYNC] ✅ ${user.email} (${user.clerk_id}) — flags: [${flags.join(', ') || 'none'}], role: ${user.role}`);
      successCount++;
    } catch (err) {
      console.error(`[SYNC] ❌ Failed for ${user.email} (${user.clerk_id}): ${err.message}`);
      errorCount++;
    }

    // Pequeña pausa para no saturar la API de Clerk (rate limit: 20 req/s)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n[SYNC] Done. ✅ ${successCount} synced, ❌ ${errorCount} failed.`);
  await pool.end();
}

run().catch(err => {
  console.error('[SYNC] Fatal error:', err);
  pool.end();
  process.exit(1);
});
