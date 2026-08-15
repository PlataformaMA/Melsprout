-- Portada de cada clase (para la vista Bloques).
-- Si queda vacía, la app usa la miniatura de YouTube del propio video.
alter table public.cursos_clases
  add column if not exists portada text;
