/**
 * Clerk Authentication Middleware for Express
 * Verifica JWT tokens de Clerk y carga el usuario desde la DB
 */

import { createClerkClient, verifyToken } from '@clerk/backend';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

// Cliente de Clerk para operaciones adicionales
let clerkClient = null;

if (CLERK_SECRET_KEY) {
  clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
}

/**
 * Middleware que verifica el token JWT de Clerk
 * y carga el usuario desde la base de datos
 */
export async function clerkAuthMiddleware(req, res, next) {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization || '';
    
    if (!authHeader.startsWith('Bearer ')) {
      // Si no hay token, continuar sin usuario (algunos endpoints son públicos)
      req.clerkUser = null;
      req.dbUser = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!CLERK_SECRET_KEY) {
      console.warn('[CLERK_AUTH] CLERK_SECRET_KEY not configured');
      req.clerkUser = null;
      req.dbUser = null;
      return next();
    }

    // Verificar el token con Clerk
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      req.clerkUser = null;
      req.dbUser = null;
      return next();
    }

    // payload.sub es el clerk_user_id
    req.clerkUserId = payload.sub;
    req.clerkSessionId = payload.sid;

    return next();
  } catch (err) {
    console.error('[CLERK_AUTH] Token verification failed:', err.message);
    req.clerkUser = null;
    req.dbUser = null;
    return next();
  }
}

/**
 * Middleware que requiere autenticación de Clerk
 * Carga el usuario desde la DB basándose en clerk_id
 */
export function requireClerkAuth(pool) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
      }

      const token = authHeader.substring(7);

      if (!CLERK_SECRET_KEY) {
        console.error('[CLERK_AUTH] CLERK_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Authentication not configured' });
      }

      // Verificar el token
      const payload = await verifyToken(token, {
        secretKey: CLERK_SECRET_KEY,
      });

      if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      const clerkUserId = payload.sub;

      // Buscar usuario en la DB por clerk_id
      const result = await pool.query(
        `SELECT u.id, u.clerk_id, u.email, u.name, u.role, u.is_active, u.is_verified,
                u.discord_id, u.discord_username, u.discord_avatar
         FROM public.sn_users u
         WHERE u.clerk_id = $1`,
        [clerkUserId]
      );

      if (!result.rowCount) {
        return res.status(401).json({ error: 'Unauthorized - User not found in database' });
      }

      const dbUser = result.rows[0];

      if (!dbUser.is_active) {
        return res.status(403).json({ error: 'User account is disabled' });
      }

      // Cargar flags del usuario
      const flagsResult = await pool.query(
        `SELECT flag FROM public.sn_user_flags WHERE user_id = $1 ORDER BY flag ASC`,
        [dbUser.id]
      );

      const flags = flagsResult.rows.map(r => r.flag);

      // Adjuntar usuario al request
      req.dbUser = {
        ...dbUser,
        flags,
      };
      req.clerkUserId = clerkUserId;
      req.clerkSessionId = payload.sid;

      return next();
    } catch (err) {
      console.error('[CLERK_AUTH] Auth middleware error:', err);
      return res.status(401).json({ error: 'Unauthorized - Token verification failed' });
    }
  };
}

/**
 * Middleware que requiere un flag específico
 */
export function requireClerkFlag(pool, flag) {
  return async (req, res, next) => {
    // Primero verificar autenticación
    const authMiddleware = requireClerkAuth(pool);
    
    return authMiddleware(req, res, async (err) => {
      if (err) return next(err);

      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.dbUser.flags.includes(flag)) {
        console.warn(`[CLERK_AUTH] Missing flag '${flag}' for user ${req.dbUser.email}`);
        return res.status(403).json({ error: `Missing required permission: ${flag}` });
      }

      return next();
    });
  };
}

/**
 * Middleware que requiere rol de admin
 */
export function requireClerkAdmin(pool) {
  return async (req, res, next) => {
    const authMiddleware = requireClerkAuth(pool);
    
    return authMiddleware(req, res, async (err) => {
      if (err) return next(err);

      if (!req.dbUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }

      return next();
    });
  };
}

export { clerkClient };
