# Changelog - 6 de Marzo, 2026

## Resumen de Cambios

---

## Branding

### Título y Favicon
- **Título del tab:** `Street Network Solutions`
- **Favicon:** Actualizado al nuevo logo (`https://i.imgur.com/jJgEFWS.png`)
- **Logo del sidebar:** Actualizado al mismo logo para consistencia

---

## UI - Live Update Manager

### Mejoras en el Modal
- **Modal más amplio:** De `max-w-6xl` a `max-w-[1340px]` para mejor visualización
- **Panel de preview más ancho:** De `w-80` a `w-[420px]` para mostrar contenido completo
- **Textarea optimizado:** Altura reducida de `h-48` a `h-40` para mejor balance
- **Espaciado compacto:** Mejor legibilidad en la vista previa de Discord

### Parser Markdown Mejorado
- **Librería:** Instalado `react-markdown` para parsing completo de markdown
- **Textarea:** Tamaño de fuente aumentado de `text-xs` a `text-sm` para mejor legibilidad
- **Soporte completo para:**
  - `#` → H1 (bold, tamaño grande)
  - `##` → H2 (bold, tamaño medio)
  - `###` → H3 (semibold, tamaño pequeño)
  - `**bold**` → texto en negrita
  - `*italic*` → texto en itálica verde
  - `- item` → lista con bullet verde
  - `` `code` `` → código con fondo
  - `> quote` → blockquote con borde

---

## Permisos de Usuario

### Flags por Defecto
- **Antes:** Nuevos usuarios recibían flag `dashboard` automáticamente
- **Ahora:** Nuevos usuarios reciben solo flag `screenshot_editor`
- **Control Center (home `/`)**: Accesible sin flags para todos los usuarios autenticados
- **Dashboard, Nexus, etc.**: Requieren asignación manual por administrador

---

## Message Builder - Aislamiento de Datos por Usuario

### Problema
Las tablas `sn_messagebuilder_webhook_targets`, `sn_messagebuilder_templates` y `sn_messagebuilder_mentions` no tenían columna de identificación de usuario, permitiendo que cualquier usuario viera los datos de otros usuarios.

### Solución

#### 1. Migración SQL
- Creada `migrations/002_message_builder_user_id.sql`
- Añadida columna `clerk_id TEXT` a las 3 tablas
- Creados índices para mejorar performance de consultas

#### 2. Cambios en API Endpoints

**webhooks.ts, templates.ts, mentions.ts:**
- GET: filtra por `clerk_id = $1 OR clerk_id IS NULL`
- POST: inserta con `clerk_id` del usuario autenticado
- DELETE: permite eliminar si `clerk_id` coincide O si es `NULL` (registros legacy)

#### 3. Validaciones
- Error 500 si `user.clerk_id` es null
- Logs de debug para identificar problemas

### Comportamiento
- Cada usuario solo ve sus propios datos
- Los datos existentes con `clerk_id IS NULL` son visibles para todos (datos globales legacy)
- Cualquier usuario puede eliminar registros legacy

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

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `pages/_document.tsx` | Título y favicon |
| `src/core/Sidebar.tsx` | Logo del sidebar |
| `src/features/home/components/LiveUpdateManager.tsx` | UI del modal, parser markdown |
| `lib/clerk-sync.ts` | Flags default, COALESCE en UPDATE |
| `migrations/002_message_builder_user_id.sql` | Columna clerk_id |
| `pages/api/message-builder/webhooks.ts` | Filtrado por clerk_id |
| `pages/api/message-builder/templates.ts` | Filtrado por clerk_id |
| `pages/api/message-builder/mentions.ts` | Filtrado por clerk_id |
| `pages/api/screenshot-editor/load-points/index.ts` | Límite de cache |
| `nginx.conf` | Corrección de API routes |
| `package.json` | Añadida dependencia react-markdown |

---

## Despliegue

1. Ejecutar migración en la base de datos:
```sql
\i migrations/002_message_builder_user_id.sql
```

2. Deploy en servidor:
```bash
./deploy-sn.sh
```

3. Verificar que el rebuild incluya los cambios de `clerk_id` en los INSERTs