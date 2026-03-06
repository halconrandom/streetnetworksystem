# Clerk Migration - Pending Fixes

## Tasks

- [x] 1. Add Clerk auth to `pages/api/tickets/[id]/index.ts`
- [x] 2. Add Clerk auth to `pages/api/tickets/[id]/messages.ts`
- [x] 3. Add Clerk auth to `pages/api/tickets/[id]/notes.ts`
- [x] 4. Extend `pages/api/users/me.ts` GET to return full DB user profile (discord data, name, email, role)
- [x] 5. Fix `src/features/settings/components/SettingsForm.tsx`:
  - [x] 5a. Use `useUser()` + `useClerk()` hooks instead of `/api/auth/me`
  - [x] 5b. Fix review channel URL: `/api/users/me/review-channel` -> `/api/users/me`
  - [x] 5c. Remove Discord OAuth linking button (`/api/auth/discord` never existed)
  - [x] 5d. Fix `handleSubmit()` -> use Clerk's `user.update()` for name; remove email/password fields
  - [x] 5e. Fix logout button -> wire `useClerk().signOut()`
  - [x] 5f. Fix avatar -> use `user.imageUrl` from Clerk
- [x] 6. Fix `src/features/admin/components/AdminPanelView.tsx`:
  - [x] 6a. Replace both `router.replace('/login')` with `router.replace('/sign-in')` (old route `/login` does not exist)
- [x] 7. Fix `pages/_app.tsx`:
  - [x] 7a. Add `signInUrl="/sign-in"` and `signUpUrl="/sign-up"` to `<ClerkProvider>` to prevent infinite redirect loop
- [x] 8. Replace broken `sessionClaims.__clerk_user` pattern with `getOrCreateUserByClerkId(req)` in all remaining API routes:
  - [x] 8a. `pages/api/nexus/index.ts`
  - [x] 8b. `pages/api/vault/assets.ts`
  - [x] 8c. `pages/api/vault/clients.ts`
  - [x] 8d. `pages/api/screenshot-editor/submit-review.ts`
  - [x] 8e. `pages/api/screenshot-editor/load-points/index.ts`
  - [x] 8f. `pages/api/screenshot-editor/load-points/[id].ts`
  - [x] 8g. `pages/api/message-builder/webhooks.ts`
  - [x] 8h. `pages/api/message-builder/templates.ts`
  - [x] 8i. `pages/api/message-builder/mentions.ts`
  - [x] 8j. `pages/api/audit/index.ts`

## ✅ Migration Complete
All API routes now use `getOrCreateUserByClerkId(req)` from `lib/clerk-sync.ts`.
Zero remaining `sessionClaims.__clerk_user` or stale `getAuth(req)` patterns in `pages/api/`.
