-- Buscar cuentas por correo SIN listar todo auth.users.
-- auth.users no se puede consultar desde la API; estas dos funciones lo hacen
-- del lado de Postgres (una consulta indexada) y solo las puede llamar el
-- servidor con la llave de servicio: anon y authenticated no tienen permiso,
-- así que nadie puede averiguar qué correos están registrados.

create or replace function public.usuario_por_correo(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

create or replace function public.correos_de_usuarios()
returns table (id uuid, email text)
language sql
security definer
set search_path = public, auth
stable
as $$
  select id, email from auth.users;
$$;

revoke all on function public.usuario_por_correo(text) from public, anon, authenticated;
revoke all on function public.correos_de_usuarios() from public, anon, authenticated;
grant execute on function public.usuario_por_correo(text) to service_role;
grant execute on function public.correos_de_usuarios() to service_role;

-- auth.users ya trae índice único por email (users_email_partial_key), así que
-- la búsqueda es instantánea sin importar cuántas cuentas haya.
