-- Respuestas de los usuarios a los retos (borrador o publicado).
create table if not exists public.reto_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  reto_id text not null,
  respuestas jsonb not null default '{}'::jsonb,
  archivo_url text,
  estado text not null default 'borrador' check (estado in ('borrador','publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, reto_id)
);

alter table public.reto_submissions enable row level security;

-- Cada usuario solo ve y edita SUS retos.
drop policy if exists "reto_select_own" on public.reto_submissions;
create policy "reto_select_own" on public.reto_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "reto_insert_own" on public.reto_submissions;
create policy "reto_insert_own" on public.reto_submissions
  for insert with check (auth.uid() = user_id);

drop policy if exists "reto_update_own" on public.reto_submissions;
create policy "reto_update_own" on public.reto_submissions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
