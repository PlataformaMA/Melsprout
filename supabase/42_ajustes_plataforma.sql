-- Ajustes que el superadmin cambia sin tocar código ni desplegar.
create table if not exists public.ajustes_plataforma (
  clave      text primary key,
  valor      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.ajustes_plataforma enable row level security;
drop policy if exists "ajustes_lectura" on public.ajustes_plataforma;
create policy "ajustes_lectura" on public.ajustes_plataforma
  for select using (auth.role() = 'authenticated');

insert into public.ajustes_plataforma (clave, valor)
values ('todo_desbloqueado', 'true'::jsonb)
on conflict (clave) do nothing;
