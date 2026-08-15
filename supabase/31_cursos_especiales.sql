-- Melsprout · Cursos Especiales (patrocinados / bonus).
-- Reusan los MISMOS modulos y clases del curso normal: asi el reproductor, el
-- progreso y los retos siguen funcionando igual. Solo se marcan como especiales
-- para sacarlos de la Ruta y mostrarlos en su propia seccion.
alter table public.cursos_modulos
  add column if not exists especial boolean not null default false,
  add column if not exists patrocinador text,
  add column if not exists patrocinador_logo text,
  add column if not exists portada text;

create index if not exists cursos_modulos_especial_idx
  on public.cursos_modulos (especial) where especial = true;
