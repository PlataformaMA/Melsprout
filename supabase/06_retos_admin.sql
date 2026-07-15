-- Catálogo de retos creados desde el panel admin (vive en BD, no en código).
create table if not exists public.retos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'semanal' check (tipo in ('curso','semanal','grupal','personal')),
  clase_id text,               -- para tipo 'curso' (liga a una clase de data.ts)
  titulo text not null,
  emoji text default '🎯',
  descripcion text default '',
  intro text default '',
  accion text default 'compartirlo',
  xp int not null default 50,
  pasos jsonb not null default '[]'::jsonb,   -- [{id,titulo,subtitulo,tipo,placeholder,max,acepta,ayudaArchivo,archivoImagen,octi}]
  tips jsonb,                                 -- {titulo, items:[]}
  sobre jsonb,                                -- ["...","..."]
  ejemplo jsonb,                              -- {autor,rol,tituloCard,bloques:[]}
  consejo text default '',
  activo boolean not null default true,
  orden int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retos enable row level security;

-- Cualquier usuario autenticado puede LEER los retos activos.
-- Las escrituras las hace el panel admin con la service role (bypassa RLS),
-- previa verificación del correo admin en el servidor.
drop policy if exists "retos_select" on public.retos;
create policy "retos_select" on public.retos
  for select using (auth.role() = 'authenticated');
