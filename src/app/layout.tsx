import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// SIN esto, el móvil renderiza la página como escritorio zoomeado (nada responsive).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Color de la barra de estado cuando se abre instalada, para que no se vea
  // un bloque blanco encima de la app.
  themeColor: "#f7f7f8",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Melsprout · Conviértete en creador de contenido",
  description:
    "La plataforma donde una persona se convierte en creador. Aprende, crea, monetiza y escala — paso a paso.",
  applicationName: "Melsprout",
  // Instalada en el iPhone: abre sin la barra de Safari y con "Melsprout"
  // debajo del ícono.
  appleWebApp: { capable: true, title: "Melsprout", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        {/* Next ya pone la versión moderna (mobile-web-app-capable). Los iPhone
            anteriores a iOS 16.4 solo entienden esta, y sin ella la app
            instalada abre con la barra de Safari encima. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
