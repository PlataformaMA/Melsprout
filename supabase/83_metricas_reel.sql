-- Las métricas del reel publicado, dentro de la colaboración.
--
-- Hasta hoy la campaña terminaba cuando la marca aprobaba el video. Lo que
-- pasó DESPUÉS —cuánta gente lo vio, si funcionó— se quedaba en Instagram y
-- nadie de los dos lados lo volvía a mirar. Es justo el dato que le sirve a
-- la creadora para pedir más la próxima vez, y a la marca para repetir con
-- ella.
--
-- Va en campania_colaboraciones y no en una tabla aparte por lo mismo que
-- dice 76: es la misma fila vista con otras columnas.

alter table public.campania_colaboraciones
  -- El enlace al post publicado. Lo pega la creadora: es la única que sabe
  -- cuál de sus reels es el de esta campaña.
  add column if not exists post_url          text,
  add column if not exists post_titulo       text,
  add column if not exists post_descripcion  text,
  -- Miniatura y fecha vienen de InsightIQ junto con las métricas.
  add column if not exists post_portada      text,
  add column if not exists post_publicado_at timestamptz,
  add column if not exists post_duracion     int,
  -- { vistas, likes, comentarios, compartidos, engagement }
  add column if not exists post_metricas     jsonb,
  -- Cuándo se leyeron. Sin esto no se sabe si el número es de hoy o de hace
  -- tres semanas, y un número viejo sin fecha miente.
  add column if not exists post_metricas_at  timestamptz;

-- Para sacar el promedio de la campaña sin leer las filas que no tienen nada.
create index if not exists colaboraciones_con_metricas_idx
  on public.campania_colaboraciones (aplicacion_id)
  where post_metricas is not null;
