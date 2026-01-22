alter table public.sn_users
  add column if not exists is_verified boolean not null default false;

create index if not exists sn_users_verified_idx on public.sn_users(is_verified);
