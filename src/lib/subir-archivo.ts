"use client";

import { createClient } from "@/lib/supabase/client";

// Subidas desde el navegador. Cada quien escribe SOLO dentro de su carpeta
// `u/<su id>/…` (así lo exige la política del bucket, ver supabase/62), y aquí
// se valida el tipo y el tamaño: antes cualquiera podía mandar un archivo de
// cualquier tipo a una ruta predecible y pisar el de alguien más.

const IMAGENES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
const VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];

export type Subida = { url: string; ruta: string } | { error: string };

export async function subirArchivoUsuario(
  file: File,
  carpeta: "comunidad" | "grupos" | "retos",
  opciones: { tipo?: "imagen" | "video"; maxMB?: number } = {},
): Promise<Subida> {
  const tipo = opciones.tipo ?? "imagen";
  const maxMB = opciones.maxMB ?? (tipo === "video" ? 200 : 8);
  const permitidos = tipo === "video" ? VIDEOS : IMAGENES;

  if (!permitidos.includes(file.type)) {
    return { error: tipo === "video" ? "Sube un video MP4 o MOV." : "Sube una imagen (JPG, PNG o WEBP)." };
  }
  if (file.size > maxMB * 1024 * 1024) {
    return { error: `El archivo pasa de ${maxMB} MB.` };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  // La extensión sale del TIPO real del archivo, no de su nombre.
  const ext = (file.type.split("/")[1] || "bin").replace("quicktime", "mov").replace("jpeg", "jpg");
  const ruta = `u/${user.id}/${carpeta}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("retos")
    .upload(ruta, file, { upsert: true, contentType: file.type });
  if (error) return { error: "No se pudo subir el archivo." };

  return { url: supabase.storage.from("retos").getPublicUrl(ruta).data.publicUrl, ruta };
}
