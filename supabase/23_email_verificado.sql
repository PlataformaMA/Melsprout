-- ============================================================
-- Verificación de correo OPCIONAL (marca propia).
-- Los usuarios pueden usar la plataforma sin verificar, pero el
-- ranking (y el diploma, a futuro) se desbloquean solo al verificar.
--
-- Correr en: Supabase (proyecto de producción) → SQL Editor.
-- ============================================================

-- 1) Columna nueva en profiles.
alter table public.profiles
  add column if not exists email_verificado boolean not null default false;

-- 2) Backfill: quien YA tenía el correo confirmado (flujo anterior) queda verificado.
update public.profiles p
set email_verificado = true
from auth.users u
where u.id = p.id
  and u.email_confirmed_at is not null;
