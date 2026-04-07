# Guía de configuración — PostgreSQL en VPS

## Requisitos
- VPS con Ubuntu 20.04+ / Debian 11+
- Acceso SSH con sudo
- Puerto 5432 libre (o configurar acceso remoto)

---

## 1. Instalar PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

Verificar que está corriendo:
```bash
sudo systemctl status postgresql
# Debería decir: active (running)
```

---

## 2. Crear el usuario y la base de datos

```bash
# Entrar como postgres
sudo -i -u postgres psql
```

Dentro de psql, ejecutar:
```sql
-- Crear usuario (cambia la contraseña)
CREATE USER snadmin WITH PASSWORD 'tu_contraseña_segura';

-- Crear la base de datos
CREATE DATABASE streetnetwork OWNER snamin;

-- Dar todos los privilegios
GRANT ALL PRIVILEGES ON DATABASE streetnetwork TO snamin;

-- Salir
\q
```

---

## 3. Ejecutar las migraciones

Conectarse a la DB como el nuevo usuario:
```bash
psql -U snamin -d streetnetwork -h localhost
# Ingresa la contraseña cuando te lo pida
```

O en una sola línea:
```bash
psql "postgresql://snamin:tu_contraseña_segura@localhost:5432/streetnetwork"
```

### Migración 1 — Schema completo

Copiar y pegar el siguiente bloque en psql:

```sql
-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE,
  email text NOT NULL UNIQUE,
  name text,
  role text NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT true,
  discord_id text UNIQUE,
  discord_username text,
  discord_avatar text,
  discord_review_channel_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sn_users_clerk_id   ON public.sn_users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_sn_users_email       ON public.sn_users(email);
CREATE INDEX IF NOT EXISTS idx_sn_users_discord_id  ON public.sn_users(discord_id);

-- ============================================
-- USER FLAGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_user_flags (
  user_id uuid NOT NULL REFERENCES public.sn_users(id) ON DELETE CASCADE,
  flag text NOT NULL,
  granted_by uuid REFERENCES public.sn_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flag)
);

CREATE INDEX IF NOT EXISTS sn_user_flags_flag_idx ON public.sn_user_flags(flag);

-- ============================================
-- SESSIONS (legacy)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.sn_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  ip text,
  user_agent text
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_audit_logs (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES public.sn_users(id),
  action text NOT NULL,
  target_user_id uuid REFERENCES public.sn_users(id),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS sn_audit_logs_actor_idx ON public.sn_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS sn_audit_logs_created_idx ON public.sn_audit_logs(created_at DESC);

-- ============================================
-- TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number serial,
  user_id uuid REFERENCES public.sn_users(id),
  thread_id text,
  category text,
  status text,
  claimed_by uuid REFERENCES public.sn_users(id),
  claimed_by_name text,
  closed_by uuid REFERENCES public.sn_users(id),
  closed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opened_by_name text,
  full_name text,
  contact_preference text,
  active_project_name text,
  bug_reported text,
  support_needed text,
  project_description text,
  project_budget text,
  inquiry_description text,
  transcript_code text,
  resolution text
);

CREATE INDEX IF NOT EXISTS sn_tickets_status_idx     ON public.sn_tickets(status);
CREATE INDEX IF NOT EXISTS sn_tickets_created_at_idx ON public.sn_tickets(created_at DESC);

-- ============================================
-- TICKET MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.sn_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.sn_users(id),
  user_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sn_ticket_messages_ticket_idx ON public.sn_ticket_messages(ticket_id);

-- ============================================
-- NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_notes (
  ticket_id uuid NOT NULL REFERENCES public.sn_tickets(id) ON DELETE CASCADE,
  note_number serial,
  author_id uuid REFERENCES public.sn_users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (ticket_id, note_number)
);

-- ============================================
-- NEXUS STATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_nexus_states (
  user_id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- VAULT
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_vault_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL,
  identifier text,
  owner_id uuid REFERENCES public.sn_users(id),
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sn_vault_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  tier text DEFAULT 'standard',
  metadata jsonb DEFAULT '{}',
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_interaction timestamptz
);

-- ============================================
-- MESSAGE BUILDER
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_messagebuilder_webhook_targets (
  id serial PRIMARY KEY,
  name text NOT NULL,
  value text NOT NULL,
  kind text NOT NULL DEFAULT 'webhook',
  is_thread_enabled boolean DEFAULT false,
  thread_id text,
  clerk_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sn_messagebuilder_templates (
  id serial PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  clerk_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sn_messagebuilder_mentions (
  id serial PRIMARY KEY,
  keyword text NOT NULL UNIQUE,
  kind text NOT NULL,
  target_id text NOT NULL,
  display_name text,
  clerk_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- SCREENSHOT EDITOR
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_seditorLoadPoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.sn_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_data_url text NOT NULL,
  state_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sn_screenshot_review_config (
  guild_id text PRIMARY KEY,
  review_role_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- LIVE UPDATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_live_updates (
  id serial PRIMARY KEY,
  type text NOT NULL,
  message text NOT NULL,
  description text,
  date timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- REVIEW CHANNELS
-- ============================================
CREATE TABLE IF NOT EXISTS public.sn_review_channels (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.sn_users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  channel_id varchar(20) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_channels_user_id ON public.sn_review_channels(user_id);
```

Verificar que las tablas se crearon:
```sql
\dt public.sn_*
```

Deberías ver 15+ tablas listadas.

---

## 4. Configurar acceso remoto (si la app corre fuera del VPS)

> Si la app Next.js corre **en el mismo VPS**, sáltate este paso y usa `localhost`.

### 4a. Editar postgresql.conf

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Buscar y cambiar:
```
listen_addresses = '*'
```

### 4b. Editar pg_hba.conf

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Agregar al final (reemplaza `TU_IP` con la IP de tu servidor de app):
```
host    streetnetwork    snamin    TU_IP/32    scram-sha-256
```

O para permitir cualquier IP (menos seguro, solo para desarrollo):
```
host    streetnetwork    snamin    0.0.0.0/0    scram-sha-256
```

### 4c. Reiniciar PostgreSQL

```bash
sudo systemctl restart postgresql
```

### 4d. Abrir el puerto en el firewall

```bash
sudo ufw allow 5432/tcp
sudo ufw reload
```

---

## 5. Construir la DATABASE_URL

El formato es:
```
postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/DATABASE
```

**Si la app está en el mismo VPS:**
```
postgresql://snamin:tu_contraseña_segura@localhost:5432/streetnetwork
```

**Si la app está en otro servidor:**
```
postgresql://snamin:tu_contraseña_segura@IP_DEL_VPS:5432/streetnetwork
```

---

## 6. Configurar .env.local

En la carpeta `streetnetworkadminredesign/`, crear el archivo `.env.local`:

```env
# Auth local
ADMIN_USERNAME=admin
ADMIN_PASSWORD=una_contraseña_segura
SESSION_SECRET=un_string_largo_y_aleatorio_aqui

# Base de datos
DATABASE_URL=postgresql://snamin:tu_contraseña_segura@localhost:5432/streetnetwork

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Nunca** subas `.env.local` al repositorio. Ya está en `.gitignore`.

---

## 7. Verificar la conexión

```bash
# Desde el servidor o tu máquina local
psql "postgresql://snamin:tu_contraseña_segura@HOST:5432/streetnetwork" -c "\dt public.sn_*"
```

Si ves la lista de tablas, todo está correcto.

---

## 8. Levantar la app

```bash
cd streetnetworkadminredesign
npm run dev
```

Abrir `http://localhost:3000` — debería redirigir a `/sign-in`.

---

## Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no corre o puerto incorrecto | `sudo systemctl start postgresql` |
| `password authentication failed` | Contraseña incorrecta en DATABASE_URL | Verificar usuario/contraseña con `psql -U postgres` |
| `database "streetnetwork" does not exist` | DB no creada | Volver al paso 2 |
| `relation "sn_users" does not exist` | Migraciones no ejecutadas | Volver al paso 3 |
| `Connection refused` desde remoto | Firewall o `listen_addresses` | Verificar pasos 4a–4d |
