-- ================================================================
-- MELSPROUT — Esquema completo (correr 1 vez en el proyecto NUEVO)
-- Generado a partir de supabase/01..21 en orden.
-- ================================================================


-- ===================== 01_profiles.sql =====================
-- ============================================================
-- Melsprout · Tabla de perfiles (perfil + progreso del usuario)
-- Pegar en Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) La tabla
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,

  -- Datos de perfil (onboarding · Módulos 01, 02, 11)
  full_name            text,
  avatar_url           text,
  pais                 text,
  fecha_nacimiento     date,
  whatsapp             text,
  whatsapp_optin       boolean not null default false,

  nicho                text check (nicho in ('Moda','Salud','Belleza','Tech','Lifestyle')),
  objetivo             text,
  plataforma_principal text,
  tamano_audiencia     text,
  redes                jsonb not null default '{}'::jsonb,

  -- Estado del onboarding
  onboarding_completo  boolean not null default false,

  -- Progreso / gamificación (Módulo 08)
  etapa                text not null default 'starter',
  xp                   integer not null default 0,
  gemas                integer not null default 0,
  racha                integer not null default 0,
  racha_fecha          date,

  -- Analítica (Módulo 01/14)
  canal_origen         text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 2) Seguridad a nivel fila: cada quien SOLO ve y edita su propio perfil
alter table public.profiles enable row level security;

drop policy if exists "perfil_ver_propio" on public.profiles;
create policy "perfil_ver_propio"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "perfil_editar_propio" on public.profiles;
create policy "perfil_editar_propio"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3) Crear el perfil AUTOMÁTICAMENTE cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Mantener updated_at al día
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 5) Crear el perfil para usuarios que YA existían (por si acaso)
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data->>'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;


-- ===================== 02_perfil_extra.sql =====================
-- Melsprout · Campos extra del perfil (media kit)
-- Pegar en Supabase → SQL Editor → Run

alter table public.profiles
  add column if not exists cover_url      text,
  add column if not exists headline       text,
  add column if not exists bio            text,
  add column if not exists ciudad         text,
  add column if not exists especialidades jsonb not null default '[]'::jsonb,
  add column if not exists abierto_colab  boolean not null default true;

-- La columna "redes" (jsonb) ya existe: ahí guardamos
--   { "instagram": "...", "tiktok": "...", "youtube": "..." }


-- ===================== 03_metricas.sql =====================
-- Melsprout · Métricas del perfil + tokens de conexión social
-- Pegar en Supabase → SQL Editor → Run

alter table public.profiles
  add column if not exists metricas jsonb not null default '{}'::jsonb;

create table if not exists public.social_connections (
  user_id      uuid not null references auth.users(id) on delete cascade,
  provider     text not null,
  external_id  text,
  username     text,
  access_token text,
  expires_at   timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.social_connections enable row level security;
-- Sin políticas: solo el service_role (servidor) accede a los tokens.


-- ===================== 04_usuario_estado.sql =====================
-- Melsprout · Usuario (@handle) y Estado/Provincia en el perfil
-- Pegar en Supabase → SQL Editor → New query → Run

alter table public.profiles
  add column if not exists username text,
  add column if not exists estado   text;


-- ===================== 05_retos.sql =====================
-- Respuestas de los usuarios a los retos (borrador o publicado).
create table if not exists public.reto_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  reto_id text not null,
  respuestas jsonb not null default '{}'::jsonb,
  archivo_url text,
  estado text not null default 'borrador' check (estado in ('borrador','publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, reto_id)
);

alter table public.reto_submissions enable row level security;

-- Cada usuario solo ve y edita SUS retos.
drop policy if exists "reto_select_own" on public.reto_submissions;
create policy "reto_select_own" on public.reto_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "reto_insert_own" on public.reto_submissions;
create policy "reto_insert_own" on public.reto_submissions
  for insert with check (auth.uid() = user_id);

drop policy if exists "reto_update_own" on public.reto_submissions;
create policy "reto_update_own" on public.reto_submissions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ===================== 06_retos_admin.sql =====================
-- Catálogo de retos creados desde el panel admin (vive en BD, no en código).
create table if not exists public.retos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'semanal' check (tipo in ('curso','semanal','grupal','personal')),
  clase_id text,               -- para tipo 'curso' (liga a una clase de data.ts)
  titulo text not null,
  emoji text default '🎯',
  descripcion text default '',
  intro text default '',
  accion text default 'compartirlo',
  xp int not null default 50,
  pasos jsonb not null default '[]'::jsonb,   -- [{id,titulo,subtitulo,tipo,placeholder,max,acepta,ayudaArchivo,archivoImagen,octi}]
  tips jsonb,                                 -- {titulo, items:[]}
  sobre jsonb,                                -- ["...","..."]
  ejemplo jsonb,                              -- {autor,rol,tituloCard,bloques:[]}
  consejo text default '',
  activo boolean not null default true,
  orden int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retos enable row level security;

-- Cualquier usuario autenticado puede LEER los retos activos.
-- Las escrituras las hace el panel admin con la service role (bypassa RLS),
-- previa verificación del correo admin en el servidor.
drop policy if exists "retos_select" on public.retos;
create policy "retos_select" on public.retos
  for select using (auth.role() = 'authenticated');


-- ===================== 07_admin_flag.sql =====================
-- Permite marcar usuarios como admin desde el panel (además de ADMIN_EMAILS).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;


-- ===================== 08_retos_storage.sql =====================
-- Permisos del bucket "retos" (videos e imágenes de los retos).
-- Lectura pública (el bucket es público) y subida para usuarios autenticados.

drop policy if exists "retos_subir" on storage.objects;
create policy "retos_subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'retos');

drop policy if exists "retos_actualizar" on storage.objects;
create policy "retos_actualizar" on storage.objects
  for update to authenticated
  using (bucket_id = 'retos');

drop policy if exists "retos_leer" on storage.objects;
create policy "retos_leer" on storage.objects
  for select using (bucket_id = 'retos');


-- ===================== 09_revision.sql =====================
-- Estado de revisión del equipo para los retos que la requieren.
alter table public.reto_submissions
  add column if not exists revision text not null default 'pendiente'
  check (revision in ('pendiente','aprobado','rechazado'));


-- ===================== 10_comentarios.sql =====================
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


-- ===================== 11_progreso.sql =====================
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


-- ===================== 12_clases_vivo.sql =====================
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


-- ===================== 13_foros.sql =====================
-- Foros de la comunidad: publicaciones por categoría, con likes y respuestas.
create table if not exists public.foros_posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'General',
  texto text not null,
  imagen_url text,
  video_url text,
  enlace_url text,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists foros_posts_cat_idx on public.foros_posts (categoria, created_at desc);
alter table public.foros_posts enable row level security;
drop policy if exists "fp_select" on public.foros_posts;
create policy "fp_select" on public.foros_posts for select using (auth.role() = 'authenticated' and oculto = false);
drop policy if exists "fp_insert" on public.foros_posts;
create policy "fp_insert" on public.foros_posts for insert with check (auth.uid() = autor_id);

create table if not exists public.foros_likes (
  post_id uuid not null references public.foros_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.foros_likes enable row level security;
drop policy if exists "fl_select" on public.foros_likes;
create policy "fl_select" on public.foros_likes for select using (auth.role() = 'authenticated');
drop policy if exists "fl_insert" on public.foros_likes;
create policy "fl_insert" on public.foros_likes for insert with check (auth.uid() = user_id);
drop policy if exists "fl_delete" on public.foros_likes;
create policy "fl_delete" on public.foros_likes for delete using (auth.uid() = user_id);

create table if not exists public.foros_respuestas (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.foros_posts(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.foros_respuestas enable row level security;
drop policy if exists "fr_select" on public.foros_respuestas;
create policy "fr_select" on public.foros_respuestas for select using (auth.role() = 'authenticated' and oculto = false);
drop policy if exists "fr_insert" on public.foros_respuestas;
create policy "fr_insert" on public.foros_respuestas for insert with check (auth.uid() = autor_id);


-- ===================== 14_clase_videos.sql =====================
-- Video de cada clase (gestionado desde el panel admin).
create table if not exists public.clase_videos (
  clase_id text primary key,
  video_url text,
  updated_at timestamptz not null default now()
);
alter table public.clase_videos enable row level security;
drop policy if exists "cv_select" on public.clase_videos;
create policy "cv_select" on public.clase_videos
  for select using (auth.role() = 'authenticated');
-- Las escrituras las hace el admin con service role (verificado en el servidor).


-- ===================== 15_cursos.sql =====================
-- Módulos y clases gestionados desde el panel admin (currículum real).
create table if not exists public.cursos_modulos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text default '',
  color text default 'accent',              -- green | accent | amber
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cursos_clases (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.cursos_modulos(id) on delete cascade,
  titulo text not null,
  instructor text default 'Melissa',
  duracion_min int not null default 12,
  nivel text default 'basico',              -- basico | intermedio | avanzado
  video_url text,
  reto_texto text default '',
  revision text default 'auto',             -- auto | equipo
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cursos_modulos enable row level security;
alter table public.cursos_clases enable row level security;
drop policy if exists "cm_select" on public.cursos_modulos;
create policy "cm_select" on public.cursos_modulos for select using (auth.role() = 'authenticated');
drop policy if exists "cc_select" on public.cursos_clases;
create policy "cc_select" on public.cursos_clases for select using (auth.role() = 'authenticated');
-- Escrituras: admin con service role (verificado en el servidor).

-- ===== SEMBRADO del currículum BYI =====
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Básicos del Marketing Digital','Fundamentos para empezar con estrategia.','green',1);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Define tu audiencia objetivo','basico',10,'Aplica lo aprendido en «Define tu audiencia objetivo» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Objetivos de marketing','basico',10,'Aplica lo aprendido en «Objetivos de marketing» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo diferenciarte en un mundo competitivo','basico',10,'Aplica lo aprendido en «Cómo diferenciarte en un mundo competitivo» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Canales de comunicación','basico',10,'Aplica lo aprendido en «Canales de comunicación» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo construir una marca','basico',10,'Aplica lo aprendido en «Cómo construir una marca» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Estrategias de Marketing Digital','basico',10,'Aplica lo aprendido en «Estrategias de Marketing Digital» y compártelo en la comunidad.',6 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Mentalidad del Creador de Contenido','basico',10,'Aplica lo aprendido en «Mentalidad del Creador de Contenido» y compártelo en la comunidad.',7 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Definir tu Propuesta de Valor','basico',10,'Aplica lo aprendido en «Cómo Definir tu Propuesta de Valor» y compártelo en la comunidad.',8 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Las Bases para ser Viral','Cómo funciona Instagram por dentro.','accent',2);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Herramientas Esenciales de Instagram','basico',10,'Aplica lo aprendido en «Herramientas Esenciales de Instagram» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Errores Comunes en Instagram y Cómo Evitarlos','basico',10,'Aplica lo aprendido en «Errores Comunes en Instagram y Cómo Evitarlos» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Funciona el Algoritmo de Instagram','basico',10,'Aplica lo aprendido en «Cómo Funciona el Algoritmo de Instagram» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Hacks Para Volverse Viral en Instagram','intermedio',14,'Aplica lo aprendido en «Hacks Para Volverse Viral en Instagram» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Hackea el Algoritmo','Contenido que el algoritmo ama.','accent',3);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Metodología de Ideas Infinitas','intermedio',14,'Aplica lo aprendido en «Metodología de Ideas Infinitas» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Formatos de Contenidos de Instagram','basico',10,'Aplica lo aprendido en «Formatos de Contenidos de Instagram» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Tipos de Contenidos en Instagram','basico',10,'Aplica lo aprendido en «Tipos de Contenidos en Instagram» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Reels: Anatomía de un Reel Viral y Hooks','basico',10,'Aplica lo aprendido en «Reels: Anatomía de un Reel Viral y Hooks» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Historias: Por Qué y Cómo Hacer Stories','intermedio',14,'Aplica lo aprendido en «Historias: Por Qué y Cómo Hacer Stories» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Publicaciones y En Vivos','intermedio',14,'Aplica lo aprendido en «Publicaciones y En Vivos» y compártelo en la comunidad.',6 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Ideas de Contenidos en Instagram','intermedio',14,'Aplica lo aprendido en «Ideas de Contenidos en Instagram» y compártelo en la comunidad.',7 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Comunicación que Conecta con Instagram','intermedio',14,'Aplica lo aprendido en «Comunicación que Conecta con Instagram» y compártelo en la comunidad.',8 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Técnicas de Grabación: cámara, micrófono, luz, audio','basico',10,'Aplica lo aprendido en «Técnicas de Grabación: cámara, micrófono, luz, audio» y compártelo en la comunidad.',9 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Edición Básica en CapCut','basico',10,'Aplica lo aprendido en «Edición Básica en CapCut» y compártelo en la comunidad.',10 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Crear tu Estrategia de Contenidos Paso a Paso','intermedio',14,'Aplica lo aprendido en «Cómo Crear tu Estrategia de Contenidos Paso a Paso» y compártelo en la comunidad.',11 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Copywriting para Redes Sociales','intermedio',14,'Aplica lo aprendido en «Copywriting para Redes Sociales» y compártelo en la comunidad.',12 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Calendario de Contenido','intermedio',14,'Aplica lo aprendido en «Calendario de Contenido» y compártelo en la comunidad.',13 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Analizar Cuentas Exitosas','intermedio',14,'Aplica lo aprendido en «Cómo Analizar Cuentas Exitosas» y compártelo en la comunidad.',14 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Aumenta tus Seguidores','Construye comunidad y engagement.','amber',4);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Construir una Comunidad','intermedio',14,'Aplica lo aprendido en «Cómo Construir una Comunidad» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Pilares para Construir una Comunidad','intermedio',14,'Aplica lo aprendido en «Pilares para Construir una Comunidad» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Estrategias para Mejorar tu Engagement','intermedio',14,'Aplica lo aprendido en «Estrategias para Mejorar tu Engagement» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Prepara tu Perfil de Instagram para Vender','basico',10,'Aplica lo aprendido en «Prepara tu Perfil de Instagram para Vender» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Análisis y Métricas en Instagram','intermedio',14,'Aplica lo aprendido en «Análisis y Métricas en Instagram» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Convierte tus Seguidores en Dinero','Empieza a monetizar.','amber',5);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Oferta','avanzado',16,'Aplica lo aprendido en «Oferta» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Formas de ganar dinero con Instagram','intermedio',14,'Aplica lo aprendido en «Formas de ganar dinero con Instagram» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Prospectos','avanzado',16,'Aplica lo aprendido en «Prospectos» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Proceso de Venta y Embudo de Ventas','avanzado',16,'Aplica lo aprendido en «Proceso de Venta y Embudo de Ventas» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Poner Precio a tus Productos o Servicios','avanzado',16,'Aplica lo aprendido en «Cómo Poner Precio a tus Productos o Servicios» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Estrategias para Aumentar tus Ventas','Vende más con estrategia.','amber',6);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Testimonios y Prueba Social','avanzado',16,'Aplica lo aprendido en «Testimonios y Prueba Social» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Storytelling','avanzado',16,'Aplica lo aprendido en «Storytelling» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'En Vivo y Webinar','avanzado',16,'Aplica lo aprendido en «En Vivo y Webinar» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'UGC','avanzado',16,'Aplica lo aprendido en «UGC» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Venta Directa','avanzado',16,'Aplica lo aprendido en «Venta Directa» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Llamadas a la Acción (Correo, Linktree, Link en Bio)','avanzado',16,'Aplica lo aprendido en «Llamadas a la Acción (Correo, Linktree, Link en Bio)» y compártelo en la comunidad.',6 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Automatizaciones y Mensajes','avanzado',16,'Aplica lo aprendido en «Automatizaciones y Mensajes» y compártelo en la comunidad.',7 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Base de Datos y Lead Magnet','avanzado',16,'Aplica lo aprendido en «Base de Datos y Lead Magnet» y compártelo en la comunidad.',8 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Incentivos','avanzado',16,'Aplica lo aprendido en «Incentivos» y compártelo en la comunidad.',9 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Canales de Venta en Instagram','avanzado',16,'Aplica lo aprendido en «Canales de Venta en Instagram» y compártelo en la comunidad.',10 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Atención al Cliente (Pre, Venta y Post)','avanzado',16,'Aplica lo aprendido en «Atención al Cliente (Pre, Venta y Post)» y compártelo en la comunidad.',11 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Herramientas para Empresas','avanzado',16,'Aplica lo aprendido en «Herramientas para Empresas» y compártelo en la comunidad.',12 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Técnicas Efectivas para Cerrar Ventas','avanzado',16,'Aplica lo aprendido en «Técnicas Efectivas para Cerrar Ventas» y compártelo en la comunidad.',13 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Manejo de Objeciones','avanzado',16,'Aplica lo aprendido en «Manejo de Objeciones» y compártelo en la comunidad.',14 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Gatillos Mentales','avanzado',16,'Aplica lo aprendido en «Gatillos Mentales» y compártelo en la comunidad.',15 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Email Marketing para Instagram','avanzado',16,'Aplica lo aprendido en «Email Marketing para Instagram» y compártelo en la comunidad.',16 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Fidelización y Recompra','avanzado',16,'Aplica lo aprendido en «Fidelización y Recompra» y compártelo en la comunidad.',17 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Escalamiento con Automatizaciones','avanzado',16,'Aplica lo aprendido en «Escalamiento con Automatizaciones» y compártelo en la comunidad.',18 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Ecosistema Digital (IG→WhatsApp→Email→Venta)','avanzado',16,'Aplica lo aprendido en «Ecosistema Digital (IG→WhatsApp→Email→Venta)» y compártelo en la comunidad.',19 from public.cursos_modulos where orden=6 limit 1;


-- ===================== 16_referidos.sql =====================
-- Referidos: da +100 XP a quien invita (una vez por nuevo usuario).
create table if not exists public.referidos (
  referido_id uuid primary key references auth.users(id) on delete cascade,
  referidor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.referidos enable row level security;
drop policy if exists "ref_select_own" on public.referidos;
create policy "ref_select_own" on public.referidos
  for select using (auth.uid() = referido_id or auth.uid() = referidor_id);
-- Las escrituras las hace el servidor con service role.


-- ===================== 17_bucket_video_limit.sql =====================
-- Sube el límite de tamaño del bucket "retos" (donde viven los videos de clase)
-- de 50 MB a 200 MB, para poder subir videos de clase reales.
-- 200 MB = 209715200 bytes.
update storage.buckets
set file_size_limit = 209715200
where id = 'retos';

-- Verifica el nuevo límite:
select id, name, public, file_size_limit
from storage.buckets
where id = 'retos';


-- ===================== 18_retos_prueba.sql =====================
-- Retos iniciales de PRUEBA (aparecen en /app/retos bajo "Más retos de la semana").
-- Se pueden volver a correr sin duplicar (borra por título y reinserta).
-- El tipo de revisión (Sola / Equipo 48h) se muestra en la sección "Sobre este reto".

delete from public.retos where titulo in (
  'Tu propósito y tu meta de 90 días',
  'Optimiza tu perfil: bio, foto y nombre',
  'Graba un clip de 15-30s',
  'Publica tu primer video (reto estrella)'
);

insert into public.retos (tipo, titulo, emoji, descripcion, intro, accion, xp, orden, pasos, tips, sobre, consejo) values

-- 1) Propósito + meta 90 días  (revisión: SOLA / auto)
('semanal', 'Tu propósito y tu meta de 90 días', '🎯',
 'Clarifica tu porqué y define una meta realista que te enfoque cada día.',
 'Este reto te ayuda a conectar con tu propósito y a trazar un plan a 90 días.',
 'publicarlo', 50, 1,
 '[
   {"id":"porque","titulo":"Escribe tu porqué","subtitulo":"¿Qué te motiva a crear contenido? ¿Qué impacto quieres generar?","tipo":"textarea","placeholder":"Escribe tu porqué...","max":500,"octi":"Empecemos por lo más importante: tu porqué. Sin filtros. 💜"},
   {"id":"meta","titulo":"Define tu meta de 90 días","subtitulo":"¿Qué quieres lograr en los próximos 90 días en tus redes?","tipo":"textarea","placeholder":"Escribe tu meta...","max":500,"octi":"Ahora tu meta: que sea concreta y medible. 🎯"}
 ]'::jsonb,
 '{"titulo":"Tips para una buena meta:","items":["Sé específico","Debe ser medible","Alcanzable","Con un plazo"]}'::jsonb,
 '["Se revisa: tú misma (automático) ✅","Comparte tu porqué y tu meta con la comunidad.","Inspira a otros y recibe apoyo en tu camino."]'::jsonb,
 'Tu porqué es tu brújula; tu meta es tu mapa. La acción diaria te lleva ahí. 💜'),

-- 2) Optimiza tu perfil  (revisión: EQUIPO 48h)
('semanal', 'Optimiza tu perfil: bio, foto y nombre', '✨',
 'Deja tu bio, foto y nombre optimizados en tu red y sube la captura.',
 'Un perfil claro genera confianza y hace que te encuentren.',
 'compartir tu captura', 50, 2,
 '[
   {"id":"bio","titulo":"Tu nueva bio","subtitulo":"Qué haces + para quién + un toque tuyo.","tipo":"textarea","placeholder":"Ej: Ayudo a nuevos creadores a...","max":300,"octi":"Tu bio es tu carta de presentación: clara y con personalidad. ✨"},
   {"id":"nombre","titulo":"Tu nombre optimizado","subtitulo":"Nombre + palabra clave de tu nicho (para que te encuentren).","tipo":"texto","placeholder":"Ej: Melissa | Marketing para creadores","max":60,"octi":"Suma una palabra clave de tu nicho al nombre. 🔍"},
   {"id":"captura","titulo":"Sube la captura de tu perfil","subtitulo":"Muestra tu perfil ya optimizado (bio + foto + nombre).","tipo":"archivo","archivoImagen":true,"acepta":"image/*","ayudaArchivo":"Sube una captura de pantalla (imagen).","octi":"¡Presume tu perfil renovado! 📸"}
 ]'::jsonb,
 '{"titulo":"Tips:","items":["Bio clara","Foto que se vea bien","Nombre + nicho"]}'::jsonb,
 '["Se revisa: el equipo en 48h ⏳","Optimiza bio, foto y nombre en tu red.","Sube la captura para validarlo."]'::jsonb,
 'Un buen perfil convierte visitas en seguidores. Cuídalo. 💜'),

-- 3) Graba un clip 15-30s  (revisión: EQUIPO 48h)
('semanal', 'Graba un clip de 15-30s', '🎬',
 'Graba un clip corto aplicando encuadre, luz y audio.',
 'Practica lo técnico con un clip corto y sencillo.',
 'compartirlo', 50, 3,
 '[
   {"id":"idea","titulo":"¿Qué vas a mostrar?","subtitulo":"Describe en una frase el clip que vas a grabar.","tipo":"textarea","placeholder":"Ej: Un tip rápido sobre...","max":200,"octi":"Una idea simple y clara funciona mejor. 🎬"},
   {"id":"clip","titulo":"Sube tu clip (15-30s)","subtitulo":"Aplica encuadre, buena luz y audio claro.","tipo":"archivo","archivoImagen":false,"acepta":"video/mp4,video/quicktime","ayudaArchivo":"Video de 15 a 30 segundos (mp4).","octi":"Encuadre, luz y audio: esos 3 hacen la diferencia. ✨"}
 ]'::jsonb,
 '{"titulo":"Tips:","items":["Buena luz","Encuadre estable","Audio claro"]}'::jsonb,
 '["Se revisa: el equipo en 48h ⏳","Practica encuadre, luz y audio.","Sube tu clip para recibir feedback."]'::jsonb,
 'Hecho es mejor que perfecto. Graba y mejora sobre la marcha. 💜'),

-- 4) Primer video estructura completa  (reto ESTRELLA, revisión: EQUIPO 48h)
('semanal', 'Publica tu primer video (reto estrella)', '⭐',
 'Publica tu primer video con la estructura completa: gancho, desarrollo y cierre.',
 'El reto estrella: aplica todo lo aprendido en un video real.',
 'publicarlo', 100, 4,
 '[
   {"id":"estructura","titulo":"Tu estructura (gancho, desarrollo, cierre)","subtitulo":"Escribe tu guión con las 3 partes.","tipo":"textarea","placeholder":"Gancho: ... Desarrollo: ... Cierre: ...","max":600,"octi":"Gancho fuerte en los primeros 3 segundos. 🔥"},
   {"id":"video","titulo":"Sube tu video final","subtitulo":"Tu primer video con la estructura completa.","tipo":"archivo","archivoImagen":false,"acepta":"video/mp4,video/quicktime","ayudaArchivo":"Tu video final (mp4).","octi":"¡Este es el reto estrella! Dale con todo. ⭐"},
   {"id":"link","titulo":"Link de tu publicación","subtitulo":"Pega el enlace de tu video ya publicado.","tipo":"texto","placeholder":"https://...","max":200,"octi":"Comparte el link para que la comunidad te apoye. 💜"}
 ]'::jsonb,
 '{"titulo":"Tips:","items":["Gancho en 3s","Una sola idea","Cierre con llamada a la acción"]}'::jsonb,
 '["Se revisa: el equipo en 48h ⏳","El reto estrella: aplica todo lo aprendido.","Publica y comparte el link con la comunidad."]'::jsonb,
 'Tu primer video no será perfecto, será tu punto de partida. 🚀');

-- Verifica:
select titulo, tipo, xp, jsonb_array_length(pasos) as pasos from public.retos
where tipo = 'semanal' order by orden;


-- ===================== 19_reto_revision.sql =====================
-- Tipo de revisión del reto: 'sola' = se auto-publica en la comunidad,
-- 'equipo' = lo revisa el equipo (48h). Por defecto 'equipo'.
alter table public.retos
  add column if not exists revisa text not null default 'equipo'
  check (revisa in ('sola','equipo'));

-- Comentario del equipo al rechazar (o aprobar) un envío.
alter table public.reto_submissions
  add column if not exists revision_comentario text;

-- Los retos de prueba: 'Tu propósito y tu meta de 90 días' es auto (Sola);
-- los demás quedan en 'equipo' (revisión 48h) por defecto.
update public.retos set revisa = 'sola'
  where titulo = 'Tu propósito y tu meta de 90 días';

select titulo, tipo, revisa from public.retos where tipo = 'semanal' order by orden;


-- ===================== 20_comunidad_retos.sql =====================
-- ===== Comunidad Etapa 2: Retos en comunidad (grupales) =====

-- Reto grupal (ej. "7 días de creatividad")
create table if not exists public.comunidad_retos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text default '',
  info text default '',                 -- "Durante N días deberás..."
  dias int not null default 7,
  xp_dia int not null default 30,
  xp_bonus int not null default 5,
  emoji text default '💡',
  activo boolean not null default true,
  orden int default 0,
  created_at timestamptz not null default now()
);

-- Inscripción de un usuario a un reto
create table if not exists public.comunidad_reto_inscritos (
  reto_id uuid not null references public.comunidad_retos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reto_id, user_id)
);

-- Publicación diaria dentro de un reto
create table if not exists public.comunidad_reto_posts (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references public.comunidad_retos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dia int not null,
  texto text not null default '',
  media_url text,
  created_at timestamptz not null default now()
);
create index if not exists cr_posts_reto_idx on public.comunidad_reto_posts (reto_id, created_at desc);
-- Un post por día por usuario por reto
create unique index if not exists cr_posts_unico on public.comunidad_reto_posts (reto_id, user_id, dia);

-- Likes de publicaciones del reto
create table if not exists public.comunidad_reto_likes (
  post_id uuid not null references public.comunidad_reto_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);

-- ===== RLS =====
alter table public.comunidad_retos enable row level security;
alter table public.comunidad_reto_inscritos enable row level security;
alter table public.comunidad_reto_posts enable row level security;
alter table public.comunidad_reto_likes enable row level security;

drop policy if exists "cr_ret_sel" on public.comunidad_retos;
create policy "cr_ret_sel" on public.comunidad_retos for select using (auth.role() = 'authenticated');

drop policy if exists "cr_ins_sel" on public.comunidad_reto_inscritos;
create policy "cr_ins_sel" on public.comunidad_reto_inscritos for select using (auth.role() = 'authenticated');
drop policy if exists "cr_ins_ins" on public.comunidad_reto_inscritos;
create policy "cr_ins_ins" on public.comunidad_reto_inscritos for insert with check (auth.uid() = user_id);
drop policy if exists "cr_ins_del" on public.comunidad_reto_inscritos;
create policy "cr_ins_del" on public.comunidad_reto_inscritos for delete using (auth.uid() = user_id);

drop policy if exists "cr_post_sel" on public.comunidad_reto_posts;
create policy "cr_post_sel" on public.comunidad_reto_posts for select using (auth.role() = 'authenticated');
drop policy if exists "cr_post_ins" on public.comunidad_reto_posts;
create policy "cr_post_ins" on public.comunidad_reto_posts for insert with check (auth.uid() = user_id);

drop policy if exists "cr_like_sel" on public.comunidad_reto_likes;
create policy "cr_like_sel" on public.comunidad_reto_likes for select using (auth.role() = 'authenticated');
drop policy if exists "cr_like_ins" on public.comunidad_reto_likes;
create policy "cr_like_ins" on public.comunidad_reto_likes for insert with check (auth.uid() = user_id);
drop policy if exists "cr_like_del" on public.comunidad_reto_likes;
create policy "cr_like_del" on public.comunidad_reto_likes for delete using (auth.uid() = user_id);

-- ===== Seed (2 retos de ejemplo) =====
insert into public.comunidad_retos (titulo, descripcion, info, dias, xp_dia, xp_bonus, emoji, orden)
select * from (values
  ('7 días de creatividad', 'Publica 1 idea o contenido al día en la comunidad', 'Durante 7 días deberás publicar una idea o pieza de contenido cada día. Mantén tu racha y gana XP.', 7, 30, 5, '💡', 1),
  ('Contenido auténtico', 'Publica 1 video a cámara contando tu historia', 'Durante 3 días graba y publica un video corto a cámara. Conecta con tu voz real.', 3, 30, 5, '🎬', 2)
) as v(titulo, descripcion, info, dias, xp_dia, xp_bonus, emoji, orden)
where not exists (select 1 from public.comunidad_retos where titulo = v.titulo);

select titulo, dias, xp_dia from public.comunidad_retos order by orden;


-- ===================== 21_fix_nicho.sql =====================
-- El onboarding nuevo usa nichos "Tecnología" y "Marketing", que el CHECK viejo
-- no permitía (por eso fallaba "No se pudo guardar"). Quitamos el CHECK rígido
-- para permitir cualquier nicho (los define el producto, no la BD).
alter table public.profiles drop constraint if exists profiles_nicho_check;

-- (Opcional) si prefieres validar, usa esta lista en vez del drop de arriba:
-- alter table public.profiles add constraint profiles_nicho_check
--   check (nicho in ('Moda','Salud','Belleza','Tecnología','Tech','Lifestyle','Marketing'));

