-- Portal de marcas: las empresas entran a Melsprout con su propia cuenta.
--
-- No se crea una tabla nueva de empresas: la marca YA existe (`marcas`, la que
-- ven las creadoras en el Marketplace). Lo que se agrega es de quién es esa
-- marca y qué puede hacer su cuenta. Así una campaña publicada por la empresa
-- es exactamente la misma fila que ve la creadora, sin duplicar nada.

-- ————— La cuenta dueña de la marca —————
alter table public.marcas
  add column if not exists dueno_id uuid references auth.users(id) on delete set null,
  -- El equipo revisa a la empresa antes de que pueda publicar.
  add column if not exists aprobada boolean not null default false,
  add column if not exists sitio text,
  add column if not exists plan text not null default 'free';

create unique index if not exists marcas_dueno_idx on public.marcas (dueno_id)
  where dueno_id is not null;

-- ————— Qué tipo de cuenta es —————
-- 'creador' = las alumnas de siempre. 'empresa' = la marca, que NO ve la ruta
-- ni la comunidad: entra a su propio panel.
alter table public.profiles
  add column if not exists tipo text not null default 'creador';

-- ————— La campaña, con todo lo que pide el formulario de 3 pasos —————
alter table public.campanias
  -- borrador → pendiente (la empresa la publica) → aprobada | rechazada → cerrada
  add column if not exists estado text not null default 'aprobada',
  add column if not exists nota_equipo text,
  -- Paso 1: información general
  add column if not exists tipos text[] not null default '{}',   -- intercambio | monto | afiliados
  add column if not exists imagenes text[] not null default '{}',
  add column if not exists limite_postulaciones integer,
  add column if not exists publicada_at timestamptz,
  -- Paso 2: requisitos y perfil
  add column if not exists nicho text,
  add column if not exists genero text,
  add column if not exists edad_min integer,
  add column if not exists edad_max integer,
  -- Mínimo de seguidores: 0 = sin cantidad específica.
  add column if not exists seguidores_min integer not null default 0,
  add column if not exists ubicaciones text[] not null default '{}',
  -- [{ id, texto, tipo: "corto"|"largo"|"enlace", obligatoria, compartir }]
  add column if not exists preguntas jsonb not null default '[]'::jsonb,
  -- Paso 3: pago y compensación
  add column if not exists compensacion_detalle text,
  -- { intercambio: {productos}, monto: {cantidad, moneda}, afiliados: {porcentaje, duracion} }
  add column if not exists compensacion jsonb not null default '{}'::jsonb,
  -- Visibilidad, que la empresa controla desde el detalle de su campaña.
  add column if not exists en_marketplace boolean not null default true,
  add column if not exists compartir_con_lista boolean not null default false;

-- Lo que ya existía se queda aprobado: son las campañas que cargó el equipo.
update public.campanias set estado = 'aprobada' where estado is null;

create index if not exists campanias_estado_idx on public.campanias (estado, created_at desc);

-- ————— Postulaciones: lo que la empresa necesita ver —————
alter table public.campania_aplicaciones
  -- Respuestas a las preguntas de selección: { "<id pregunta>": "respuesta" }
  add column if not exists respuestas jsonb not null default '{}'::jsonb,
  -- enviada → en_seleccion → aceptada | rechazada, y luego el seguimiento.
  add column if not exists etapa text not null default 'postulada';

alter table public.marcas enable row level security;
alter table public.campanias enable row level security;
alter table public.campania_aplicaciones enable row level security;
