-- Los videos de las clases pasan a un bucket PRIVADO: antes, cualquiera con la
-- URL (o listando el bucket) podía descargar el curso completo sin comprarlo.
-- Ahora la página de la clase entrega un enlace firmado que caduca, y solo
-- después de comprobar que la persona tiene el curso.
--
-- El bucket `videos` se creó con la API (privado). Estas políticas dejan que el
-- equipo suba desde el panel; leer solo se puede con enlace firmado del servidor.

create policy videos_subir on storage.objects for insert to authenticated
with check (bucket_id = 'videos' and public.es_admin());

create policy videos_actualizar on storage.objects for update to authenticated
using (bucket_id = 'videos' and public.es_admin())
with check (bucket_id = 'videos' and public.es_admin());

create policy videos_borrar on storage.objects for delete to authenticated
using (bucket_id = 'videos' and public.es_admin());

create policy videos_leer_admin on storage.objects for select to authenticated
using (bucket_id = 'videos' and public.es_admin());
