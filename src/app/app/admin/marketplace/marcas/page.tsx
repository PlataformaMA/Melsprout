import { MktPendiente } from "@/components/MktPendiente";

export default function MarcasPage() {
  return (
    <MktPendiente
      titulo="Marcas"
      pie="Todas las marcas registradas en la plataforma."
      falta={[
        "La cuadrícula con logo, categoría, campañas, creadores y calificación",
        "Los filtros por categoría, estatus y país",
        "La ficha de la marca: información, redes, dirección y contacto",
        "Los archivos de la marca (contrato, factura, datos bancarios)",
      ]}
    />
  );
}
