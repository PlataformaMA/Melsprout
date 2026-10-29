-- Campañas exclusivas de un curso.
--
-- La de embajadores de Boost Your Web es solo para quien compró ese curso.
-- Hasta hoy el Marketplace no sabía distinguir eso: o lo veías porque tienes
-- Boost Pro, o no lo veías. Con esta columna, una campaña puede decir "soy de
-- este curso", y entonces:
--
--   · la ven SOLO quienes tienen ese curso (aunque tengan Pro no entran si no
--     lo compraron: es una convocatoria cerrada, no un extra del plan);
--   · y la ven AUNQUE NO tengan Pro, porque el boleto de entrada es el curso.
--
-- Las campañas normales no cambian: siguen siendo de Boost Pro.

alter table public.campanias
  add column if not exists requiere_curso uuid
    references public.cursos_modulos(id) on delete set null;

create index if not exists campanias_requiere_curso_idx
  on public.campanias (requiere_curso) where requiere_curso is not null;
