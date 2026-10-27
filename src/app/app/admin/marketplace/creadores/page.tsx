import { MktPendiente } from "@/components/MktPendiente";

export default function CreadoresPage() {
  return (
    <MktPendiente
      titulo="Creadores destacados"
      pie="Los creadores que el equipo pone al frente de las marcas."
      falta={[
        "La cuadrícula con foto, nicho, redes y métricas de cada creador",
        "Buscar, filtrar y ordenar",
        "Marcar y desmarcar quién va destacado",
        "Exportar la selección",
      ]}
    />
  );
}
