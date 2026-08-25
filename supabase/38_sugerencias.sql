-- Cursos que la comunidad pide en la sección de Cursos Especiales.
create table if not exists public.sugerencias_cursos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  atendida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sugerencias_cursos_idx
  on public.sugerencias_cursos (created_at desc);

alter table public.sugerencias_cursos enable row level security;

drop policy if exists "sug_insert_own" on public.sugerencias_cursos;
create policy "sug_insert_own" on public.sugerencias_cursos
  for insert with check (auth.uid() = user_id);

drop policy if exists "sug_select_own" on public.sugerencias_cursos;
create policy "sug_select_own" on public.sugerencias_cursos
  for select using (auth.uid() = user_id);
