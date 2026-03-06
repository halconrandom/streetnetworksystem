# Changelog - 6 de Marzo, 2026

## Message Builder - Aislamiento de Datos por Usuario

### Problema
Las tablas `sn_messagebuilder_webhook_targets`, `sn_messagebuilder_templates` y `sn_messagebuilder_mentions` no tenían columna `user_id`, permitiendo que cualquier usuario viera los datos de otros usuarios.

### Solución

#### 1. Migración SQL
- Creada `migrations/002_message_builder_user_id.sql`
- Añadida columna `user_id uuid references sn_users(id)` a las 3 tablas
- Creados índices para mejorar performance de consultas

#### 2. Cambios en API Endpoints

**webhooks.ts:**
- GET: filtra por `user_id = $1 OR user_id IS NULL`
- POST: inserta con `user_id` del usuario autenticado
- DELETE: solo permite eliminar si `user_id` coincide

**templates.ts:**
- GET: filtra por `user_id = $1 OR user_id IS NULL`
- POST: inserta con `user_id` del usuario autenticado
- DELETE: solo permite eliminar si `user_id` coincide

**mentions.ts:**
- GET: filtra por `user_id = $1 OR user_id IS NULL`
- POST: inserta con `user_id` del usuario autenticado
- DELETE: solo permite eliminar si `user_id` coincide

### Comportamiento
- Cada usuario solo ve sus propios datos
- Los datos existentes con `user_id IS NULL` son visibles para todos (datos globales legacy)
- No se pueden eliminar datos de otros usuarios

### Archivos Modificados
- `migrations/002_message_builder_user_id.sql` (nuevo)
- `pages/api/message-builder/webhooks.ts`
- `pages/api/message-builder/templates.ts`
- `pages/api/message-builder/mentions.ts`

### Despliegue
Ejecutar la migración en la base de datos:
```sql
\i migrations/002_message_builder_user_id.sql
```