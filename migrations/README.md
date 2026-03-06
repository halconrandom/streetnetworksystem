# Database Migrations

Este directorio contiene las migraciones SQL para la base de datos PostgreSQL.

## Orden de ejecución

Ejecutar en orden numérico:

1. `001_auth.sql` - Tablas de usuarios y sesiones
2. `002_user_verification.sql` - Verificación de usuarios
3. `003_nexus.sql` - Tablas de Nexus
4. `004_vault.sql` - Tablas de Vault
5. `005_screenshot_editor.sql` - Tablas del editor de screenshots
6. `006_live_updates.sql` - Tablas de actualizaciones en vivo
7. `007_screenshot_review.sql` - Tablas de revisión de screenshots
8. `008_clerk_discord_sync.sql` - Sincronización con Clerk y Discord

## Ejecución

Conectar a la base de datos y ejecutar:

```bash
psql -h <host> -U <user> -d <database> -f migrations/001_auth.sql
psql -h <host> -U <user> -d <database> -f migrations/002_user_verification.sql
# ... etc
```

O usando una herramienta como pgAdmin o DBeaver.

## Notas

- Las migraciones son idempotentes (pueden ejecutarse múltiples veces)
- `clerk_id` es el identificador principal para usuarios de Clerk
- `discord_id`, `discord_username`, `discord_avatar` almacenan datos de Discord OAuth