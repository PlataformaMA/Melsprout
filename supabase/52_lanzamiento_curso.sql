-- Fecha de lanzamiento de un curso especial: mientras no haya checkout,
-- la landing dice «Próximamente · 14 de septiembre» en vez de solo «Próximamente».
alter table public.cursos_modulos add column if not exists lanzamiento date;
update public.cursos_modulos set lanzamiento = '2026-09-14' where slug = 'boost-your-web';
