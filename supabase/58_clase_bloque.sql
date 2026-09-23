-- Sub-módulo ("bloque") dentro de un curso: los cursos especiales agrupan sus
-- clases en módulos internos que antes solo vivían en el guion del curso.
alter table public.cursos_clases add column if not exists bloque text;
