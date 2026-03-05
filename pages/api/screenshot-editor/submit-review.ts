import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { queryOne, execute } from '@lib/db';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DISCORD_BOT_TOKEN) {
    return res.status(503).json({ error: 'DISCORD_BOT_TOKEN no configurado en el servidor.' });
  }

  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clerkUser = (sessionClaims as any)?.__clerk_user || {};
    const email = clerkUser.email_addresses?.find(
      (e: any) => e.id === clerkUser.primary_email_address_id
    )?.email_address;

    if (!email) {
      return res.status(400).json({ error: 'No email found' });
    }

    const currentUser = await queryOne<any>(
      'SELECT * FROM sn_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { imageDataUrl, fileName } = req.body || {};

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'imageDataUrl es requerido.' });
    }

    // Fetch the user's configured review channel
    let channelId;
    try {
      const userResult = await queryOne<any>(
        `SELECT discord_review_channel_id FROM sn_users WHERE id = $1`,
        [currentUser.id]
      );
      channelId = userResult?.discord_review_channel_id;
    } catch (err) {
      console.error('[SUBMIT_REVIEW] DB error fetching channel:', err);
      return res.status(500).json({ error: 'Error al obtener la configuración del canal.' });
    }

    if (!channelId) {
      return res.status(400).json({
        error: 'No tienes un canal de revisión configurado. Ve a Configuración y añade el ID del canal de Discord.',
      });
    }

    // Fetch the review role for the guild that owns this channel
    let reviewRoleId = null;
    try {
      const channelInfoRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      });
      if (channelInfoRes.ok) {
        const channelInfo = await channelInfoRes.json();
        const guildId = channelInfo.guild_id;
        if (guildId) {
          const roleResult = await queryOne<any>(
            `SELECT review_role_id FROM sn_screenshot_review_config WHERE guild_id = $1`,
            [guildId]
          );
          reviewRoleId = roleResult?.review_role_id ?? null;
        }
      }
    } catch (err: any) {
      console.warn('[SUBMIT_REVIEW] Could not fetch review role:', err.message);
    }

    // Convert base64 data URL to Buffer
    let imageBuffer;
    try {
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (err) {
      return res.status(400).json({ error: 'imageDataUrl inválido.' });
    }

    const safeFileName = (fileName || `screenshot-${Date.now()}.png`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const submittedAt = Math.floor(Date.now() / 1000);
    const submitterName = currentUser.name || currentUser.email || 'Usuario';

    // Build the review ID
    const reviewId = crypto.randomUUID().slice(0, 16);

    // Build the Container v2 JSON payload
    const containerComponents = [
      {
        type: 17, // Container
        accent_color: 0xff3b3b,
        components: [
          {
            type: 10, // TextDisplay
            content: '# 📸 Screenshot para Revisión',
          },
          { type: 14 }, // Separator
          {
            type: 10,
            content: [
              `👤 Enviado por: **${submitterName}**`,
              `📁 Archivo: \`${safeFileName}\``,
              `📅 Enviado: <t:${submittedAt}:f>`,
            ].join('\n'),
          },
          { type: 14 }, // Separator
          {
            type: 12, // MediaGallery
            items: [
              {
                type: 13, // MediaGalleryItem
                media: {
                  url: `attachment://${safeFileName}`,
                },
              },
            ],
          },
          ...(reviewRoleId
            ? [
              { type: 14 },
              {
                type: 10,
                content: `<@&${reviewRoleId}> — Revisa este screenshot`,
              },
            ]
            : []),
          { type: 14 },
          {
            type: 1, // ActionRow
            components: [
              {
                type: 2, // Button
                style: 3, // Success (green)
                label: '✅ Aprobar',
                custom_id: `screenshot_approve:${reviewId}`,
              },
              {
                type: 2,
                style: 4, // Danger (red)
                label: '❌ Denegar',
                custom_id: `screenshot_deny:${reviewId}`,
              },
            ],
          },
        ],
      },
    ];

    // Send to Discord using multipart/form-data
    try {
      const form = new FormData();

      const payload = {
        flags: 1 << 15, // IS_COMPONENTS_V2
        components: containerComponents,
        attachments: [
          {
            id: 0,
            filename: safeFileName,
            description: "Screenshot for review",
          },
        ],
      };

      form.append('payload_json', JSON.stringify(payload));
      form.append(
        'files[0]',
        new Blob([imageBuffer], { type: 'image/png' }),
        safeFileName
      );

      const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        body: form,
      });

      if (!discordRes.ok) {
        const errBody = await discordRes.text();
        console.error('[SUBMIT_REVIEW] Discord API error:', discordRes.status, errBody);
        return res.status(502).json({ error: `Error al enviar a Discord: ${discordRes.status}` });
      }

      const discordMsg = await discordRes.json();
      console.log(`[SUBMIT_REVIEW] Sent review message ${discordMsg.id} to channel ${channelId} by user ${currentUser.id}`);
      return res.json({ ok: true, messageId: discordMsg.id });
    } catch (err) {
      console.error('[SUBMIT_REVIEW] Failed to send to Discord:', err);
      return res.status(500).json({ error: 'Error al enviar el screenshot a Discord.' });
    }
  } catch (error) {
    console.error('[/api/screenshot-editor/submit-review] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
