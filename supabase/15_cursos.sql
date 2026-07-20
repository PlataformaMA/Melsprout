-- Módulos y clases gestionados desde el panel admin (currículum real).
create table if not exists public.cursos_modulos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text default '',
  color text default 'accent',              -- green | accent | amber
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cursos_clases (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.cursos_modulos(id) on delete cascade,
  titulo text not null,
  instructor text default 'Melissa',
  duracion_min int not null default 12,
  nivel text default 'basico',              -- basico | intermedio | avanzado
  video_url text,
  reto_texto text default '',
  revision text default 'auto',             -- auto | equipo
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cursos_modulos enable row level security;
alter table public.cursos_clases enable row level security;
drop policy if exists "cm_select" on public.cursos_modulos;
create policy "cm_select" on public.cursos_modulos for select using (auth.role() = 'authenticated');
drop policy if exists "cc_select" on public.cursos_clases;
create policy "cc_select" on public.cursos_clases for select using (auth.role() = 'authenticated');
-- Escrituras: admin con service role (verificado en el servidor).

-- ===== SEMBRADO del currículum BYI =====
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Básicos del Marketing Digital','Fundamentos para empezar con estrategia.','green',1);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Define tu audiencia objetivo','basico',10,'Aplica lo aprendido en «Define tu audiencia objetivo» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Objetivos de marketing','basico',10,'Aplica lo aprendido en «Objetivos de marketing» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo diferenciarte en un mundo competitivo','basico',10,'Aplica lo aprendido en «Cómo diferenciarte en un mundo competitivo» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Canales de comunicación','basico',10,'Aplica lo aprendido en «Canales de comunicación» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo construir una marca','basico',10,'Aplica lo aprendido en «Cómo construir una marca» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Estrategias de Marketing Digital','basico',10,'Aplica lo aprendido en «Estrategias de Marketing Digital» y compártelo en la comunidad.',6 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Mentalidad del Creador de Contenido','basico',10,'Aplica lo aprendido en «Mentalidad del Creador de Contenido» y compártelo en la comunidad.',7 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Definir tu Propuesta de Valor','basico',10,'Aplica lo aprendido en «Cómo Definir tu Propuesta de Valor» y compártelo en la comunidad.',8 from public.cursos_modulos where orden=1 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Las Bases para ser Viral','Cómo funciona Instagram por dentro.','accent',2);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Herramientas Esenciales de Instagram','basico',10,'Aplica lo aprendido en «Herramientas Esenciales de Instagram» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Errores Comunes en Instagram y Cómo Evitarlos','basico',10,'Aplica lo aprendido en «Errores Comunes en Instagram y Cómo Evitarlos» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Funciona el Algoritmo de Instagram','basico',10,'Aplica lo aprendido en «Cómo Funciona el Algoritmo de Instagram» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Hacks Para Volverse Viral en Instagram','intermedio',14,'Aplica lo aprendido en «Hacks Para Volverse Viral en Instagram» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=2 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Hackea el Algoritmo','Contenido que el algoritmo ama.','accent',3);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Metodología de Ideas Infinitas','intermedio',14,'Aplica lo aprendido en «Metodología de Ideas Infinitas» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Formatos de Contenidos de Instagram','basico',10,'Aplica lo aprendido en «Formatos de Contenidos de Instagram» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Tipos de Contenidos en Instagram','basico',10,'Aplica lo aprendido en «Tipos de Contenidos en Instagram» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Reels: Anatomía de un Reel Viral y Hooks','basico',10,'Aplica lo aprendido en «Reels: Anatomía de un Reel Viral y Hooks» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Historias: Por Qué y Cómo Hacer Stories','intermedio',14,'Aplica lo aprendido en «Historias: Por Qué y Cómo Hacer Stories» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Publicaciones y En Vivos','intermedio',14,'Aplica lo aprendido en «Publicaciones y En Vivos» y compártelo en la comunidad.',6 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Ideas de Contenidos en Instagram','intermedio',14,'Aplica lo aprendido en «Ideas de Contenidos en Instagram» y compártelo en la comunidad.',7 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Comunicación que Conecta con Instagram','intermedio',14,'Aplica lo aprendido en «Comunicación que Conecta con Instagram» y compártelo en la comunidad.',8 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Técnicas de Grabación: cámara, micrófono, luz, audio','basico',10,'Aplica lo aprendido en «Técnicas de Grabación: cámara, micrófono, luz, audio» y compártelo en la comunidad.',9 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Edición Básica en CapCut','basico',10,'Aplica lo aprendido en «Edición Básica en CapCut» y compártelo en la comunidad.',10 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Crear tu Estrategia de Contenidos Paso a Paso','intermedio',14,'Aplica lo aprendido en «Cómo Crear tu Estrategia de Contenidos Paso a Paso» y compártelo en la comunidad.',11 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Copywriting para Redes Sociales','intermedio',14,'Aplica lo aprendido en «Copywriting para Redes Sociales» y compártelo en la comunidad.',12 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Calendario de Contenido','intermedio',14,'Aplica lo aprendido en «Calendario de Contenido» y compártelo en la comunidad.',13 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Analizar Cuentas Exitosas','intermedio',14,'Aplica lo aprendido en «Cómo Analizar Cuentas Exitosas» y compártelo en la comunidad.',14 from public.cursos_modulos where orden=3 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Aumenta tus Seguidores','Construye comunidad y engagement.','amber',4);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Construir una Comunidad','intermedio',14,'Aplica lo aprendido en «Cómo Construir una Comunidad» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Pilares para Construir una Comunidad','intermedio',14,'Aplica lo aprendido en «Pilares para Construir una Comunidad» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Estrategias para Mejorar tu Engagement','intermedio',14,'Aplica lo aprendido en «Estrategias para Mejorar tu Engagement» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Prepara tu Perfil de Instagram para Vender','basico',10,'Aplica lo aprendido en «Prepara tu Perfil de Instagram para Vender» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Análisis y Métricas en Instagram','intermedio',14,'Aplica lo aprendido en «Análisis y Métricas en Instagram» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=4 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Convierte tus Seguidores en Dinero','Empieza a monetizar.','amber',5);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Oferta','avanzado',16,'Aplica lo aprendido en «Oferta» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Formas de ganar dinero con Instagram','intermedio',14,'Aplica lo aprendido en «Formas de ganar dinero con Instagram» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Prospectos','avanzado',16,'Aplica lo aprendido en «Prospectos» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Proceso de Venta y Embudo de Ventas','avanzado',16,'Aplica lo aprendido en «Proceso de Venta y Embudo de Ventas» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Cómo Poner Precio a tus Productos o Servicios','avanzado',16,'Aplica lo aprendido en «Cómo Poner Precio a tus Productos o Servicios» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=5 limit 1;
insert into public.cursos_modulos (nombre, descripcion, color, orden) values ('Estrategias para Aumentar tus Ventas','Vende más con estrategia.','amber',6);
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Testimonios y Prueba Social','avanzado',16,'Aplica lo aprendido en «Testimonios y Prueba Social» y compártelo en la comunidad.',1 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Storytelling','avanzado',16,'Aplica lo aprendido en «Storytelling» y compártelo en la comunidad.',2 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'En Vivo y Webinar','avanzado',16,'Aplica lo aprendido en «En Vivo y Webinar» y compártelo en la comunidad.',3 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'UGC','avanzado',16,'Aplica lo aprendido en «UGC» y compártelo en la comunidad.',4 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Venta Directa','avanzado',16,'Aplica lo aprendido en «Venta Directa» y compártelo en la comunidad.',5 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Llamadas a la Acción (Correo, Linktree, Link en Bio)','avanzado',16,'Aplica lo aprendido en «Llamadas a la Acción (Correo, Linktree, Link en Bio)» y compártelo en la comunidad.',6 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Automatizaciones y Mensajes','avanzado',16,'Aplica lo aprendido en «Automatizaciones y Mensajes» y compártelo en la comunidad.',7 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Base de Datos y Lead Magnet','avanzado',16,'Aplica lo aprendido en «Base de Datos y Lead Magnet» y compártelo en la comunidad.',8 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Incentivos','avanzado',16,'Aplica lo aprendido en «Incentivos» y compártelo en la comunidad.',9 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Canales de Venta en Instagram','avanzado',16,'Aplica lo aprendido en «Canales de Venta en Instagram» y compártelo en la comunidad.',10 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Atención al Cliente (Pre, Venta y Post)','avanzado',16,'Aplica lo aprendido en «Atención al Cliente (Pre, Venta y Post)» y compártelo en la comunidad.',11 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Herramientas para Empresas','avanzado',16,'Aplica lo aprendido en «Herramientas para Empresas» y compártelo en la comunidad.',12 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Técnicas Efectivas para Cerrar Ventas','avanzado',16,'Aplica lo aprendido en «Técnicas Efectivas para Cerrar Ventas» y compártelo en la comunidad.',13 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Manejo de Objeciones','avanzado',16,'Aplica lo aprendido en «Manejo de Objeciones» y compártelo en la comunidad.',14 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Gatillos Mentales','avanzado',16,'Aplica lo aprendido en «Gatillos Mentales» y compártelo en la comunidad.',15 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Email Marketing para Instagram','avanzado',16,'Aplica lo aprendido en «Email Marketing para Instagram» y compártelo en la comunidad.',16 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Fidelización y Recompra','avanzado',16,'Aplica lo aprendido en «Fidelización y Recompra» y compártelo en la comunidad.',17 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Escalamiento con Automatizaciones','avanzado',16,'Aplica lo aprendido en «Escalamiento con Automatizaciones» y compártelo en la comunidad.',18 from public.cursos_modulos where orden=6 limit 1;
insert into public.cursos_clases (modulo_id, titulo, nivel, duracion_min, reto_texto, orden) select id, 'Ecosistema Digital (IG→WhatsApp→Email→Venta)','avanzado',16,'Aplica lo aprendido en «Ecosistema Digital (IG→WhatsApp→Email→Venta)» y compártelo en la comunidad.',19 from public.cursos_modulos where orden=6 limit 1;
