-- Plan Boost Pro.
--
-- Mientras esta columna no exista, el candado de las clases en vivo está
-- apagado (ver src/lib/pro.ts): todo el mundo entra como hasta hoy. Al correr
-- esto, el bloqueo se enciende y solo pasan quienes tengan pro = true.
--
-- OJO: después de correrlo hay que marcar como Pro a quien ya pagó, si no se
-- quedan fuera de las clases en vivo.
alter table public.profiles
  add column if not exists pro boolean not null default false;

-- Para marcar a alguien a mano:
--   update public.profiles set pro = true where id = '<uuid>';
