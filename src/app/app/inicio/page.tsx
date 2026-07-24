import { redirect } from "next/navigation";

// La pantalla de Inicio quedó retirada: siempre reenviamos a la Ruta de aprendizaje.
export default async function InicioPage() {
  redirect("/app/ruta");
}
