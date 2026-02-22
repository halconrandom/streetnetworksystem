# StreetNetworkAdmin Architecture (Current)

## Runtime
- Primary web runtime: **Next.js (Pages Router)**
- API service: `streetnetwork-api` (Express)

## App layout
- `pages/*`: thin route wrappers for Next pages router.
- `src/core/*`: app shell and primary layout/navigation primitives.
- `src/features/*`: feature modules (page + components).
- `src/integrations/*`: external/legacy integrations encapsulated.
- `src/shared/*`: shared ui/hooks/lib/types/constants/styles.

## Feature modules
- `dashboard`
- `tickets`
- `transcript`
- `message-builder`
- `screenshot-editor`
- `audit`
- `users`
- `vault`
- `nexus`
- `auth/login`
- `auth/verify`

## Integrations
- `src/integrations/builder-legacy/*` wraps legacy message-builder runtime under `src/features/message-builder/legacy/*`.
- `src/integrations/components-sdk/*` contains the in-repo SDK source consumed by the builder.

## Notes
- Build pipeline is validated with `npm run build`.
- Legacy root Vite entry files were removed; Next.js is the active web runtime.
