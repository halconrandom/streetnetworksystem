# Auth0 Setup (Redesign)

Configura estas variables en tu `.env.local`:

```env
AUTH0_SECRET=replace-with-32-byte-random-hex
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_TENANT.us.auth0.com
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

En Auth0, configura:

1. Allowed Callback URLs:
`http://localhost:3000/api/auth/callback`
2. Allowed Logout URLs:
`http://localhost:3000/sign-in`
3. Allowed Web Origins:
`http://localhost:3000`

Notas:

- Si Auth0 no está configurado, el proyecto mantiene fallback de login local para no bloquear desarrollo.
- Durante la migración, el backend usa el usuario admin de DB como fallback seguro (UUID válido), nunca el string `"admin"` como `user_id`.

