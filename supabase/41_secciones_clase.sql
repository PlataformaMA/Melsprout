-- Los cursos especiales agrupan sus clases en módulos internos, y cada
-- instructor tiene un rol visible en la tarjeta de la clase.
alter table public.cursos_clases
  add column if not exists seccion       text,
  add column if not exists instructor_rol text;
