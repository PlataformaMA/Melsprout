-- El portafolio del alumno: sus mejores videos, para que una marca los vea.
--
-- Hasta hoy una marca que abría un perfil veía nombre, nicho y seguidores.
-- Nada de lo que de verdad decide una colaboración: cómo graba, cómo habla,
-- cómo se ve su contenido. Esto es ese pedazo que faltaba.
--
-- El video NO pasa por el servidor: medio giga no cabe en una server action.
-- El navegador sube directo al bucket con una URL firmada, igual que las
-- entregas de campaña (ver 77_creador_campanias.sql).

create table if not exists public.portafolio_videos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  -- Ruta dentro del bucket 'portafolio'. La escribe el servidor.
  ruta       text not null,
  -- Una imagen del primer segundo, capturada en el navegador al subir. Sin
  -- esto la rejilla serían seis videos cargando a la vez solo para pintarse.
  portada    text,
  nombre     text,
  peso       bigint,
  -- Segundos. Se enseña sobre la miniatura, como en cualquier galería.
  duracion   int,
  -- Menor = primero. Así "mover al inicio" es poner el mínimo - 1 y no
  -- reescribir toda la lista.
  orden      int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists portafolio_videos_user_idx
  on public.portafolio_videos (user_id, orden, created_at desc);

-- Solo el servidor entra: las pantallas pasan por las funciones de
-- src/lib/portafolio.ts, que ya revisan de quién es cada video.
alter table public.portafolio_videos enable row level security;

-- Privado, como las entregas: el enlace se firma al momento de verlo. Un
-- bucket público sería una URL eterna al contenido de una alumna, y esos
-- videos a veces ni se han publicado todavía.
insert into storage.buckets (id, name, public, file_size_limit)
values ('portafolio', 'portafolio', false, 524288000)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;
