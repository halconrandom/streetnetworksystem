import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import http from 'http';

export const config = {
  api: { bodyParser: false },
};

function readBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function discordFetch(
  url: URL,
  method: string,
  headers: Record<string, string>,
  body?: Buffer,
): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(url, { method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        let json: unknown = {};
        try { json = JSON.parse(Buffer.concat(chunks).toString()); } catch { /* non-json */ }
        resolve({ status: res.statusCode ?? 500, json });
      });
    });
    req.on('error', reject);
    if (body?.length) req.write(body);
    req.end();
  });
}

function pipe(
  req: NextApiRequest,
  res: NextApiResponse,
  targetUrl: URL,
  body: Buffer,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transport = targetUrl.protocol === 'https:' ? https : http;
    const outHeaders: Record<string, string> = {};
    const ct = req.headers['content-type'];
    if (ct) outHeaders['content-type'] = ct;
    if (body.length) outHeaders['content-length'] = String(body.length);

    const proxyReq = transport.request(targetUrl, { method: req.method, headers: outHeaders }, (proxyRes) => {
      res.status(proxyRes.statusCode ?? 502);
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (v !== undefined) res.setHeader(k, v as string | string[]);
      }
      proxyRes.pipe(res);
      proxyRes.on('end', resolve);
      proxyRes.on('error', reject);
    });
    proxyReq.on('error', reject);
    if (body.length) proxyReq.write(body);
    proxyReq.end();
  });
}

async function handleChannelId(req: NextApiRequest, res: NextApiResponse, channelId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return res.status(400).json({ error: 'Missing DISCORD_BOT_TOKEN' });

  const webhookName = (req.query.webhook_name as string) || process.env.DISCORD_WEBHOOK_NAME || 'Builder';

  const listRes = await discordFetch(
    new URL(`https://discord.com/api/v10/channels/${channelId}/webhooks`),
    'GET',
    { Authorization: `Bot ${token}` },
  );

  let webhook = Array.isArray(listRes.json)
    ? (listRes.json as any[]).find((w) => w?.name === webhookName)
    : null;

  if (!webhook) {
    const payload = JSON.stringify({ name: webhookName });
    const createRes = await discordFetch(
      new URL(`https://discord.com/api/v10/channels/${channelId}/webhooks`),
      'POST',
      {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(payload)),
      },
      Buffer.from(payload),
    );
    if (createRes.status >= 400) return res.status(createRes.status).json(createRes.json);
    webhook = createRes.json;
  }

  if (!webhook?.id || !webhook?.token) return res.status(500).json({ error: 'Webhook unavailable' });

  const body = await readBody(req);
  await pipe(req, res, new URL(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`), body);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    return res.status(204).end();
  }

  if (!['GET', 'POST'].includes(req.method ?? '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedKey = process.env.NEXT_PUBLIC_BACKEND_PROXY_KEY;
  if (expectedKey && req.headers['x-api-key'] !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { url, channel_id } = req.query;

  try {
    if (channel_id && typeof channel_id === 'string' && /^\d+$/.test(channel_id)) {
      return await handleChannelId(req, res, channel_id);
    }

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing url or channel_id' });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid url parameter' });
    }

    if (targetUrl.hostname !== 'discord.com') {
      return res.status(400).json({ error: 'Only discord.com URLs are allowed' });
    }

    const body = await readBody(req);
    await pipe(req, res, targetUrl, body);
  } catch (err: unknown) {
    res.status(502).json({ error: (err as Error)?.message ?? 'Proxy failed' });
  }
}
