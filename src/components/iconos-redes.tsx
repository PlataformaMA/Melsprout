// Íconos de marca compartidos (perfil + flujo de completar perfil).

export function InstagramIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
export function TikTokIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 1.9 4 4 4.3v3c-1.5 0-2.9-.4-4-1.1V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3z" /></svg>;
}
export function YouTubeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.8 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1c.2-1.2.2-2.5.2-3.8s0-2.6-.2-3.8zM10 15V9l5.2 3z" /></svg>;
}
export function FacebookIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V7c0-1 .3-1.5 1.6-1.5H17V2.2C16.6 2.1 15.5 2 14.4 2 11.8 2 10 3.6 10 6.5V9H7.5v3.5H10V22h4v-9.5h2.7l.4-3.5z" /></svg>;
}

// Fondo/estilo de cada red (para el círculo del ícono).
export const REDES_ESTILO: Record<string, { nombre: string; bg: string }> = {
  instagram: { nombre: "Instagram", bg: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" },
  tiktok: { nombre: "TikTok", bg: "#111827" },
  youtube: { nombre: "YouTube", bg: "#FF0000" },
  facebook: { nombre: "Facebook", bg: "#1877F2" },
};

export function IconoRed({ red }: { red: string }) {
  if (red === "instagram") return <InstagramIcon />;
  if (red === "tiktok") return <TikTokIcon />;
  if (red === "youtube") return <YouTubeIcon />;
  if (red === "facebook") return <FacebookIcon />;
  return null;
}
