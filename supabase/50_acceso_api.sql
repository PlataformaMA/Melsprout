-- Los cursos se identifican por slug desde fuera (Hotmart, n8n).
alter table public.cursos_modulos add column if not exists slug text;
create unique index if not exists cursos_modulos_slug_uniq
  on public.cursos_modulos (slug) where slug is not null;

-- Bitácora de lo que llega del webhook. La transacción es única por evento:
-- si Hotmart reintenta, el segundo aviso no vuelve a hacer nada.
create table if not exists public.accesos_eventos (
  id           uuid primary key default gen_random_uuid(),
  transaccion  text not null,
  evento       text not null,
  curso_slug   text not null,
  email        text not null,
  user_id      uuid references auth.users(id) on delete set null,
  resultado    text not null,            -- aplicado | duplicado | error
  detalle      text,
  payload      jsonb,
  created_at   timestamptz not null default now()
);
create unique index if not exists accesos_eventos_uniq
  on public.accesos_eventos (transaccion, evento);
create index if not exists accesos_eventos_email_idx
  on public.accesos_eventos (email, created_at desc);

alter table public.accesos_eventos enable row level security;
-- Sin políticas: solo la llave de servicio entra. Nadie más lo lee.
