-- Códigos de respaldo del 2FA (faltaba en las migraciones). El acceso es solo
-- vía service_role (backup-actions), por eso RLS activo sin policies = denegar todo.
create table if not exists public.backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  salt text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists backup_codes_user_id_idx on public.backup_codes (user_id);
alter table public.backup_codes enable row level security;
