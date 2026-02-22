import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT || 8787);

const loadEnvFile = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const data = fs.readFileSync(envPath, 'utf8');
    data.split(/\r?\n/).forEach((line) => {
      if (!line || line.trim().startsWith('#')) return;
      const index = line.indexOf('=');
      if (index === -1) return;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // ignore
  }
};

const resolveBotToken = () => {
  return process.env.DISCORD_BOT_TOKEN || process.env.VITE_BOT_TOKEN || '';
};

const resolveWebhookName = () => {
  return process.env.DISCORD_WEBHOOK_NAME || 'Builder';
};

const resolveWebhookAvatar = () => {
  return process.env.DISCORD_WEBHOOK_AVATAR || '';
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const normalizeTarget = (requestUrl) => {
  const channelId = requestUrl.searchParams.get('channel_id');
  const urlParam = requestUrl.searchParams.get('url');
  if (channelId) {
    return {
      url: new URL(`https://discord.com/api/v10/channels/${channelId}/messages`),
      useBot: true,
      channelId,
    };
  }
  if (urlParam) {
    return {
      url: new URL(urlParam),
      useBot: false,
    };
  }
  return null;
};

loadEnvFile();

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const sendToDiscord = (targetUrl, headers, body) => new Promise((resolve, reject) => {
  const transport = targetUrl.protocol === 'https:' ? https : http;
  const proxyReq = transport.request(
    targetUrl,
    {
      method: 'POST',
      headers,
    },
    (proxyRes) => resolve(proxyRes)
  );

  proxyReq.on('error', reject);
  if (body && body.length) proxyReq.write(body);
  proxyReq.end();
});

const fetchJson = (targetUrl, headers, method = 'GET', body = null) => new Promise((resolve, reject) => {
  const transport = targetUrl.protocol === 'https:' ? https : http;
  const proxyReq = transport.request(
    targetUrl,
    {
      method,
      headers,
    },
    (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = {};
        try { json = JSON.parse(text); } catch {}
        resolve({ status: proxyRes.statusCode || 500, json, headers: proxyRes.headers });
      });
    }
  );

  proxyReq.on('error', reject);
  if (body) proxyReq.write(body);
  proxyReq.end();
});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  if (!['/api/webhook', '/api/discord'].includes(requestUrl.pathname)) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const target = normalizeTarget(requestUrl);
  if (!target) {
    sendJson(res, 400, { error: 'Missing url or channel_id query parameter' });
    return;
  }

  if (target.useBot) {
    const token = resolveBotToken();
    if (!token) {
      sendJson(res, 400, { error: 'Missing DISCORD_BOT_TOKEN' });
      return;
    }
  }

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.origin;
  delete headers.referer;

  if (!target.useBot) {
    const transport = target.url.protocol === 'https:' ? https : http;
    const proxyReq = transport.request(
      target.url,
      {
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      sendJson(res, 502, { error: err?.message || 'Proxy request failed' });
    });

    req.pipe(proxyReq);
    return;
  }

  readBody(req)
    .then(async (body) => {
      const token = resolveBotToken();
      const webhookName = requestUrl.searchParams.get('webhook_name') || resolveWebhookName();
      const webhookAvatar = requestUrl.searchParams.get('webhook_avatar') || resolveWebhookAvatar();

      const listRes = await fetchJson(
        new URL(`https://discord.com/api/v10/channels/${target.channelId}/webhooks`),
        { Authorization: `Bot ${token}` }
      );

      let webhook = Array.isArray(listRes.json)
        ? listRes.json.find((item) => item && item.name === webhookName)
        : null;

      if (!webhook) {
        const payload = JSON.stringify({
          name: webhookName,
          avatar: webhookAvatar || undefined,
        });
        const createRes = await fetchJson(
          new URL(`https://discord.com/api/v10/channels/${target.channelId}/webhooks`),
          {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          'POST',
          payload
        );
        if (createRes.status >= 400) {
          res.writeHead(createRes.status);
          res.end(JSON.stringify(createRes.json || { error: 'Failed to create webhook' }));
          return;
        }
        webhook = createRes.json;
      }

      if (!webhook?.id || !webhook?.token) {
        sendJson(res, 500, { error: 'Webhook unavailable' });
        return;
      }

      const webhookUrl = new URL(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`);
      const contentType = String(headers['content-type'] || headers['Content-Type'] || '');
      let outBody = body;
      const outHeaders = { ...headers };
      delete outHeaders.authorization;

      if (contentType.includes('application/json')) {
        try {
          const parsed = JSON.parse(body.toString('utf8'));
          const overrideName = requestUrl.searchParams.get('username');
          const overrideAvatar = requestUrl.searchParams.get('avatar_url');
          if (overrideName) parsed.username = overrideName;
          if (overrideAvatar) parsed.avatar_url = overrideAvatar;
          outBody = Buffer.from(JSON.stringify(parsed));
        } catch {
          outBody = body;
        }
      }

      outHeaders['Content-Length'] = outBody.length;

      const proxyRes = await sendToDiscord(webhookUrl, outHeaders, outBody);
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    })
    .catch((err) => {
      sendJson(res, 502, { error: err?.message || 'Proxy request failed' });
    });
});

server.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
});
