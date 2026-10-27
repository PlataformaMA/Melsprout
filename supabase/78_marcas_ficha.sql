-- La ficha completa de una marca, como la ve el equipo.
--
-- Hasta ahora de una marca solo guardábamos nombre, lema, categoría y logo.
-- La ficha del panel pide además de dónde es, cómo contactarla, sus redes y
-- los papeles (contrato, factura, datos bancarios). Todo esto es opcional: una
-- marca sin nada de esto sigue funcionando igual que hoy.

alter table public.marcas
  add column if not exists pais              text,
  add column if not exists descripcion       text,
  add column if not exists direccion         text,
  add column if not exists contacto_nombre   text,
  add column if not exists contacto_correo   text,
  add column if not exists contacto_telefono text,
  add column if not exists contacto_cargo    text,
  -- { "instagram": "@glossier", "tiktok": "@glossier", "youtube": "Glossier" }
  add column if not exists redes             jsonb not null default '{}'::jsonb;

-- Los papeles de la marca. Viven en un bucket privado: un contrato o una
-- carátula bancaria no puede quedar en una URL que adivine cualquiera.
create table if not exists public.marca_archivos (
  id          uuid primary key default gen_random_uuid(),
  marca_id    uuid not null references public.marcas(id) on delete cascade,
  -- contrato | factura | bancario | otro
  tipo        text not null default 'otro',
  ruta        text not null,
  nombre      text,
  peso        bigint,
  subido_por  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists marca_archivos_marca_idx
  on public.marca_archivos (marca_id, created_at desc);

-- Solo el servidor (service role) entra aquí: las pantallas pasan por las
-- funciones del panel, que ya revisan quién es quien pregunta.
alter table public.marca_archivos enable row level security;

-- 20 MB por archivo: un contrato escaneado cabe de sobra y un video no.
insert into storage.buckets (id, name, public, file_size_limit)
values ('marcas', 'marcas', false, 20971520)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Creadores destacados: a quién pone el equipo al frente de las marcas.
-- Es una decisión del equipo, no del creador, por eso vive aquí y no en algo
-- que la persona pueda cambiar desde su perfil.
alter table public.profiles
  add column if not exists destacado boolean not null default false;

create index if not exists profiles_destacado_idx
  on public.profiles (destacado) where destacado;
