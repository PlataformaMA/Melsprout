-- Melsprout · Grupos de la comunidad.
-- Un grupo nace como PROPUESTA. Cuando junta la meta de apoyos (50 por defecto)
-- se activa solo y quienes lo apoyaron entran como sus primeros miembros.

create table if not exists public.grupos (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  descripcion  text not null default '',
  portada      text,
  emoji        text not null default '👥',
  creador_id   uuid not null references auth.users(id) on delete cascade,
  estado       text not null default 'propuesto' check (estado in ('propuesto', 'activo')),
  meta_apoyos  int  not null default 50,
  publico      boolean not null default true,
  created_at   timestamptz not null default now(),
  activado_at  timestamptz
);
create index if not exists grupos_estado_idx on public.grupos (estado, created_at desc);

-- Quién apoyó qué propuesta.
create table if not exists public.grupo_apoyos (
  grupo_id   uuid not null references public.grupos(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (grupo_id, user_id)
);

-- Miembros de un grupo ya activo.
create table if not exists public.grupo_miembros (
  grupo_id   uuid not null references public.grupos(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  rol        text not null default 'miembro' check (rol in ('miembro', 'admin')),
  created_at timestamptz not null default now(),
  primary key (grupo_id, user_id)
);
create index if not exists grupo_miembros_user_idx on public.grupo_miembros (user_id);

-- El muro de cada grupo reusa las publicaciones del foro.
alter table public.foros_posts
  add column if not exists grupo_id uuid references public.grupos(id) on delete cascade;
create index if not exists foros_posts_grupo_idx on public.foros_posts (grupo_id, created_at desc);

alter table public.grupos          enable row level security;
alter table public.grupo_apoyos    enable row level security;
alter table public.grupo_miembros  enable row level security;

drop policy if exists "gr_select" on public.grupos;
create policy "gr_select" on public.grupos for select to authenticated using (true);
drop policy if exists "ga_select" on public.grupo_apoyos;
create policy "ga_select" on public.grupo_apoyos for select to authenticated using (true);
drop policy if exists "ga_insert" on public.grupo_apoyos;
create policy "ga_insert" on public.grupo_apoyos for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ga_delete" on public.grupo_apoyos;
create policy "ga_delete" on public.grupo_apoyos for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "gm_select" on public.grupo_miembros;
create policy "gm_select" on public.grupo_miembros for select to authenticated using (true);
