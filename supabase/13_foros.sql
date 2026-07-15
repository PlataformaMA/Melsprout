-- Foros de la comunidad: publicaciones por categoría, con likes y respuestas.
create table if not exists public.foros_posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'General',
  texto text not null,
  imagen_url text,
  video_url text,
  enlace_url text,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists foros_posts_cat_idx on public.foros_posts (categoria, created_at desc);
alter table public.foros_posts enable row level security;
drop policy if exists "fp_select" on public.foros_posts;
create policy "fp_select" on public.foros_posts for select using (auth.role() = 'authenticated' and oculto = false);
drop policy if exists "fp_insert" on public.foros_posts;
create policy "fp_insert" on public.foros_posts for insert with check (auth.uid() = autor_id);

create table if not exists public.foros_likes (
  post_id uuid not null references public.foros_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.foros_likes enable row level security;
drop policy if exists "fl_select" on public.foros_likes;
create policy "fl_select" on public.foros_likes for select using (auth.role() = 'authenticated');
drop policy if exists "fl_insert" on public.foros_likes;
create policy "fl_insert" on public.foros_likes for insert with check (auth.uid() = user_id);
drop policy if exists "fl_delete" on public.foros_likes;
create policy "fl_delete" on public.foros_likes for delete using (auth.uid() = user_id);

create table if not exists public.foros_respuestas (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.foros_posts(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.foros_respuestas enable row level security;
drop policy if exists "fr_select" on public.foros_respuestas;
create policy "fr_select" on public.foros_respuestas for select using (auth.role() = 'authenticated' and oculto = false);
drop policy if exists "fr_insert" on public.foros_respuestas;
create policy "fr_insert" on public.foros_respuestas for insert with check (auth.uid() = autor_id);
