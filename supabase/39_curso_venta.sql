-- Datos de venta de un curso especial (landing) y quién ya lo compró.
alter table public.cursos_modulos
  add column if not exists banner        text,           -- banner ancho del curso
  add column if not exists precio        numeric(10,2),
  add column if not exists moneda        text default 'MXN',
  add column if not exists checkout_url  text,           -- a dónde va "Comprar"
  add column if not exists aprenderas    jsonb default '[]'::jsonb,
  add column if not exists habilidades   jsonb default '[]'::jsonb,
  add column if not exists herramientas  jsonb default '[]'::jsonb,
  add column if not exists incluye       text,           -- nota extra del patrocinador
  add column if not exists semanas       int,
  add column if not exists rating        numeric(2,1),
  add column if not exists resenas       int,
  add column if not exists series        int;

-- Acceso comprado a un curso especial.
create table if not exists public.curso_accesos (
  user_id    uuid not null references auth.users(id) on delete cascade,
  modulo_id  uuid not null references public.cursos_modulos(id) on delete cascade,
  origen     text not null default 'manual',   -- manual | checkout | cortesia
  created_at timestamptz not null default now(),
  primary key (user_id, modulo_id)
);
alter table public.curso_accesos enable row level security;
drop policy if exists "acceso_select_own" on public.curso_accesos;
create policy "acceso_select_own" on public.curso_accesos
  for select using (auth.uid() = user_id);

-- Testimonios reales de alumnos (vacío hasta que existan de verdad).
create table if not exists public.curso_testimonios (
  id         uuid primary key default gen_random_uuid(),
  modulo_id  uuid not null references public.cursos_modulos(id) on delete cascade,
  nombre     text not null,
  avatar     text,
  desde      text,
  texto      text not null,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.curso_testimonios enable row level security;
drop policy if exists "testi_select" on public.curso_testimonios;
create policy "testi_select" on public.curso_testimonios
  for select using (auth.role() = 'authenticated' and visible = true);
