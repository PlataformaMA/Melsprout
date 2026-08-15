-- Melsprout · Recursos descargables por clase
-- Antes RecursosModal mostraba una lista inventada en el código, sin archivos.

create table if not exists public.recursos (
  id          uuid primary key default gen_random_uuid(),
  clase_id    text,                       -- null = recurso general (no atado a una clase)
  titulo      text not null,
  descripcion text not null default '',
  tipo        text not null default 'pdf' check (tipo in ('pdf','plantillas','canva','links')),
  etiqueta    text,                       -- "Nuevo", "Canva"…
  emoji       text not null default '📄',
  archivo     text,                       -- ruta dentro del bucket 'recursos'
  url         text,                       -- para recursos externos (Canva, links)
  peso        text,                       -- "PDF · 2.3 MB" (informativo)
  orden       int  not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Quién descargó qué (para marcar "ya descargado" y contar descargas).
create table if not exists public.recurso_descargas (
  user_id     uuid not null references auth.users(id) on delete cascade,
  recurso_id  uuid not null references public.recursos(id) on delete cascade,
  descargado_at timestamptz not null default now(),
  primary key (user_id, recurso_id)
);

alter table public.recursos          enable row level security;
alter table public.recurso_descargas enable row level security;

-- Los recursos activos los puede LEER cualquier alumno autenticado.
drop policy if exists "recursos_select" on public.recursos;
create policy "recursos_select" on public.recursos
  for select to authenticated using (activo = true);

-- Cada quien ve y registra SOLO sus propias descargas.
drop policy if exists "descargas_select_own" on public.recurso_descargas;
create policy "descargas_select_own" on public.recurso_descargas
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "descargas_insert_own" on public.recurso_descargas;
create policy "descargas_insert_own" on public.recurso_descargas
  for insert to authenticated with check (auth.uid() = user_id);

-- Bucket PRIVADO: los archivos se sirven con URL firmada y temporal, para que
-- nadie comparta un enlace directo fuera de la plataforma.
insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', false)
on conflict (id) do nothing;
