# Clerk + Discord OAuth Refactor

## Tasks

- [x] 1. `lib/db.ts` — Add `clerk_id` to `DBUser` interface
- [x] 2. `src/core/AppShell.tsx` — Fetch flags/role from `/api/auth/me` (DB source of truth)
- [x] 3. `pages/sign-in/[[...index]].tsx` — Discord-only OAuth redirect page
- [x] 4. `pages/sign-up/[[...index]].tsx` — Redirect to sign-in
- [x] 5. `lib/clerk-sync.ts` — Add Discord account validation + improved extraction
- [x] 6. `pages/api/audit/index.ts` — Add `audit_logs` flag check
- [x] 7. `pages/api/webhooks/clerk.ts` — Full rewrite with Clerk v6 Discord data extraction
- [x] 8. `middleware.ts` — API routes now return 401 JSON instead of redirecting to /sign-in; `pg` installed

## ✅ Refactor Complete

### Architecture Summary

**Auth flow (Discord-only):**
1. User visits any protected route → Clerk middleware redirects to `/sign-in`
2. `/sign-in` auto-triggers `authenticateWithRedirect({ strategy: 'oauth_discord' })`
3. User authenticates with Discord on Discord's OAuth page
4. Clerk redirects back to `/sign-in/sso-callback` → Clerk completes the handshake
5. Clerk fires `user.created` webhook → `pages/api/webhooks/clerk.ts` creates the user in `sn_users` with Discord data + default flags
6. User is redirected to `/` (home)

**Flags/role flow:**
- Flags live in `sn_user_flags` DB table (source of truth)
- Role lives in `sn_users.role` DB column
- `AppShell` fetches `/api/auth/me` on every authenticated page load → gets DB flags/role
- Sidebar items are filtered by DB flags
- Route protection uses DB flags (not Clerk publicMetadata)

**Clerk Dashboard requirements:**
- Enable Discord OAuth provider
- Disable all other auth methods (email/password, Google, etc.)
- Set webhook endpoint: `https://your-domain/api/webhooks/clerk`
- Subscribe to: `user.created`, `user.updated`, `user.deleted`
- Set `CLERK_WEBHOOK_SECRET` env var

**Environment variables required:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
