-- El aviso "Clients can list all files in this bucket": la política de SELECT
-- dejaba que cualquier usuario con sesión ENUMERARA todo el bucket. Ya no hay
-- videos ahí (están en el bucket privado), pero seguía exponiendo la lista de
-- portadas, subtítulos y las imágenes que suben las alumnas.
--
-- Leer por URL pública NO depende de esta política (el bucket es público), así
-- que las portadas, los subtítulos y las imágenes siguen cargando igual.
drop policy if exists retos_leer on storage.objects;

create policy retos_leer on storage.objects for select to authenticated
using (
  bucket_id = 'retos' and (
    public.es_admin()
    -- cada quien puede ver (y por tanto administrar) lo suyo
    or ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);
