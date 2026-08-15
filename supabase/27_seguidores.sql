-- Melsprout · Seguir a otros creadores (unidireccional, sin solicitudes).

create table if not exists public.seguidores (
  seguidor_id uuid not null references auth.users(id) on delete cascade,  -- quien sigue
  seguido_id  uuid not null references auth.users(id) on delete cascade,  -- a quién sigue
  created_at  timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  -- Nadie se sigue a sí mismo.
  constraint no_autoseguir check (seguidor_id <> seguido_id)
);

create index if not exists seguidores_seguido_idx on public.seguidores (seguido_id);
create index if not exists seguidores_seguidor_idx on public.seguidores (seguidor_id);

alter table public.seguidores enable row level security;

-- Los conteos son públicos entre alumnos: cualquiera ve quién sigue a quién.
drop policy if exists "seg_select" on public.seguidores;
create policy "seg_select" on public.seguidores
  for select to authenticated using (true);

-- Solo puedes crear o borrar TUS propios seguimientos.
drop policy if exists "seg_insert" on public.seguidores;
create policy "seg_insert" on public.seguidores
  for insert to authenticated with check (auth.uid() = seguidor_id);

drop policy if exists "seg_delete" on public.seguidores;
create policy "seg_delete" on public.seguidores
  for delete to authenticated using (auth.uid() = seguidor_id);
