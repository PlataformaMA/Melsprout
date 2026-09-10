-- Un grupo puede pertenecer a un curso: solo entra quien lo compró.
alter table public.grupos
  add column if not exists slug     text,
  add column if not exists curso_id uuid references public.cursos_modulos(id) on delete set null;

create unique index if not exists grupos_slug_uniq on public.grupos (slug) where slug is not null;
