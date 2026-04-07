import type { NextApiRequest, NextApiResponse } from 'next';

type Auth0SessionUser = {
  sub?: string;
  email?: string;
  name?: string;
  nickname?: string;
  [key: string]: unknown;
};

function hasAuth0Env(): boolean {
  return Boolean(
    process.env.AUTH0_SECRET &&
      process.env.AUTH0_BASE_URL &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
  );
}

function getAuth0Sdk(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@auth0/nextjs-auth0');
  } catch {
    return null;
  }
}

export function isAuth0Enabled(): boolean {
  return hasAuth0Env() && Boolean(getAuth0Sdk());
}

export async function getAuth0SessionUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Auth0SessionUser | null> {
  if (!isAuth0Enabled()) return null;
  const sdk = getAuth0Sdk();
  if (!sdk?.getSession) return null;

  const session = await sdk.getSession(req, res);
  return session?.user ?? null;
}

export async function auth0Login(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const sdk = getAuth0Sdk();
  if (!sdk?.handleLogin) {
    res.status(503).json({ error: 'Auth0 SDK no disponible' });
    return;
  }
  return sdk.handleLogin(req, res, {
    returnTo: typeof req.query.returnTo === 'string' ? req.query.returnTo : '/',
  });
}

export async function auth0Logout(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const sdk = getAuth0Sdk();
  if (!sdk?.handleLogout) {
    res.status(503).json({ error: 'Auth0 SDK no disponible' });
    return;
  }
  return sdk.handleLogout(req, res, {
    returnTo: '/sign-in',
  });
}

export async function auth0Callback(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const sdk = getAuth0Sdk();
  if (!sdk?.handleCallback) {
    res.status(503).json({ error: 'Auth0 SDK no disponible' });
    return;
  }
  return sdk.handleCallback(req, res, {
    redirectUri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
  });
}

