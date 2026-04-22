-- ============================================
-- StreetNetwork Admin — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================
-- USERS
-- ============================================
create table if not exists public.sn_users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique,
  email text not null unique,
  name text,
  role text not null default 'user',
  is_active boolean not null default true,
  is_verified boolean not null default true,
  discord_id text unique,
  discord_username text,
  discord_avatar text,
  discord_review_channel_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists idx_sn_users_clerk_id on public.sn_users(clerk_id);
create index if not exists idx_sn_users_email on public.sn_users(email);
create index if not exists idx_sn_users_discord_id on public.sn_users(discord_id);

-- ============================================
-- USER FLAGS
-- ============================================
create table if not exists public.sn_user_flags (
  user_id uuid not null references public.sn_users(id) on delete cascade,
  flag text not null,
  granted_by uuid references public.sn_users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, flag)
);

create index if not exists sn_user_flags_flag_idx on public.sn_user_flags(flag);

-- ============================================
-- SESSIONS
-- ============================================
create table if not exists public.sn_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.sn_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  ip text,
  user_agent text
);

create index if not exists sn_sessions_token_hash_idx on public.sn_sessions(token_hash);
create index if not exists sn_sessions_expires_at_idx on public.sn_sessions(expires_at);

-- ============================================
-- AUDIT LOGS
-- ============================================
create table if not exists public.sn_audit_logs (
  id bigserial primary key,
  actor_user_id uuid references public.sn_users(id),
  action text not null,
  target_user_id uuid references public.sn_users(id),
  metadata jsonb,
  created_at timestamptz not null default now(),
  ip text,
  user_agent text
);

create index if not exists sn_audit_logs_actor_idx on public.sn_audit_logs(actor_user_id);

-- ============================================
-- TICKETS
-- ============================================
create table if not exists public.sn_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number serial,
  user_id uuid references public.sn_users(id),
  thread_id text,
  category text,
  status text,
  claimed_by uuid references public.sn_users(id),
  claimed_by_name text,
  closed_by uuid references public.sn_users(id),
  closed_by_name text,
  created_at timestamptz not null default now(),
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

-- ============================================
-- TICKET MESSAGES
-- ============================================
create table if not exists public.sn_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.sn_tickets(id) on delete cascade,
  user_id uuid references public.sn_users(id),
  user_name text,
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- NOTES
-- ============================================
create table if not exists public.sn_notes (
  ticket_id uuid not null references public.sn_tickets(id) on delete cascade,
  note_number serial,
  author_id uuid references public.sn_users(id),
  content text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (ticket_id, note_number)
);

-- ============================================
-- NEXUS STATES
-- ============================================
create table if not exists public.sn_nexus_states (
  user_id uuid primary key references public.sn_users(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- VAULT
-- ============================================
create table if not exists public.sn_vault_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  identifier text,
  owner_id uuid references public.sn_users(id),
  status text default 'active',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sn_vault_clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  tier text default 'standard',
  metadata jsonb default '{}',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_interaction timestamptz
);

-- ============================================
-- SCREENSHOT EDITOR
-- ============================================
create table if not exists public.sn_seditorLoadPoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.sn_users(id) on delete cascade,
  name text not null,
  image_data_url text not null,
  state_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- SCREENSHOT REVIEW CONFIG
-- ============================================
create table if not exists public.sn_screenshot_review_config (
  guild_id text primary key,
  review_role_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- MESSAGE BUILDER
-- ============================================
create table if not exists public.sn_messagebuilder_webhook_targets (
  id serial primary key,
  name text not null,
  value text not null,
  kind text not null default 'webhook',
  is_thread_enabled boolean default false,
  thread_id text,
  clerk_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messagebuilder_webhooks_clerk_id on public.sn_messagebuilder_webhook_targets(clerk_id);

create table if not exists public.sn_messagebuilder_templates (
  id serial primary key,
  name text not null,
  data jsonb not null,
  clerk_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messagebuilder_templates_clerk_id on public.sn_messagebuilder_templates(clerk_id);

create table if not exists public.sn_messagebuilder_mentions (
  id serial primary key,
  keyword text not null unique,
  kind text not null,
  target_id text not null,
  display_name text,
  clerk_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messagebuilder_mentions_clerk_id on public.sn_messagebuilder_mentions(clerk_id);

-- ============================================
-- LIVE UPDATES
-- ============================================
create table if not exists public.sn_live_updates (
  id serial primary key,
  type text not null,
  message text not null,
  description text,
  date timestamptz not null default now(),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- REVIEW CHANNELS
-- ============================================
create table if not exists public.sn_review_channels (
  id serial primary key,
  user_id uuid not null references public.sn_users(id) on delete cascade,
  name varchar(100) not null,
  channel_id varchar(20) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_channels_user_id on public.sn_review_channels(user_id);
