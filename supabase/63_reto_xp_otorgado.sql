-- Se anota el XP realmente pagado por cada entrega: así no se puede volver a
-- cobrar el mismo reto (rechazado → borrador → publicar daba XP otra vez).
alter table public.reto_submissions add column if not exists xp_otorgado integer not null default 0;

-- Las políticas de update dejaban cambiar cualquier columna desde el navegador
-- (ponerse revision='aprobado', por ejemplo). Se limita por columnas.
revoke update on public.reto_submissions from authenticated;
grant update (respuestas, archivo_url, estado, updated_at) on public.reto_submissions to authenticated;

revoke update on public.clase_progreso from authenticated;
grant update (segundos_vistos, updated_at) on public.clase_progreso to authenticated;

-- El insert también hay que limitarlo: sin esto se podía crear la fila ya
-- "completada" o "aprobada" desde el navegador.
revoke insert on public.clase_progreso from authenticated;
grant insert (user_id, clase_id, segundos_vistos, updated_at) on public.clase_progreso to authenticated;

-- Las entregas de retos las escribe el servidor (guardarReto usa la llave de
-- servicio para fijar el XP y la revisión).
revoke insert, update on public.reto_submissions from authenticated;
