-- Marca de "editado" cuando la autora cambia su publicación o su respuesta.
alter table public.foros_posts add column if not exists editado_at timestamptz;
alter table public.foros_respuestas add column if not exists editado_at timestamptz;
