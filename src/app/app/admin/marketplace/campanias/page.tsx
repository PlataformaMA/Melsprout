import { MktPendiente } from "@/components/MktPendiente";

export default function CampaniasPage() {
  return (
    <MktPendiente
      titulo="Campañas"
      pie="Todas las campañas de la plataforma, de cualquier marca."
      falta={[
        "La lista con portada, estatus, fechas y pago de cada campaña",
        "El detalle con Información, Creadores, Colaboraciones y Envíos",
        "Ver respuestas y perfil de cada creador postulado",
        "Revisar el video final: aprobarlo o mandar comentarios",
      ]}
    />
  );
}
