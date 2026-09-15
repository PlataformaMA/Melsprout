-- Enlaces de activación del correo de compra. No caducan solos: el token de
-- Supabase se genera cuando la persona toca el botón, no cuando se manda el correo.
create table if not exists public.activaciones (
  token_hash  text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  usado_at    timestamptz
);
alter table public.activaciones enable row level security;
-- Solo el servidor (service role) la toca; nadie desde el cliente.
