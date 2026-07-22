-- ===== Comunidad Etapa 2: Retos en comunidad (grupales) =====

-- Reto grupal (ej. "7 días de creatividad")
create table if not exists public.comunidad_retos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text default '',
  info text default '',                 -- "Durante N días deberás..."
  dias int not null default 7,
  xp_dia int not null default 30,
  xp_bonus int not null default 5,
  emoji text default '💡',
  activo boolean not null default true,
  orden int default 0,
  created_at timestamptz not null default now()
);

-- Inscripción de un usuario a un reto
create table if not exists public.comunidad_reto_inscritos (
  reto_id uuid not null references public.comunidad_retos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reto_id, user_id)
);

-- Publicación diaria dentro de un reto
create table if not exists public.comunidad_reto_posts (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references public.comunidad_retos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dia int not null,
  texto text not null default '',
  media_url text,
  created_at timestamptz not null default now()
);
create index if not exists cr_posts_reto_idx on public.comunidad_reto_posts (reto_id, created_at desc);
-- Un post por día por usuario por reto
create unique index if not exists cr_posts_unico on public.comunidad_reto_posts (reto_id, user_id, dia);

-- Likes de publicaciones del reto
create table if not exists public.comunidad_reto_likes (
  post_id uuid not null references public.comunidad_reto_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);

-- ===== RLS =====
alter table public.comunidad_retos enable row level security;
alter table public.comunidad_reto_inscritos enable row level security;
alter table public.comunidad_reto_posts enable row level security;
alter table public.comunidad_reto_likes enable row level security;

drop policy if exists "cr_ret_sel" on public.comunidad_retos;
create policy "cr_ret_sel" on public.comunidad_retos for select using (auth.role() = 'authenticated');

drop policy if exists "cr_ins_sel" on public.comunidad_reto_inscritos;
create policy "cr_ins_sel" on public.comunidad_reto_inscritos for select using (auth.role() = 'authenticated');
drop policy if exists "cr_ins_ins" on public.comunidad_reto_inscritos;
create policy "cr_ins_ins" on public.comunidad_reto_inscritos for insert with check (auth.uid() = user_id);
drop policy if exists "cr_ins_del" on public.comunidad_reto_inscritos;
create policy "cr_ins_del" on public.comunidad_reto_inscritos for delete using (auth.uid() = user_id);

drop policy if exists "cr_post_sel" on public.comunidad_reto_posts;
create policy "cr_post_sel" on public.comunidad_reto_posts for select using (auth.role() = 'authenticated');
drop policy if exists "cr_post_ins" on public.comunidad_reto_posts;
create policy "cr_post_ins" on public.comunidad_reto_posts for insert with check (auth.uid() = user_id);

drop policy if exists "cr_like_sel" on public.comunidad_reto_likes;
create policy "cr_like_sel" on public.comunidad_reto_likes for select using (auth.role() = 'authenticated');
drop policy if exists "cr_like_ins" on public.comunidad_reto_likes;
create policy "cr_like_ins" on public.comunidad_reto_likes for insert with check (auth.uid() = user_id);
drop policy if exists "cr_like_del" on public.comunidad_reto_likes;
create policy "cr_like_del" on public.comunidad_reto_likes for delete using (auth.uid() = user_id);

-- ===== Seed (2 retos de ejemplo) =====
insert into public.comunidad_retos (titulo, descripcion, info, dias, xp_dia, xp_bonus, emoji, orden)
select * from (values
  ('7 días de creatividad', 'Publica 1 idea o contenido al día en la comunidad', 'Durante 7 días deberás publicar una idea o pieza de contenido cada día. Mantén tu racha y gana XP.', 7, 30, 5, '💡', 1),
  ('Contenido auténtico', 'Publica 1 video a cámara contando tu historia', 'Durante 3 días graba y publica un video corto a cámara. Conecta con tu voz real.', 3, 30, 5, '🎬', 2)
) as v(titulo, descripcion, info, dias, xp_dia, xp_bonus, emoji, orden)
where not exists (select 1 from public.comunidad_retos where titulo = v.titulo);

select titulo, dias, xp_dia from public.comunidad_retos order by orden;
