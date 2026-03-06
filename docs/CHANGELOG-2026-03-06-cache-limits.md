# Changelog - 6 de Marzo, 2026

## Screenshot Editor - Cache Saves

### Cambios en el Backend
- **Límite de cache saves**: Los usuarios ahora tienen un límite de 20 cache saves
- **Flag `premium_access`**: Nueva flag para usuarios con cache ilimitado
  - Usuarios con `premium_access` pueden guardar infinitos caches
  - Usuarios sin `premium_access` están limitados a 20 caches
- **Error 403**: Cuando un usuario alcanza el límite, el backend devuelve un error 403 con mensaje descriptivo en lugar de eliminar automáticamente el cache más antiguo

### Cambios en el Frontend
- **Admin Panel**: Añadida la flag `Premium Access` en la lista de flags disponibles
- **Screenshot Editor**: Manejo del error 403 con mensaje al usuario indicando que alcanzó el límite

### Archivos Modificados
- `pages/api/screenshot-editor/load-points/index.ts`
  - Verificación de flag `premium_access`
  - Rechazo con error 403 cuando se alcanza el límite
  - Respuesta GET incluye información del límite y count actual

- `src/features/admin/components/AdminPanelView.tsx`
  - Añadida flag `premium_access` a la lista de flags

- `src/features/screenshot-editor/editor/hooks/useEditorState.ts`
  - Manejo del error 403 con alert al usuario

### Comportamiento
1. Usuario sin `cache_drafts`: No puede usar el botón de cache (bloqueado)
2. Usuario con `cache_drafts` pero sin `premium_access`: Límite de 20 caches
3. Usuario con `premium_access`: Cache ilimitado

### Migración de Base de Datos
No se requiere migración. La tabla `sn_user_flags` ya soporta cualquier flag string.