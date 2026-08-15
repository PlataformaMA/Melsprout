-- Melsprout · Seguir ahora es una SOLICITUD que la otra persona acepta.
-- Antes era unidireccional e inmediato; ahora la fila nace 'pendiente' y solo
-- cuenta como seguidor (y abre el chat) cuando el seguido la acepta.

-- Lo que ya existia se queda aceptado: nadie tiene que re-aceptar seguimientos viejos.
alter table public.seguidores
  add column if not exists estado text not null default 'aceptado';

-- ...pero de aqui en adelante lo nuevo nace pendiente.
alter table public.seguidores alter column estado set default 'pendiente';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'seguidores_estado_chk'
  ) then
    alter table public.seguidores
      add constraint seguidores_estado_chk check (estado in ('pendiente', 'aceptado'));
  end if;
end $$;

create index if not exists seguidores_pendientes_idx
  on public.seguidores (seguido_id) where estado = 'pendiente';

-- El seguido puede aceptar (update) y tambien rechazar/quitar (delete).
drop policy if exists "seg_update" on public.seguidores;
create policy "seg_update" on public.seguidores
  for update to authenticated
  using (auth.uid() = seguido_id)
  with check (auth.uid() = seguido_id);

drop policy if exists "seg_delete" on public.seguidores;
create policy "seg_delete" on public.seguidores
  for delete to authenticated
  using (auth.uid() = seguidor_id or auth.uid() = seguido_id);
