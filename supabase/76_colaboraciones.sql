-- Colaboraciones, pagos y envíos de una campaña.
--
-- Una sola tabla, no tres: las tres pestañas del detalle muestran la MISMA
-- lista de creadoras seleccionadas, solo que con columnas distintas. Separarlas
-- obligaría a cruzar tres tablas para pintar cada fila, sin ganar nada.
--
-- La fila nace cuando la marca selecciona a alguien, y cuelga de su
-- postulación: si se borra la campaña, se va todo con ella.

create table if not exists public.campania_colaboraciones (
  id              uuid primary key default gen_random_uuid(),
  aplicacion_id   uuid not null unique
                    references public.campania_aplicaciones(id) on delete cascade,

  -- ————— Seguimiento del contenido —————
  -- no_empezado | en_proceso | aprobado | por_corregir
  guion           text not null default 'no_empezado',
  grabacion       text not null default 'no_empezado',
  entrega_final   text not null default 'no_empezado',
  -- Lo que entregó la creadora, para que la marca lo descargue.
  material_url    text,
  fecha_entrega   date,
  -- a_tiempo | entrega_tardia | entrega_incumplida
  cumplimiento    text,
  calificacion    integer check (calificacion between 1 and 5),
  notas           text,

  -- ————— Pagos —————
  -- Se guardan dos pagos porque es lo que pide el diseño (anticipo y cierre).
  pago1           integer,
  pago1_fecha     date,
  pago2           integer,
  pago2_fecha     date,
  -- pendiente | pagado | por_pagar
  pago_estado     text not null default 'pendiente',
  pago_completado boolean not null default false,

  -- ————— Envío del producto —————
  direccion       text,
  paqueteria      text,
  guia            text,
  envio_fecha     date,
  -- en_preparacion | en_transito | entregado | retrasado
  envio_estado    text not null default 'en_preparacion',
  entrega_fecha   date,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists colaboraciones_aplicacion_idx
  on public.campania_colaboraciones (aplicacion_id);

alter table public.campania_colaboraciones enable row level security;
