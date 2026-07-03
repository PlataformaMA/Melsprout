import type { NextConfig } from "next";

// Cabeceras de seguridad aplicadas a TODAS las páginas.
const securityHeaders = [
  // Fuerza HTTPS siempre (2 años, incluye subdominios).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Nadie puede meter tu sitio dentro de un <iframe> (evita clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // El navegador no "adivina" tipos de archivo (evita ataques por MIME).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtrar la URL completa a otros sitios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva cámara, micrófono y ubicación (aún no se usan).
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Refuerza el anti-clickjacking en navegadores modernos.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // Oculta que la app corre en Next.js.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
