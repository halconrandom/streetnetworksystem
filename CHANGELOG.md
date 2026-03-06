# Street Network Admin - Historial de Actualizaciones

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