-- Permisos del bucket "retos" (videos e imágenes de los retos).
-- Lectura pública (el bucket es público) y subida para usuarios autenticados.

drop policy if exists "retos_subir" on storage.objects;
create policy "retos_subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'retos');

drop policy if exists "retos_actualizar" on storage.objects;
create policy "retos_actualizar" on storage.objects
  for update to authenticated
  using (bucket_id = 'retos');

drop policy if exists "retos_leer" on storage.objects;
create policy "retos_leer" on storage.objects
  for select using (bucket_id = 'retos');
