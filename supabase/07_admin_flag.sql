-- Permite marcar usuarios como admin desde el panel (además de ADMIN_EMAILS).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;
