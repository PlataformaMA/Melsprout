-- Video de cada clase (gestionado desde el panel admin).
create table if not exists public.clase_videos (
  clase_id text primary key,
  video_url text,
  updated_at timestamptz not null default now()
);
alter table public.clase_videos enable row level security;
drop policy if exists "cv_select" on public.clase_videos;
create policy "cv_select" on public.clase_videos
  for select using (auth.role() = 'authenticated');
-- Las escrituras las hace el admin con service role (verificado en el servidor).
