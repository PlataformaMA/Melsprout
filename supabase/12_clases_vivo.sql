-- Clases en vivo (transmisiones) gestionadas desde el panel admin.
create table if not exists public.clases_vivo (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text default '',
  categoria text default '',
  instructor text default '',
  inicia_at timestamptz not null,
  duracion_min int not null default 60,
  thumbnail_url text,
  stream_url text,           -- enlace de la transmisión en vivo (Zoom/YouTube/Meet)
  grabacion_url text,        -- enlace de la grabación (cuando termina)
  xp int not null default 50,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.clases_vivo enable row level security;
drop policy if exists "vivo_select" on public.clases_vivo;
create policy "vivo_select" on public.clases_vivo
  for select using (auth.role() = 'authenticated');

-- Asistencias (para dar +50 XP una sola vez por clase).
create table if not exists public.asistencias_vivo (
  user_id uuid not null references auth.users(id) on delete cascade,
  clase_vivo_id uuid not null references public.clases_vivo(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clase_vivo_id)
);
alter table public.asistencias_vivo enable row level security;
drop policy if exists "asist_select_own" on public.asistencias_vivo;
create policy "asist_select_own" on public.asistencias_vivo
  for select using (auth.uid() = user_id);
