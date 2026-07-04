-- ============================================================
-- Melsprout · Tabla de perfiles (perfil + progreso del usuario)
-- Pegar en Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) La tabla
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,

  -- Datos de perfil (onboarding · Módulos 01, 02, 11)
  full_name            text,
  avatar_url           text,
  pais                 text,
  fecha_nacimiento     date,
  whatsapp             text,
  whatsapp_optin       boolean not null default false,

  nicho                text check (nicho in ('Moda','Salud','Belleza','Tech','Lifestyle')),
  objetivo             text,
  plataforma_principal text,
  tamano_audiencia     text,
  redes                jsonb not null default '{}'::jsonb,

  -- Estado del onboarding
  onboarding_completo  boolean not null default false,

  -- Progreso / gamificación (Módulo 08)
  etapa                text not null default 'starter',
  xp                   integer not null default 0,
  gemas                integer not null default 0,
  racha                integer not null default 0,
  racha_fecha          date,

  -- Analítica (Módulo 01/14)
  canal_origen         text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 2) Seguridad a nivel fila: cada quien SOLO ve y edita su propio perfil
alter table public.profiles enable row level security;

drop policy if exists "perfil_ver_propio" on public.profiles;
create policy "perfil_ver_propio"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "perfil_editar_propio" on public.profiles;
create policy "perfil_editar_propio"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3) Crear el perfil AUTOMÁTICAMENTE cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Mantener updated_at al día
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 5) Crear el perfil para usuarios que YA existían (por si acaso)
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data->>'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
