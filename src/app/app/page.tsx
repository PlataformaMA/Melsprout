import { redirect } from "next/navigation";

// El inicio va directo a la Ruta de Aprendizaje (con Octi saludando).
export default function AppHome() {
  redirect("/app/ruta");
}
