-- Enlace destacado de un curso (p. ej. el plan de Hostinger con descuento):
-- sale debajo del video en todas las clases del curso.
alter table public.cursos_modulos
  add column if not exists enlace_texto text,
  add column if not exists enlace_url   text;
