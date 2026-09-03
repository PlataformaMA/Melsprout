-- Datos que el panel pide para una clase en vivo.
alter table public.clases_vivo
  add column if not exists instructor_rol text,
  add column if not exists nivel          text,
  add column if not exists modulo_id      uuid references public.cursos_modulos(id) on delete set null,
  add column if not exists zona_horaria   text default 'America/Mexico_City';

-- Los recursos también pueden colgar de una clase en vivo.
alter table public.recursos
  add column if not exists clase_vivo_id uuid references public.clases_vivo(id) on delete cascade;
create index if not exists recursos_vivo_idx on public.recursos (clase_vivo_id);
