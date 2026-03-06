/**
 * Debug endpoint para ver los datos del usuario de Clerk
 * Solo disponible en desarrollo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { queryOne } from '@lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener el userId de la sesión
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(200).json({
        authenticated: false,
        message: 'No user session found. Please log in first.',
      });
    }

    // Obtener datos completos del usuario de Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // Buscar usuario en la base de datos
    const dbUser = await queryOne(
      'SELECT * FROM sn_users WHERE clerk_id = $1',
      [userId]
    );

    // Extraer datos de Discord
    const externalAccounts = (clerkUser as any).externalAccounts || [];
    let discordData: any = null;
    
    for (const account of externalAccounts) {
      const provider = (account.provider || account.providerType || '').toLowerCase();
      if (provider.includes('discord')) {
        discordData = {
          provider: account.provider,
          providerType: account.providerType,
          externalId: account.externalId || account.external_id,
          username: account.username,
          name: account.name,
          label: account.label,
          avatarUrl: account.avatarUrl || account.avatar_url,
          imageUrl: account.imageUrl || account.image_url,
          raw: account,
        };
        break;
      }
    }

    return res.status(200).json({
      authenticated: true,
      clerkUserId: userId,
      clerkUser: {
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses,
        primaryEmailAddressId: clerkUser.primaryEmailAddressId,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        imageUrl: clerkUser.imageUrl,
        publicMetadata: clerkUser.publicMetadata,
        externalAccounts: externalAccounts.map((acc: any) => ({
          id: acc.id,
          provider: acc.provider,
          providerType: acc.providerType,
          externalId: acc.externalId,
          username: acc.username,
        })),
      },
      discordData,
      dbUser: dbUser ? {
        id: dbUser.id,
        clerk_id: dbUser.clerk_id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        is_active: dbUser.is_active,
        discord_id: dbUser.discord_id,
        discord_username: dbUser.discord_username,
        discord_avatar: dbUser.discord_avatar,
        created_at: dbUser.created_at,
      } : null,
      message: dbUser 
        ? 'User found in database' 
        : 'User NOT found in database. The webhook may not have run yet.',
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
}