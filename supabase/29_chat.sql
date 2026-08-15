-- Melsprout · Chat de felicitaciones entre creadores que se siguen MUTUAMENTE.
-- Solo stickers de un catálogo cerrado: no hay texto libre, así que no hace
-- falta moderación ni reportes.

create table if not exists public.chat_mensajes (
  id         uuid primary key default gen_random_uuid(),
  de_id      uuid not null references auth.users(id) on delete cascade,
  para_id    uuid not null references auth.users(id) on delete cascade,
  sticker    text not null,                    -- clave del catálogo (ver stickers.ts)
  leido      boolean not null default false,
  created_at timestamptz not null default now(),
  constraint no_automensaje check (de_id <> para_id)
);

create index if not exists chat_par_idx on public.chat_mensajes (de_id, para_id, created_at desc);
create index if not exists chat_no_leidos_idx on public.chat_mensajes (para_id, leido);

alter table public.chat_mensajes enable row level security;

-- Solo ves los mensajes en los que participas.
drop policy if exists "chat_select" on public.chat_mensajes;
create policy "chat_select" on public.chat_mensajes
  for select to authenticated
  using (auth.uid() = de_id or auth.uid() = para_id);

-- El envío pasa por el servidor, que valida el seguimiento mutuo y el sticker.
drop policy if exists "chat_update_leido" on public.chat_mensajes;
create policy "chat_update_leido" on public.chat_mensajes
  for update to authenticated
  using (auth.uid() = para_id) with check (auth.uid() = para_id);

-- Presencia: se refresca mientras la persona tiene la app abierta.
-- "En línea" = actividad en los últimos 2 minutos.
alter table public.profiles
  add column if not exists ultima_actividad timestamptz;
