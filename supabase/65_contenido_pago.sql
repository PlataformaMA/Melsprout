-- P1-8: cualquier usuario con sesión podía leer por REST las clases y los
-- recursos de un curso de pago (incluida la URL del video) sin haberlo comprado.
-- Ahora el catálogo solo deja ver lo de la Ruta y lo de los cursos que compró.

drop policy if exists cc_select on public.cursos_clases;
create policy cc_select on public.cursos_clases for select to authenticated
using (
  exists (
    select 1 from public.cursos_modulos m
    where m.id = cursos_clases.modulo_id
      and m.activo = true
      and (
        m.especial is not true                              -- clases de la Ruta
        or public.es_admin()
        or exists (select 1 from public.curso_accesos a
                   where a.modulo_id = m.id and a.user_id = auth.uid())
      )
  )
);

drop policy if exists cm_select on public.cursos_modulos;
create policy cm_select on public.cursos_modulos for select to authenticated
using (activo = true);   -- el módulo (nombre, portada, precio) sí es público: es la vitrina

drop policy if exists recursos_select on public.recursos;
create policy recursos_select on public.recursos for select to authenticated
using (
  activo = true and (
    clase_id is null                                        -- recompensas y material general
    or public.es_admin()
    or exists (
      select 1 from public.cursos_clases c
      join public.cursos_modulos m on m.id = c.modulo_id
      where c.id::text = recursos.clase_id
        and (m.especial is not true
             or exists (select 1 from public.curso_accesos a
                        where a.modulo_id = m.id and a.user_id = auth.uid()))
    )
  )
);

-- P1-16: las clases en vivo que no están publicadas no se listan, y el enlace
-- de la sesión solo lo entrega el servidor.
drop policy if exists vivo_select on public.clases_vivo;
create policy vivo_select on public.clases_vivo for select to authenticated
using (activo = true);

-- P1-11: la solicitud de amistad entraba ya "aceptada" desde el navegador.
drop policy if exists seg_insert on public.seguidores;
create policy seg_insert on public.seguidores for insert to authenticated
with check (auth.uid() = seguidor_id and estado = 'pendiente');
revoke update on public.seguidores from authenticated;
grant update (estado) on public.seguidores to authenticated;
