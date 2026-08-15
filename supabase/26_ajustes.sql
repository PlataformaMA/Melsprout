-- Melsprout · Género, racha congelada, instrucciones de retos y notificaciones.

-- ————— 1. Género (solo para cómo le habla Octi) —————
alter table public.profiles
  add column if not exists genero text
  check (genero in ('femenino','masculino','neutro'));

-- ————— 2. Racha congelada —————
-- Cuando el alumno termina TODO lo disponible, la racha se suspende en vez de
-- romperse: no puede seguir avanzando porque no hay más clases que ver.
alter table public.profiles
  add column if not exists racha_congelada boolean not null default false;

-- ————— 3. Instrucciones del reto —————
-- Contexto y lineamientos para que el alumno sepa qué se espera de él, y el
-- equipo que revisa pueda medir contra algo concreto.
alter table public.cursos_clases
  add column if not exists reto_instrucciones text not null default '';

-- ————— 4. Notificaciones —————
create table if not exists public.notificaciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tipo       text not null default 'general'
             check (tipo in ('general','reto','comentario','like','racha','nivel','clase')),
  titulo     text not null,
  cuerpo     text not null default '',
  href       text,                                   -- a dónde lleva al tocarla
  leida      boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx
  on public.notificaciones (user_id, leida, created_at desc);

alter table public.notificaciones enable row level security;

drop policy if exists "notif_select_own" on public.notificaciones;
create policy "notif_select_own" on public.notificaciones
  for select to authenticated using (auth.uid() = user_id);

-- Solo puede marcar como leídas las suyas; el contenido lo escribe el servidor.
drop policy if exists "notif_update_own" on public.notificaciones;
create policy "notif_update_own" on public.notificaciones
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ————— 5. Likes en comentarios y respuestas anidadas —————
create table if not exists public.comentario_likes (
  comentario_id uuid not null references public.comentarios(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  primary key (comentario_id, user_id)
);
alter table public.comentario_likes enable row level security;

drop policy if exists "cl_select" on public.comentario_likes;
create policy "cl_select" on public.comentario_likes
  for select to authenticated using (true);
drop policy if exists "cl_insert" on public.comentario_likes;
create policy "cl_insert" on public.comentario_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "cl_delete" on public.comentario_likes;
create policy "cl_delete" on public.comentario_likes
  for delete to authenticated using (auth.uid() = user_id);

-- Responder a un comentario: la respuesta es otro comentario que apunta al padre.
alter table public.comentarios
  add column if not exists responde_a uuid references public.comentarios(id) on delete cascade;
create index if not exists comentarios_responde_idx on public.comentarios (responde_a);

-- Lo mismo para los likes de las respuestas del foro.
create table if not exists public.foros_respuesta_likes (
  respuesta_id uuid not null references public.foros_respuestas(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  primary key (respuesta_id, user_id)
);
alter table public.foros_respuesta_likes enable row level security;
drop policy if exists "frl_select" on public.foros_respuesta_likes;
create policy "frl_select" on public.foros_respuesta_likes
  for select to authenticated using (true);
drop policy if exists "frl_insert" on public.foros_respuesta_likes;
create policy "frl_insert" on public.foros_respuesta_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "frl_delete" on public.foros_respuesta_likes;
create policy "frl_delete" on public.foros_respuesta_likes
  for delete to authenticated using (auth.uid() = user_id);
