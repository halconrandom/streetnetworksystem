create extension if not exists "pgcrypto";

create table if not exists public.sn_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  discord_id text unique,
  role text not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.sn_user_flags (
  user_id uuid not null references public.sn_users(id) on delete cascade,
  flag text not null,
  granted_by uuid references public.sn_users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, flag)
);

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

create index if not exists sn_sessions_token_hash_idx on public.sn_sessions(token_hash);
create index if not exists sn_sessions_expires_at_idx on public.sn_sessions(expires_at);
create index if not exists sn_user_flags_flag_idx on public.sn_user_flags(flag);
create index if not exists sn_audit_logs_actor_idx on public.sn_audit_logs(actor_user_id);
