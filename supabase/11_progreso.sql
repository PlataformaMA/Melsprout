-- Progreso real de clases por usuario (motor de progreso).
create table if not exists public.clase_progreso (
  user_id uuid not null references auth.users(id) on delete cascade,
  clase_id text not null,
  segundos_vistos int not null default 0,      -- memoria de posición
  completada boolean not null default false,   -- vio el 85% o marcó manual
  xp_dado boolean not null default false,      -- para dar +100 XP una sola vez
  completada_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, clase_id)
);

alter table public.clase_progreso enable row level security;

drop policy if exists "prog_select_own" on public.clase_progreso;
create policy "prog_select_own" on public.clase_progreso
  for select using (auth.uid() = user_id);

drop policy if exists "prog_insert_own" on public.clase_progreso;
create policy "prog_insert_own" on public.clase_progreso
  for insert with check (auth.uid() = user_id);

drop policy if exists "prog_update_own" on public.clase_progreso;
create policy "prog_update_own" on public.clase_progreso
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
