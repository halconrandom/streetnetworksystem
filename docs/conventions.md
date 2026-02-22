# Conventions

## Structure
- Keep route files in `pages/*` minimal (re-export feature pages).
- Put business/UI logic under `src/features/<feature>`.
- Put cross-feature reusable code in `src/shared/*` only when used by 2+ features.
- Keep legacy/third-party integrations under `src/integrations/*`.
- Keep scripts in `scripts/*` and product/functional docs in `docs/product/*`.

## Imports
- Prefer aliases over deep relative imports:
  - `@/*` -> `src/*` (and compatibility root)
  - `@features/*`
  - `@shared/*`
  - `@integrations/*`
  - `@app/*`

## Migration policy
- Migrate by feature in atomic commits.
- Keep temporary compatibility wrappers only as long as needed.
- Validate each migration with `npm run build` and route smoke tests.

## Safety checks per refactor
1. `npm run build` passes.
2. Critical routes load and function.
3. No runtime hard throws on recoverable API failures.
