// Qué cuenta para que un perfil esté "completo". UN SOLO lugar: antes vivía
// repetido en tres (la tarjeta del perfil contaba 8 cosas, un recordatorio 5 y
// otro 4), así que alguien podía ver el anillo en 100% y recibir un aviso
// diciéndole que le faltaba algo.

export type DatosPerfil = {
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  ciudad?: string | null;
  nicho?: string | null;
  objetivo?: string | null;
  plataforma_principal?: string | null;
  redes?: Record<string, string | null | undefined> | null;
};

export type PartePerfil = { listo: boolean; que: string };

export function partesDelPerfil(p: DatosPerfil): PartePerfil[] {
  const tieneRedes = ["instagram", "tiktok", "youtube", "facebook", "twitter"].some((k) => !!p.redes?.[k]);
  return [
    { listo: !!p.avatar_url, que: "tu foto" },
    { listo: !!p.headline, que: "tu profesión" },
    { listo: !!p.bio, que: "tu descripción" },
    { listo: !!p.ciudad, que: "tu ciudad" },
    { listo: tieneRedes, que: "conectar una red social" },
    { listo: !!p.nicho, que: "tu nicho" },
    { listo: !!p.objetivo, que: "tu objetivo" },
    { listo: !!p.plataforma_principal, que: "tu plataforma principal" },
  ];
}

export function faltaDelPerfil(p: DatosPerfil): string[] {
  return partesDelPerfil(p).filter((x) => !x.listo).map((x) => x.que);
}

export function pctPerfil(p: DatosPerfil): number {
  const partes = partesDelPerfil(p);
  return Math.round((partes.filter((x) => x.listo).length / partes.length) * 100);
}

// "tu foto, tu ciudad y tu nicho"
export function enLista(faltan: string[]): string {
  if (faltan.length <= 1) return faltan[0] ?? "";
  return `${faltan.slice(0, -1).join(", ")} y ${faltan[faltan.length - 1]}`;
}
