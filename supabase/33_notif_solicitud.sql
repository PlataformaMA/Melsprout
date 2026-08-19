-- Melsprout · Tipo de notificacion para las solicitudes de seguimiento.
-- Asi la campana puede mostrarlas distinto y con botones de Aceptar / Rechazar.
alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones
  add constraint notificaciones_tipo_check
  check (tipo in ('general','reto','comentario','like','racha','nivel','clase','solicitud'));
