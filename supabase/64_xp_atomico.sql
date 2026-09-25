-- Sumar XP leyendo y volviendo a escribir pierde puntos cuando pasan dos cosas
-- a la vez (terminar una clase y publicar un reto en el mismo segundo).
-- Esta función suma en una sola operación atómica y devuelve el total.
create or replace function public.sumar_xp(p_user uuid, p_xp integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles set xp = greatest(0, coalesce(xp, 0) + p_xp), updated_at = now()
  where id = p_user
  returning xp;
$$;
revoke all on function public.sumar_xp(uuid, integer) from public, anon, authenticated;
grant execute on function public.sumar_xp(uuid, integer) to service_role;
