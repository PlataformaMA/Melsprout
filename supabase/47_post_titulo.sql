-- Las publicaciones del foro llevan título además del cuerpo.
alter table public.foros_posts add column if not exists titulo text;
