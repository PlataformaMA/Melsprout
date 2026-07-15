-- Comentarios de la comunidad sobre los retos publicados.
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  reto_user_id uuid not null,                 -- dueño del post (reto publicado)
  reto_id text not null,                       -- reto del post
  autor_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  oculto boolean not null default false,       -- moderación (ocultar sin borrar)
  created_at timestamptz not null default now()
);

create index if not exists comentarios_post_idx on public.comentarios (reto_user_id, reto_id);

alter table public.comentarios enable row level security;

-- Cualquier autenticado ve los comentarios NO ocultos.
drop policy if exists "coment_select" on public.comentarios;
create policy "coment_select" on public.comentarios
  for select using (auth.role() = 'authenticated' and oculto = false);

-- Puede crear comentarios como él mismo.
drop policy if exists "coment_insert" on public.comentarios;
create policy "coment_insert" on public.comentarios
  for insert with check (auth.uid() = autor_id);

-- Puede borrar sus propios comentarios (la moderación admin usa service role).
drop policy if exists "coment_delete_own" on public.comentarios;
create policy "coment_delete_own" on public.comentarios
  for delete using (auth.uid() = autor_id);
