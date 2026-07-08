-- Melsprout · Métricas del perfil + tokens de conexión social
-- Pegar en Supabase → SQL Editor → Run

alter table public.profiles
  add column if not exists metricas jsonb not null default '{}'::jsonb;

create table if not exists public.social_connections (
  user_id      uuid not null references auth.users(id) on delete cascade,
  provider     text not null,
  external_id  text,
  username     text,
  access_token text,
  expires_at   timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.social_connections enable row level security;
-- Sin políticas: solo el service_role (servidor) accede a los tokens.
