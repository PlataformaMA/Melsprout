-- El contrato de derechos de imagen de una colaboración.
--
-- Una marca que va a usar la cara de alguien en su publicidad necesita su
-- permiso por escrito, y la creadora necesita saber a qué dijo que sí. Hasta
-- hoy eso se acordaba por WhatsApp o no se acordaba.
--
-- La marca (o el equipo) sube el contrato y la creadora lo firma desde la
-- plataforma. "Firmar" aquí es dejar constancia: quién, cuándo y sobre qué
-- archivo exactamente. Por eso se guarda la ruta junto a la fecha — un
-- "firmado el 12 de octubre" sin el documento al lado no prueba nada.

alter table public.campania_colaboraciones
  add column if not exists contrato_ruta        text,
  add column if not exists contrato_nombre      text,
  add column if not exists contrato_subido_at   timestamptz,
  add column if not exists contrato_firmado_at  timestamptz,
  -- El nombre con el que firmó, tal como lo escribió ella.
  add column if not exists contrato_firmado_por text;
