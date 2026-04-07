# StreetNetwork Admin — Plan de Rediseño

## Objetivo
Rediseñar el admin de StreetNetwork aplicando el sistema de diseño **Neobrutalist** de la carpeta `References/` sobre la lógica y APIs reales de `streetnetworkadmin/`. El resultado vive en `streetnetworkadminredesign/`.

## Stack
- **Framework:** Next.js 15 (Pages Router, igual que el sistema actual)
- **Estilos:** Tailwind CSS v4 con utilities neo-* custom
- **Auth:** Clerk (`@clerk/nextjs`)
- **DB:** PostgreSQL via `pg`
- **UI:** Lucide React + Framer Motion
- **State:** Redux Toolkit (donde sea necesario)
- **Notificaciones:** Sonner

## Sistema de Diseño (de References/)
- **Fonts:** Space Grotesk (display/headings) + Inter (body)
- **Base bg:** `#f4f1ea` (cream) / Panel: `#fdfbf7`
- **Accent:** `yellow-300` / **Brand:** `violet-500`
- **Utilities clave:**
  - `neo-panel` → `bg-[#fdfbf7] border-2 border-black shadow-[4px_4px_0px_#000]`
  - `neo-shadow` → `box-shadow: 4px 4px 0px #000`
  - `neo-shadow-sm` → `box-shadow: 2px 2px 0px #000`
  - `neo-btn` → panel + active press effect (translate 4px)
  - `neo-border` → `border-2 border-black`
- **Nav:** Top navigation bar (NO sidebar)
- **Interacción:** botones con press effect (translate + shadow-none on active)

---

## Partes del Plan

### Parte 1 — Scaffold del proyecto ✅
Inicializar `streetnetworkadminredesign/` como proyecto Next.js 15.

**Tareas:**
- [x] `package.json` con todas las dependencias (next 15, tailwind v4, clerk, pg, lucide, framer-motion, sonner, redux toolkit, react-dnd, etc.)
- [x] `next.config.mjs`
- [x] `tsconfig.json`
- [x] `postcss.config.cjs` (para Tailwind v4)
- [x] `.env.example` (mismas vars que el sistema actual)
- [x] `.gitignore`

**Referencia:** `streetnetworkadmin/package.json`, `streetnetworkadmin/next.config.mjs`

---

### Parte 2 — Design System base ✅
Crear el sistema visual que se usa en toda la app.

**Tareas:**
- [x] `styles/globals.css` — Tailwind v4 import + `@theme` con fonts + `@utility` neo-* + custom scrollbar
- [x] `styles/Login.module.css` y `Verify.module.css` (para Clerk, adaptados al tema neo)
- [x] `components/ui/badge.tsx` — Badge con variantes (default, success, danger, warning)
- [x] `components/ui/button.tsx` — Button neo con variantes
- [x] `components/ui/card.tsx` — Card / CardHeader / CardTitle / CardDescription / CardContent
- [x] `components/ui/input.tsx` — Input neo-styled
- [x] `lib/utils.ts` — función `cn()` (clsx + tailwind-merge)

**Referencia:** `References/src/index.css`, `References/src/components/ui/*`, `References/src/lib/utils.ts`

---

### Parte 3 — Layout Shell (TopNav + Layout) ✅
El esqueleto que envuelve todas las páginas.

**Tareas:**
- [x] `components/layout/TopNav.tsx` — Nav adaptado con todas las rutas reales + mobile burger menu
- [x] `components/layout/Layout.tsx` — wrapper con TopNav + `<main>` centrado
- [x] `pages/_app.tsx` — ClerkProvider + Layout global (con noLayout flag para auth) + Sonner Toaster neo-styled
- [x] `pages/_document.tsx` — HTML base con fonts (Space Grotesk + Inter via Google Fonts)

**Referencia:** `References/src/components/layout/*`, `streetnetworkadmin/pages/_app.tsx`

---

### Parte 4 — Auth (Sign In / Sign Up) ✅
Auth local temporal (sin Clerk). Credenciales via variables de entorno.

**Tareas:**
- [x] `middleware.ts` — protege rutas, redirige a /sign-in, devuelve 401 en API routes
- [x] `pages/api/auth/login.ts` — valida ADMIN_USERNAME/ADMIN_PASSWORD, setea cookie httpOnly
- [x] `pages/api/auth/logout.ts` — limpia cookie
- [x] `pages/api/auth/me.ts` — verifica token HMAC y retorna usuario
- [x] `lib/auth-context.tsx` — AuthProvider + useAuth hook
- [x] `pages/sign-in/index.tsx` — form neobrutalist (usuario + contraseña)
- [x] `pages/sign-up/index.tsx` — página de acceso restringido (sin registro)
- [x] `.env.example` actualizado con ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET
- [x] `_app.tsx` actualizado — sin Clerk, usa AuthProvider
- [x] `TopNav.tsx` actualizado — sin Clerk, usa useAuth() + botón logout

---

### Parte 5 — Dashboard (Control Center) ✅
Página principal del admin.

**Tareas:**
- [x] `lib/db.ts` — portado sin cambios (pool pg + query/queryOne/execute + types)
- [x] `lib/auth-server.ts` — reemplaza getOrCreateUserByClerkId + isAdmin con cookie HMAC
- [x] `pages/index.tsx` — Dashboard completo: bienvenida, 4 stat cards, 8 quick access modules, actividad reciente
- [x] `pages/api/admin/stats.ts` — portado, reemplaza Clerk auth por isAuthenticated()

**Referencia:** `References/src/pages/ControlCenter.tsx`, `streetnetworkadmin/pages/dashboard.tsx`

---

### Parte 6 — Tickets ✅
Módulo de soporte/tickets, el más central del sistema.

**Tareas:**
- [ ] `pages/tickets/index.tsx` — lista de tickets con filtros (status, prioridad, búsqueda)
- [ ] `pages/tickets/[id].tsx` — detalle del ticket:
  - Conversación (mensajes del usuario + respuestas admin)
  - Metadata lateral (status, prioridad, usuario, fecha)
  - ActionToolbar (cambiar status, asignar, etc.)
  - Input de respuesta
  - Tab de notas internas
- [ ] `components/Conversation.tsx` — portar y rediseñar
- [ ] `components/TicketMetadata.tsx` — portar y rediseñar
- [ ] `components/ActionToolbar.tsx` — portar y rediseñar
- [ ] `pages/api/tickets/index.ts` — portar sin cambios
- [ ] `pages/api/tickets/[id]/index.ts` — portar sin cambios
- [ ] `pages/api/tickets/[id]/messages.ts` — portar sin cambios
- [ ] `pages/api/tickets/[id]/notes.ts` — portar sin cambios

**Referencia:** `streetnetworkadmin/components/*`, `streetnetworkadmin/pages/tickets/*`

---

### Parte 7 — Message Builder ⏭️ SKIPPED (MVP)
Editor de mensajes/templates con soporte drag & drop.

**Tareas:**
- [ ] `pages/message-builder/[[...slug]].tsx` — página wrapper
- [ ] `components/Builder/BuilderUI.tsx` — portar y rediseñar el builder
- [ ] `pages/api/message-builder/templates.ts` — portar sin cambios
- [ ] `pages/api/message-builder/mentions.ts` — portar sin cambios
- [ ] `pages/api/message-builder/webhooks.ts` — portar sin cambios

**Referencia:** `streetnetworkadmin/components/Builder/`, `streetnetworkadmin/pages/message-builder/`

---

### Parte 8 — Screenshot Editor (Forge) ⏭️ SKIPPED (MVP)
Editor visual de imágenes/screenshots.

**Tareas:**
- [ ] `pages/screenshot-editor/index.tsx` — portar y rediseñar
- [ ] `pages/api/screenshot-editor/load-points/index.ts` — portar sin cambios
- [ ] `pages/api/screenshot-editor/load-points/[id].ts` — portar sin cambios
- [ ] `pages/api/screenshot-editor/submit-review.ts` — portar sin cambios

**Referencia:** `References/src/pages/ScreenshotEditor.tsx`, `streetnetworkadmin/pages/api/screenshot-editor/*`

---

### Parte 9 — Nexus ✅
Módulo de notas/conocimiento interno.

**Tareas:**
- [ ] `pages/nexus.tsx` — rediseñar
- [ ] `pages/api/nexus/index.ts` — portar sin cambios

**Referencia:** `streetnetworkadmin/pages/nexus.tsx`

---

### Parte 10 — Vault ✅
Gestión de assets y clientes.

**Tareas:**
- [ ] `pages/vault.tsx` — rediseñar con tabs (Assets / Clients)
- [ ] `pages/api/vault/assets.ts` — portar sin cambios
- [ ] `pages/api/vault/clients.ts` — portar sin cambios

**Referencia:** `streetnetworkadmin/pages/vault.tsx`

---

### Parte 11 — Users ✅
Gestión de usuarios del sistema.

**Tareas:**
- [ ] `pages/users.tsx` — tabla de usuarios con acciones
- [ ] `pages/api/users/index.ts` — portar sin cambios
- [ ] `pages/api/users/[id].ts` — portar sin cambios
- [ ] `pages/api/users/[id]/flags.ts` — portar sin cambios
- [ ] `pages/api/users/me.ts` — portar sin cambios
- [ ] `pages/api/admin/users.ts` — portar sin cambios

**Referencia:** `streetnetworkadmin/pages/users.tsx`

---

### Parte 12 — Audit ✅
Log de actividad del sistema.

**Tareas:**
- [ ] `pages/audit.tsx` — tabla de eventos con filtros
- [ ] `pages/api/admin/audit.ts` — portar sin cambios

**Referencia:** `streetnetworkadmin/pages/audit.tsx`

---

### Parte 13 — Settings ✅
Configuración de la plataforma.

**Tareas:**
- [ ] `pages/settings.tsx` — rediseñar con secciones

**Referencia:** `streetnetworkadmin/pages/settings.tsx`

---

### Parte 14 — Review Channels y Live Updates ⬜
Features adicionales del sistema.

**Tareas:**
- [ ] `pages/api/review-channels/index.ts` — portar sin cambios
- [ ] `pages/api/review-channels/[id].ts` — portar sin cambios
- [ ] `pages/api/live-updates/index.ts` — portar sin cambios
- [ ] `pages/api/admin/live-updates.ts` — portar sin cambios
- [ ] `pages/api/admin/live-updates/[id].ts` — portar sin cambios

---

### Parte 15 — DB, Clerk Sync y Utils ⬜
Infraestructura compartida.

**Tareas:**
- [ ] `lib/db.ts` — portar sin cambios (conexión pg)
- [ ] `lib/clerk-sync.ts` — portar sin cambios
- [ ] `lib/builder.ts` — portar sin cambios
- [ ] `pages/api/webhooks/clerk.ts` — portar sin cambios
- [ ] `pages/api/debug/clerk-user.ts` — portar sin cambios
- [ ] `pages/api/admin/[id].ts` — portar sin cambios

---

### Parte 16 — Polish final ⬜
- [ ] Animaciones con Framer Motion (page transitions, panel entrances)
- [ ] Responsive mobile (burger menu para TopNav)
- [ ] Estados vacíos (empty states) con estilo neo
- [ ] Estados de carga (skeletons neo-styled)
- [ ] `pages/404.tsx` — not found page neo
- [ ] Revisión de consistencia visual en todos los módulos

---

## Orden de ejecución recomendado
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

## Notas
- Las APIs se portan **sin cambios** de lógica — solo se mueven de carpeta.
- Solo los archivos de UI (pages y components) reciben el nuevo diseño.
- `lib/db.ts` y `lib/clerk-sync.ts` se copian tal cual.
- Variables de entorno: mismas que `streetnetworkadmin/.env.example`.
