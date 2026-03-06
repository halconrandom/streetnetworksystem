# Changelog - 6 de Marzo, 2026

## Permisos de Usuario

### Cambios en Flags por Defecto
- **Antes:** Nuevos usuarios recibían flag `dashboard` automáticamente
- **Ahora:** Nuevos usuarios reciben solo flag `screenshot_editor`
- **Control Center (home `/`)**: Accesible sin flags para todos los usuarios autenticados
- **Dashboard, Nexus, etc.**: Requieren asignación manual por administrador

### Archivos Modificados
- `lib/clerk-sync.ts` - Flags default para usuarios registrados vía Discord OAuth
- `pages/api/webhooks/clerk.ts` - Flags default para usuarios creados vía Clerk webhook

### Comportamiento de Redirección
- Usuarios sin `dashboard` son redirigidos automáticamente a la primera ruta disponible
- Si solo tienen `screenshot_editor`, serán redirigidos a `/screenshot-editor`
- Control Center (`/`) no requiere flags

---

## Screenshot Editor - Cache Saves

### Límite de Cache
- **Límite:** 20 cache saves por usuario
- **Premium Access:** Usuarios con flag `premium_access` tienen cache ilimitado
- **Error 403:** Cuando se alcanza el límite, se muestra mensaje al usuario

### Archivos Modificados
- `pages/api/screenshot-editor/load-points/index.ts`
  - Verificación de flag `premium_access`
  - Límite de body aumentado a 10MB
  - Rechazo con error 403 cuando se alcanza el límite

- `src/features/admin/components/AdminPanelView.tsx`
  - Añadida flag `Premium Access` en Admin Panel

- `src/features/screenshot-editor/editor/hooks/useEditorState.ts`
  - Manejo del error 403 con alert al usuario

---

## Nginx - Corrección de API Routes

### Problema
- Nginx enviaba `/api/*` al puerto 8788 (backend inexistente)
- Las API routes de Next.js se sirven en el mismo puerto que el frontend (3005)

### Solución
- Eliminadas las referencias al backend separado
- Todas las rutas `/api/*` ahora van al puerto 3005 (Next.js)
- Solo `/api/discord` y `/api/webhook` van al proxy Discord (8787)

### Archivos Modificados
- `nginx.conf` - Configuración corregida
- `deploy-sn.sh` - Removido `BACKEND_PORT` innecesario