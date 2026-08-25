-- Las respuestas publicadas de un reto se espejan como publicación de la
-- comunidad, para que se les pueda dar me gusta, comentar y responder
-- reutilizando foros_posts / foros_likes / foros_respuestas.
alter table public.foros_posts add column if not exists reto_id text;

create index if not exists foros_posts_reto_idx
  on public.foros_posts (reto_id, created_at desc);

-- Un usuario tiene una sola publicación por reto (al reeditar, se actualiza).
create unique index if not exists foros_posts_reto_autor_uniq
  on public.foros_posts (reto_id, autor_id) where reto_id is not null;

-- Se libera la cola de revisión acumulada: todo lo publicado queda aprobado.
-- (La XP ya se dio al publicar, así que esto no reparte puntos de más.)
update public.reto_submissions
   set revision = 'aprobado'
 where estado = 'publicado'
   and revision = 'pendiente';

-- Relleno: los retos ya publicados y aprobados pasan a la comunidad.
insert into public.foros_posts (autor_id, reto_id, categoria, texto, imagen_url, video_url, created_at)
select
  s.user_id,
  s.reto_id,
  'Retos',
  coalesce(nullif(t.texto, ''), 'Compartí mi reto 💜'),
  case when s.archivo_url is not null and s.archivo_url !~* '\.(mp4|mov|webm|m4v)(\?|$)' then s.archivo_url end,
  case when s.archivo_url is not null and s.archivo_url ~* '\.(mp4|mov|webm|m4v)(\?|$)' then s.archivo_url end,
  s.updated_at
from public.reto_submissions s
cross join lateral (
  select string_agg(btrim(v.value), E'\n\n') as texto
  from jsonb_each_text(s.respuestas) as v
  where btrim(v.value) <> ''
) t
where s.estado = 'publicado'
  and s.revision = 'aprobado'
  and (t.texto is not null or s.archivo_url is not null)
on conflict (reto_id, autor_id) where reto_id is not null do nothing;
