# Street Network Admin - Historial de Actualizaciones

## [2026-03-06] - Fix API y Textarea Expandible

### Fixes

#### API Live Updates
- **Nuevo endpoint**: `PUT /api/admin/live-updates/[id]` para actualizar entradas existentes
- **Nuevo endpoint**: `DELETE /api/admin/live-updates/[id]` para eliminar entradas
- Corregido error "Not Found" al guardar cambios en actualizaciones existentes

#### UI Mejoras
- **Textarea expandible**: Botón para expandir/contraer el área de descripción
- **Resize vertical**: El textarea ahora permite redimensionar verticalmente
- **Altura dinámica**: Alterna entre 16rem y 32rem con el botón

---

## [2026-03-06] - Markdown Renderer Mejorado

### Mejoras

#### MarkdownRenderer Actualizado
- **Headers**: Soporte para `#`, `##`, `###` con estilos diferenciados
- **Código inline**: Soporte para `` `code` `` con fondo y color
- **Horizontal rules**: Soporte para `---` y `***`
- **Mejor espaciado**: Ajustes en márgenes y padding

#### Formato Soportado
```markdown
# Título grande
## Título medio
### Título pequeño

**bold** *italic* `code`

- Lista item 1
- Lista item 2

1. Numerado 1
2. Numerado 2

---
```

---

## [2026-03-06] - Live Update Manager con Discord Components V2

### Nuevas Funcionalidades

#### Refactor Live Update Manager
- **Discord Components V2**: Formato nativo de Discord para mensajes
- **Vista previa en tiempo real**: Panel lateral muestra cómo se verá en Discord
- **Botón "Copiar JSON"**: Exporta el mensaje listo para enviar a Discord
- **Colores por categoría**: feat (verde), fix (rojo), security (naranja), refactor (azul)

#### Archivos Nuevos
- `src/features/home/components/discord-components.ts` - Tipos y helpers para Discord V2

#### Formato Discord V2
- Container con accent_color (color del borde)
- Text Display components para contenido
- Separator components para divisores
- Flags: IS_COMPONENTS_V2 (32768)

### Ejemplo de JSON generado
```json
{
  "flags": 32768,
  "components": [{
    "type": 17,
    "accent_color": 16744192,
    "components": [
      { "type": 10, "content": "## ✨ Título\n📅 2026-03-06" },
      { "type": 12, "divider": true, "spacing": 1 },
      { "type": 10, "content": "Contenido..." }
    ]
  }]
}
```

---

## [2026-03-06] - i18n System for Screenshot Editor

### Nuevas Funcionalidades

#### Sistema de Internacionalización (i18n)
- **Selector de idioma**: Botones EN/ES con banderas en el TopBar
- **Persistencia**: El idioma seleccionado se guarda en localStorage
- **Traducciones completas**: Inglés y Español para todo el Screenshot Editor
- **Contexto React**: `I18nProvider` y `useI18n` hook para acceso a traducciones

#### Traducciones Incluidas
- TopBar: botones, estados, mensajes
- Review Channel Selector: gestión de canales
- Unified Sidebar: tabs, secciones, labels
- Herramientas: Move, Censor, Comic Maker
- Mensajes de estado: errores, confirmaciones

### Cambios Técnicos

#### Archivos Nuevos
- `src/features/screenshot-editor/i18n/translations.ts` - Diccionario de traducciones
- `src/features/screenshot-editor/i18n/context.tsx` - Contexto React para i18n
- `src/features/screenshot-editor/components/LanguageSelector.tsx` - Componente selector

#### Archivos Modificados
- `src/features/screenshot-editor/page.tsx` - Wrapper con I18nProvider
- `src/features/screenshot-editor/editor/TopBar.tsx` - Integración del selector

---

## [2026-03-06] - Premium Features System

### Nuevas Funcionalidades

#### Sistema de Flags Premium
- **Flags premium**: Nuevas flags para funcionalidades especiales que requieren activación manual por admin
- **Review Channels (`review_channels`)**: Gestión de canales de revisión de Discord
- **Comic Maker (`comic_maker`)**: Herramienta de creación de cómics
- **Cache Drafts (`cache_drafts`)**: Guardar borradores en cache
- **Indicador visual**: Candado sobre botones deshabilitados con tooltip "Premium feature - Donate to unlock"

#### Panel de Admin
- **Flags premium diferenciadas**: Las flags premium muestran badge "Premium" en el panel de usuarios
- **Activación individual**: El admin puede activar cada flag por usuario

### Cambios Técnicos

#### Archivos Modificados
- `src/features/admin/components/AdminPanelView.tsx` - Añadidas flags premium con indicador
- `src/features/screenshot-editor/page.tsx` - Pasa flags al componente
- `src/features/screenshot-editor/components/ScreenshotEditorView.tsx` - Condicionaliza funcionalidades
- `src/features/screenshot-editor/editor/TopBar.tsx` - Botones con candado para features premium
- `src/features/screenshot-editor/editor/UnifiedSidebar.tsx` - Comic Maker condicional

---

## [2026-03-06] - Review Channels System

### Nuevas Funcionalidades

#### Sistema de Múltiples Canales de Revisión
- **Gestión de canales**: Los usuarios pueden crear, editar y eliminar múltiples canales de revisión de Discord
- **Selector en Screenshot Editor**: Dropdown en el TopBar para seleccionar el canal antes de enviar
- **Etiquetas personalizadas**: Cada canal tiene un nombre/etiqueta para identificarlo fácilmente
- **Validación de Channel ID**: Solo se aceptan IDs válidos de Discord (17-20 dígitos)
- **Persistencia en DB**: Los canales se guardan en la nueva tabla `sn_review_channels`

#### API de Review Channels
- **GET /api/review-channels**: Lista todos los canales del usuario
- **POST /api/review-channels**: Crea un nuevo canal
- **PUT /api/review-channels/[id]**: Actualiza un canal existente
- **DELETE /api/review-channels/[id]**: Elimina un canal

### Correcciones de Bugs

#### Screenshot Editor
- **Error de fetch corregido**: Las llamadas a API ahora usan rutas locales `/api/...` en lugar de `API_BASE_URL` externo
- **Eliminada variable no usada**: Removido `API_BASE_URL` que causaba errores de conexión

### Cambios Técnicos

#### Archivos Nuevos
- `pages/api/review-channels/index.ts` - API para listar y crear canales
- `pages/api/review-channels/[id].ts` - API para actualizar y eliminar canales
- `src/features/screenshot-editor/components/ReviewChannelSelector.tsx` - Componente de selector de canales
- `migrations/add_review_channels_table.sql` - Migración para crear la tabla

#### Archivos Modificados
- `src/features/screenshot-editor/editor/hooks/useEditorState.ts` - Corregidas URLs de API
- `src/features/screenshot-editor/editor/TopBar.tsx` - Integrado selector de canales
- `src/features/screenshot-editor/components/ScreenshotEditorView.tsx` - Estado del canal seleccionado
- `pages/api/screenshot-editor/submit-review.ts` - Usa channelId del body en lugar de DB

---

## [2026-03-05] - Settings & Avatar System

### Nuevas Funcionalidades

#### Sistema de Avatar con Prioridad
- **Avatar personalizado desde Imgur**: Los usuarios pueden establecer un avatar personalizado mediante enlace de Imgur
- **Prioridad de avatar**: `avatar_url` (custom) > `discord_avatar` > Clerk default
- **Validación de dominio**: Solo se aceptan enlaces de `imgur.com` o `i.imgur.com`
- **Conversión automática**: Los enlaces de página de Imgur se convierten automáticamente a enlaces directos de imagen
- **Preview en tiempo real**: Vista previa del avatar antes de guardar
- **Restaurar avatar de Discord**: Opción para eliminar el avatar personalizado y volver al de Discord

#### Settings en Header
- **Botón de settings en avatar**: El avatar del header ahora es un botón que redirige a `/settings`
- **Tooltip animado**: Al hacer hover muestra "Settings" con animación
- **Indicador visual**: Punto rojo en el avatar cuando hay un avatar personalizado
- **Actualización en tiempo real**: El avatar del header se actualiza automáticamente tras cambiarlo en settings

#### Portal de Seguridad de Clerk
- **Sección simplificada**: Una sola sección "Portal de Seguridad" con botón prominente
- **Gestión centralizada**: Contraseña, 2FA, sesiones y dispositivos se gestionan desde Clerk
- **Botón "Abrir Portal de Seguridad"**: Abre el modal de Clerk directamente

### Mejoras de UI/UX

#### Localización Bloqueada
- **Selectores deshabilitados**: Los selectores de idioma y zona horaria muestran badge "En Desarrollo"
- **Overlay visual**: Badge amber sobre los selectores bloqueados

#### Sidebar Simplificado
- **Eliminado "User Settings"**: Quitado del menú lateral, ahora solo está en el header
- **Logout directo**: El botón de logout ahora está más accesible

### Correcciones de Bugs

#### API Users
- **Parámetros PostgreSQL**: Corregido el uso de parámetros `$N` en lugar de interpolación directa en queries SQL
- **Campo avatar_url**: Añadido soporte para el campo `avatar_url` en la tabla `sn_users`

#### API Auth
- **Campo avatarUrl**: Añadido `avatarUrl` a la respuesta de `/api/auth/me` para consistencia

### Cambios Técnicos

#### Archivos Modificados
- `src/features/settings/components/AvatarUpload.tsx` - Reescrito para soportar Imgur
- `src/features/settings/components/SettingsForm.tsx` - Integración con nuevo sistema de avatar y Clerk
- `src/core/AppShell.tsx` - Avatar en header con prioridad y evento de actualización
- `src/core/Sidebar.tsx` - Eliminado enlace a settings
- `pages/api/users/me.ts` - Soporte para `avatar_url` en PUT
- `pages/api/auth/me.ts` - Añadido `avatarUrl` en respuesta
- `lib/db.ts` - Añadido campo `avatar_url` a interfaz `DBUser`

#### Nuevas Funcionalidades
- Evento `user-avatar-updated` para comunicación entre componentes
- Sistema de refresh automático de datos de usuario en AppShell
- Integración con `openUserProfile()` de Clerk para gestión de seguridad

---

## Notas para Despliegue

1. **Migración de Base de Datos**: Ejecutar antes de desplegar:
   ```sql
   ALTER TABLE sn_users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;
   ```

2. **Commits de esta sesión**:
   - `b9f52ee` - feat(settings): bloquear selectores de idioma y zona horaria
   - `4d24d09` - feat(settings): cambiar avatar a input de enlace Imgur
   - `f7d5eb4` - feat(settings): sistema de avatar con prioridad custom > Discord
   - `589dd0b` - fix(api): corregir parámetros PostgreSQL en PUT /users/me
   - `30936ab` - feat(ui): mover settings al avatar del header
   - `44f2fd6` - fix: actualizar avatar en header tras cambio en settings
   - `e23f47b` - docs: añadir CHANGELOG.md con historial de actualizaciones
   - `e48bf07` - feat(settings): integrar portal de seguridad de Clerk
   - `3a8a016` - docs: actualizar CHANGELOG con integración de Clerk
   - `dd65425` - refactor(settings): simplificar sección de seguridad
   - `6733976` - refactor(settings): eliminar sección de apariencia