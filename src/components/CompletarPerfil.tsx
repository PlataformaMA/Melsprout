"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Octi } from "@/components/Octi";
import { AvatarUploader } from "@/components/AvatarUploader";
import { guardarCampos, type Perfil } from "@/lib/perfil-actions";
import { PAISES, banderaUrl } from "@/lib/catalogos";
import { estadosDe } from "@/lib/estados";
import { IconoRed, REDES_ESTILO } from "@/components/iconos-redes";

const STEPS = ["foto", "usuario", "edad", "headline", "bio", "ubicacion", "redes", "conectar"] as const;
type Step = (typeof STEPS)[number];

const MENSAJES: Record<Step, string> = {
  foto: "¡Ponle cara a tu perfil! 📸 Una buena foto genera confianza.",
  usuario: "Elige tu nombre de usuario. Así te verán en Melsprout. ✨",
  edad: "¿Cuándo naciste? Nos ayuda a personalizar tu experiencia. 🎂",
  headline: "Tu headline dice quién eres en una frase. ✍️",
  bio: "Cuéntale al mundo tu historia. Las marcas leen esto. 💜",
  ubicacion: "¿De dónde creas? Conecta con tu audiencia local. 🌎",
  redes: "Suma tus @ para que te encuentren en todos lados. 🌐",
  conectar: "¡Lo mejor! Conecta tus redes y muestra tus seguidores reales. 🚀",
};

const PLATAFORMAS = [
  { key: "instagram", connect: "/api/instagram/connect" },
  { key: "tiktok", connect: "/api/tiktok/connect" },
  { key: "youtube", connect: "/api/youtube/connect" },
] as const;

function edadDe(fecha: string): number | null {
  if (!fecha) return null;
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e > 0 && e < 120 ? e : null;
}

export function CompletarPerfil({
  perfil, pasoInicial, resultado, configurado,
}: {
  perfil: Perfil;
  pasoInicial?: string;
  resultado?: string;
  configurado: { instagram: boolean; tiktok: boolean; youtube: boolean };
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const inicial = pasoInicial ? STEPS.indexOf(pasoInicial as Step) : 0;
  const [idx, setIdx] = useState(inicial >= 0 ? inicial : 0);

  const [username, setUsername] = useState(perfil.username ?? "");
  const [fechaNac, setFechaNac] = useState(perfil.fecha_nacimiento?.slice(0, 10) ?? "");
  const [headline, setHeadline] = useState(perfil.headline ?? "");
  const [bio, setBio] = useState(perfil.bio ?? "");
  const [pais, setPais] = useState(perfil.pais ?? "");
  const [estado, setEstado] = useState(perfil.estado ?? "");
  const [ciudad, setCiudad] = useState(perfil.ciudad ?? "");
  const [insta, setInsta] = useState(perfil.redes?.instagram ?? "");
  const [tiktok, setTiktok] = useState(perfil.redes?.tiktok ?? "");
  const [youtube, setYoutube] = useState(perfil.redes?.youtube ?? "");

  const terminado = idx >= STEPS.length;
  const step = STEPS[idx];
  const listaEstados = estadosDe(pais);

  function avanzar() {
    setIdx((n) => n + 1);
  }
  function continuar() {
    startTransition(async () => {
      if (step === "usuario") await guardarCampos({ username });
      else if (step === "edad") await guardarCampos({ fecha_nacimiento: fechaNac });
      else if (step === "headline") await guardarCampos({ headline });
      else if (step === "bio") await guardarCampos({ bio });
      else if (step === "ubicacion") await guardarCampos({ pais, estado, ciudad });
      else if (step === "redes") await guardarCampos({ redes: { instagram: insta, tiktok, youtube } });
      avanzar();
    });
  }

  if (terminado) {
    return (
      <Marco>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <Octi size={170} celebrando conBurbuja={false} />
          <h1 className="font-display text-3xl font-extrabold mt-6">¡Perfil listo! 🎉</h1>
          <p className="text-sub mt-2 max-w-sm">Tu media kit se ve increíble. Las marcas ya te pueden conocer mejor.</p>
          <button onClick={() => { router.replace("/app/perfil"); router.refresh(); }}
            className="mt-8 bg-accent text-white font-bold rounded-2xl px-8 py-4 shadow-lg shadow-accent/30 hover:brightness-110 hover:scale-[1.03] active:scale-95 transition">
            Ver mi perfil →
          </button>
        </div>
      </Marco>
    );
  }

  return (
    <Marco>
      <div className="px-6 pt-6 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, n) => (
            <div key={n} className="h-2 flex-1 rounded-full bg-white/60 overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: n < idx ? "100%" : n === idx ? "50%" : "0%" }} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-sub font-bold tracking-wide">PASO {idx + 1} DE {STEPS.length}</p>
          <button onClick={() => { router.replace("/app/perfil"); router.refresh(); }}
            className="text-[12px] text-hint hover:text-sub">Salir</button>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-6 flex flex-col">
        <div className="flex justify-center mb-3">
          <Octi size={116} mensaje={MENSAJES[step]} />
        </div>

        <div key={step} className="onb-slide flex-1">
          <div className="bg-white/85 backdrop-blur rounded-3xl border border-white shadow-xl shadow-accent/5 p-6">
            {step === "foto" && (
              <Bloque titulo="Sube tu foto de perfil">
                <div className="flex justify-center py-2">
                  <AvatarUploader avatarUrl={perfil.avatar_url} nombre={perfil.full_name ?? ""} size={120} />
                </div>
                <p className="text-center text-[12px] text-hint">Toca la cámara para elegir tu foto.</p>
              </Bloque>
            )}

            {step === "usuario" && (
              <Bloque titulo="Elige tu nombre de usuario">
                <div className="flex items-center gap-1 rounded-xl border-2 border-border bg-white px-3.5 focus-within:border-accent transition">
                  <span className="text-sub text-lg font-bold">@</span>
                  <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} maxLength={30}
                    placeholder="tu_usuario"
                    className="flex-1 bg-transparent py-3 text-sm outline-none lowercase" />
                </div>
                <p className="text-[12px] text-hint mt-2">Solo letras, números, punto y guion bajo. Así te verán: <b className="text-accent">@{username || "tu_usuario"}</b></p>
              </Bloque>
            )}

            {step === "edad" && (
              <Bloque titulo="¿Cuál es tu fecha de nacimiento?">
                <input type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition" />
                {edadDe(fechaNac) && <p className="text-[12px] text-hint mt-2">Tienes <b className="text-accent">{edadDe(fechaNac)} años</b> 🎉</p>}
              </Bloque>
            )}

            {step === "headline" && (
              <Bloque titulo="¿Cuál es tu título?">
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80}
                  placeholder="Ej. Creo contenido de moda 👗"
                  className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition" />
              </Bloque>
            )}

            {step === "bio" && (
              <Bloque titulo="Cuéntanos sobre ti">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={400}
                  placeholder="Quién eres, qué creas, qué te hace única…"
                  className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition resize-none" />
                <p className="text-[11px] text-hint mt-1 text-right">{bio.length}/400</p>
              </Bloque>
            )}

            {step === "ubicacion" && (
              <Bloque titulo="¿De dónde eres?">
                <div className="space-y-3">
                  {/* País */}
                  <div>
                    <label className="text-[12px] font-semibold text-sub mb-1 block">País</label>
                    <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-white px-3 focus-within:border-accent transition">
                      {banderaUrl(pais)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={banderaUrl(pais)!} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-black/10 shrink-0" />
                        : <span className="text-lg">🌎</span>}
                      <select value={pais} onChange={(e) => { setPais(e.target.value); setEstado(""); }}
                        className="flex-1 bg-transparent py-3 text-sm outline-none">
                        <option value="">Selecciona tu país</option>
                        {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Estado / Provincia */}
                  <div>
                    <label className="text-[12px] font-semibold text-sub mb-1 block">Estado / Provincia</label>
                    {listaEstados ? (
                      <select value={estado} onChange={(e) => setEstado(e.target.value)}
                        className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition">
                        <option value="">Selecciona tu estado</option>
                        {listaEstados.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={60}
                        placeholder={pais ? "Escribe tu estado o provincia" : "Primero elige tu país"}
                        disabled={!pais}
                        className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition disabled:opacity-60" />
                    )}
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="text-[12px] font-semibold text-sub mb-1 block">Ciudad</label>
                    <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={60}
                      placeholder="Ej. Monterrey"
                      className="w-full rounded-xl border-2 border-border bg-white px-3.5 py-3 text-sm outline-none focus:border-accent transition" />
                  </div>
                </div>
              </Bloque>
            )}

            {step === "redes" && (
              <Bloque titulo="Tus redes sociales">
                <p className="text-center text-[12px] text-hint mb-3">Pega el <b className="text-accent">link</b> de tu perfil en cada red.</p>
                <div className="space-y-2.5">
                  {[
                    { key: "instagram", ph: "https://instagram.com/tu_usuario", v: insta, set: setInsta },
                    { key: "tiktok", ph: "https://tiktok.com/@tu_usuario", v: tiktok, set: setTiktok },
                    { key: "youtube", ph: "https://youtube.com/@tu_canal", v: youtube, set: setYoutube },
                  ].map((r) => (
                    <div key={r.key} className="flex items-center gap-2.5 rounded-xl border-2 border-border bg-white px-3 focus-within:border-accent transition">
                      <span className="w-8 h-8 rounded-lg grid place-items-center text-white shrink-0" style={{ background: REDES_ESTILO[r.key].bg }}>
                        <IconoRed red={r.key} />
                      </span>
                      <input value={r.v} onChange={(e) => r.set(e.target.value)} placeholder={r.ph} type="url" inputMode="url"
                        className="flex-1 bg-transparent py-3 text-sm outline-none" />
                    </div>
                  ))}
                </div>
              </Bloque>
            )}

            {step === "conectar" && (
              <Bloque titulo="Conecta y trae tus métricas">
                <p className="text-center text-sub text-[13px] mb-4">Conecta tus cuentas para mostrar tus seguidores reales. ✅</p>
                <div className="space-y-3">
                  {PLATAFORMAS.map((p) => {
                    const metric = perfil.metricas?.[p.key];
                    const conf = configurado[p.key as keyof typeof configurado];
                    const err = resultado === `${p.key}_err`;
                    return (
                      <div key={p.key} className="flex items-center gap-3 bg-bg rounded-2xl p-3.5">
                        <div className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: REDES_ESTILO[p.key].bg }}>
                          <IconoRed red={p.key} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-text">{REDES_ESTILO[p.key].nombre}</div>
                          {metric?.username ? (
                            <div className="text-[12px] text-sub truncate">
                              @{metric.username}
                              {typeof metric.followers === "number" && ` · ${metric.followers.toLocaleString()} seguidores`}
                            </div>
                          ) : err ? (
                            <div className="text-[12px] text-pink">No se pudo conectar. Reintenta.</div>
                          ) : (
                            <div className="text-[12px] text-hint">Sin conectar</div>
                          )}
                        </div>
                        {metric?.username ? (
                          <span className="text-green text-sm font-bold">✅</span>
                        ) : conf ? (
                          <a href={p.connect} className="text-white text-[13px] font-bold rounded-xl px-3.5 py-2 hover:brightness-110 transition shrink-0" style={{ background: REDES_ESTILO[p.key].bg }}>
                            Conectar
                          </a>
                        ) : (
                          <span className="text-[11px] text-hint shrink-0">Pronto</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Bloque>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={avanzar} disabled={pendiente} className="text-sm font-semibold text-sub hover:text-text px-5 py-3.5">Saltar</button>
          <button
            onClick={step === "foto" || step === "conectar" ? avanzar : continuar}
            disabled={pendiente}
            className="flex-1 bg-accent text-white font-bold text-sm rounded-2xl py-3.5 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 disabled:opacity-60 transition">
            {pendiente ? "Guardando…" : idx === STEPS.length - 1 ? "Terminar 🎉" : "Continuar"}
          </button>
        </div>
      </div>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-accent-soft via-bg to-pink-soft" />
      <div className="fixed -z-10 top-[-120px] left-[-100px] w-[360px] h-[360px] rounded-full bg-accent/20 blur-3xl onb-blob" />
      <div className="fixed -z-10 bottom-[-140px] right-[-120px] w-[400px] h-[400px] rounded-full bg-pink/20 blur-3xl onb-blob" style={{ animationDelay: "2s" }} />
      {children}
    </main>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-center mb-4">{titulo}</h1>
      {children}
    </div>
  );
}
