-- Sube el límite de tamaño del bucket "retos" (donde viven los videos de clase)
-- de 50 MB a 200 MB, para poder subir videos de clase reales.
-- 200 MB = 209715200 bytes.
update storage.buckets
set file_size_limit = 209715200
where id = 'retos';

-- Verifica el nuevo límite:
select id, name, public, file_size_limit
from storage.buckets
where id = 'retos';
