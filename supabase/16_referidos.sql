-- Referidos: da +100 XP a quien invita (una vez por nuevo usuario).
create table if not exists public.referidos (
  referido_id uuid primary key references auth.users(id) on delete cascade,
  referidor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.referidos enable row level security;
drop policy if exists "ref_select_own" on public.referidos;
create policy "ref_select_own" on public.referidos
  for select using (auth.uid() = referido_id or auth.uid() = referidor_id);
-- Las escrituras las hace el servidor con service role.
