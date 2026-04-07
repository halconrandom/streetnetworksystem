# Clerk Setup (Redesign)

Configura estas variables en `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxx
```

Opcionales recomendadas para redirects:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Checklist:

1. Crea la app en Clerk y habilita el método de login que usarás.
2. Agrega `http://localhost:3000` como dominio permitido en Clerk.
3. Reinicia `npm run dev` después de cambiar el `.env.local`.
4. Abre `/sign-in` y valida sesión.

