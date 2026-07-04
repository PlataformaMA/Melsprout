-- Melsprout · Campos extra del perfil (media kit)
-- Pegar en Supabase → SQL Editor → Run

alter table public.profiles
  add column if not exists cover_url      text,
  add column if not exists headline       text,
  add column if not exists bio            text,
  add column if not exists ciudad         text,
  add column if not exists especialidades jsonb not null default '[]'::jsonb,
  add column if not exists abierto_colab  boolean not null default true;

-- La columna "redes" (jsonb) ya existe: ahí guardamos
--   { "instagram": "...", "tiktok": "...", "youtube": "..." }
