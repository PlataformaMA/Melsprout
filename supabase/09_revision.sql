-- Estado de revisión del equipo para los retos que la requieren.
alter table public.reto_submissions
  add column if not exists revision text not null default 'pendiente'
  check (revision in ('pendiente','aprobado','rechazado'));
