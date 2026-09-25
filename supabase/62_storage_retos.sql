-- El bucket `retos` aceptaba que CUALQUIER usuario con sesión subiera o
-- sobrescribiera cualquier archivo: videos de clase, subtítulos, portadas,
-- recursos y las entregas de otras alumnas (las rutas eran predecibles).
-- Ahora cada quien solo puede escribir dentro de su propia carpeta `u/<su id>/`
-- y el equipo (is_admin) donde haga falta.

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.es_admin() to authenticated;

drop policy if exists retos_subir on storage.objects;
drop policy if exists retos_actualizar on storage.objects;
drop policy if exists retos_borrar on storage.objects;

create policy retos_subir on storage.objects for insert to authenticated
with check (
  bucket_id = 'retos' and (
    ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
    or public.es_admin()
  )
);

create policy retos_actualizar on storage.objects for update to authenticated
using (
  bucket_id = 'retos' and (
    ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
    or public.es_admin()
  )
)
with check (
  bucket_id = 'retos' and (
    ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
    or public.es_admin()
  )
);

create policy retos_borrar on storage.objects for delete to authenticated
using (
  bucket_id = 'retos' and (
    ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
    or public.es_admin()
  )
);
