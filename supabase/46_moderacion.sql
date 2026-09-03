-- Estado de revisión del equipo. "pendiente" = todavía nadie lo miró, pero
-- se sigue viendo; solo "oculto" y "spam" lo sacan de la plataforma.
alter table public.clase_comentarios
  add column if not exists estado text not null default 'pendiente'
  check (estado in ('pendiente','aprobado','oculto','spam'));

alter table public.foros_posts
  add column if not exists estado text not null default 'pendiente'
  check (estado in ('pendiente','aprobado','oculto','spam'));

alter table public.foros_respuestas
  add column if not exists estado text not null default 'pendiente'
  check (estado in ('pendiente','aprobado','oculto','spam'));

-- Lo que ya estaba oculto se marca como tal.
update public.clase_comentarios set estado = 'oculto' where oculto = true and estado = 'pendiente';
update public.foros_posts        set estado = 'oculto' where oculto = true and estado = 'pendiente';
update public.foros_respuestas   set estado = 'oculto' where oculto = true and estado = 'pendiente';

create index if not exists clase_comentarios_estado_idx on public.clase_comentarios (estado, created_at desc);
create index if not exists foros_posts_estado_idx       on public.foros_posts (estado, created_at desc);
