import type { MetadataRoute } from "next";

// Con esto el celular ofrece "Agregar a la pantalla de inicio": Melsprout queda
// con su ícono y abre en pantalla completa, sin la barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Melsprout",
    short_name: "Melsprout",
    description:
      "Aprende, crea y monetiza tu contenido paso a paso, con Melissa Arria.",
    lang: "es",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f7f8",
    theme_color: "#f7f7f8",
    categories: ["education"],
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      // Android recorta el ícono a la forma del sistema: esta versión trae el
      // pulpo más chico para que no le corte las patas.
      { src: "/icono-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
