-- Las publicaciones de los retos de comunidad también se moderan.
alter table public.comunidad_reto_posts
  add column if not exists oculto boolean not null default false,
  add column if not exists estado text not null default 'pendiente'
  check (estado in ('pendiente','aprobado','oculto','spam'));
create index if not exists crp_estado_idx on public.comunidad_reto_posts (estado, created_at desc);
