// Lo mínimo para que, sin internet, la app muestre la pantalla de Melsprout en
// lugar del error del navegador. A propósito NO guarda copias de la plataforma:
// así nadie se queda con una versión vieja después de un despliegue.
const CACHE = "melsprout-sin-conexion-v1";
const PAGINA = "/sin-conexion";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([PAGINA, "/icono-192.png", "/octi-correo.png"]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Solo las navegaciones: todo lo demás va a la red como siempre.
  if (req.method !== "GET" || req.mode !== "navigate") return;
  e.respondWith(fetch(req).catch(() => caches.match(PAGINA)));
});
