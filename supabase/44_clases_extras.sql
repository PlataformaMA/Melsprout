-- Calificación de una clase por la alumna (una por persona y clase).
create table if not exists public.clase_calificaciones (
  clase_id   uuid not null references public.cursos_clases(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  estrellas  smallint not null check (estrellas between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (clase_id, user_id)
);
alter table public.clase_calificaciones enable row level security;
drop policy if exists "cal_select" on public.clase_calificaciones;
create policy "cal_select" on public.clase_calificaciones
  for select using (auth.role() = 'authenticated');
drop policy if exists "cal_write_own" on public.clase_calificaciones;
create policy "cal_write_own" on public.clase_calificaciones
  for insert with check (auth.uid() = user_id);
drop policy if exists "cal_update_own" on public.clase_calificaciones;
create policy "cal_update_own" on public.clase_calificaciones
  for update using (auth.uid() = user_id);

-- Comentarios de una clase (distintos a los de los retos).
create table if not exists public.clase_comentarios (
  id         uuid primary key default gen_random_uuid(),
  clase_id   uuid not null references public.cursos_clases(id) on delete cascade,
  autor_id   uuid not null references auth.users(id) on delete cascade,
  texto      text not null,
  responde_a uuid references public.clase_comentarios(id) on delete cascade,
  oculto     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists clase_comentarios_idx
  on public.clase_comentarios (clase_id, created_at desc);
alter table public.clase_comentarios enable row level security;
drop policy if exists "cc_select" on public.clase_comentarios;
create policy "cc_select" on public.clase_comentarios
  for select using (auth.role() = 'authenticated' and oculto = false);
drop policy if exists "cc_insert_own" on public.clase_comentarios;
create policy "cc_insert_own" on public.clase_comentarios
  for insert with check (auth.uid() = autor_id);

-- Publicación programada: la clase se abre sola en esa fecha.
alter table public.cursos_clases
  add column if not exists publicar_at timestamptz;
