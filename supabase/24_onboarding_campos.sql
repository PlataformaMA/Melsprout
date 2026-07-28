-- ============================================================
-- Onboarding: campos nuevos (experiencia, tiempo, habilidades, cómo conoció).
-- Correr en: Supabase (proyecto de producción) → SQL Editor.
-- ============================================================

alter table public.profiles
  add column if not exists experiencia    text,
  add column if not exists tiempo_semanal text,
  add column if not exists habilidades    jsonb not null default '[]'::jsonb,
  add column if not exists como_conocio   text;
