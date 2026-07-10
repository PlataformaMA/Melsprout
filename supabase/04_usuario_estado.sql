-- Melsprout · Usuario (@handle) y Estado/Provincia en el perfil
-- Pegar en Supabase → SQL Editor → New query → Run

alter table public.profiles
  add column if not exists username text,
  add column if not exists estado   text;
