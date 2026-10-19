"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { CampanaNotificaciones } from "@/components/CampanaNotificaciones";
import { STICKERS, stickerDe } from "@/lib/stickers";
import { InvitarCard } from "@/components/InvitarCard";
import { enviarSticker, enviarMensaje, getConversacion, marcarActividad, type Amigo, type Mensaje } from "@/lib/chat-actions";

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}
function dia(iso: string) {
  const d = new Date(iso), hoy = new Date();
  const mismo = d.toDateString() === hoy.toDateString();
  return mismo ? "Hoy" : d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

export function ChatVista({
  amigo, mensajesIniciales, amigos, yoAvatar, yoId,
}: {
  amigo: Amigo;
  mensajesIniciales: Mensaje[];
  amigos: Amigo[];
  yoId: string;
  yoAvatar: string | null;
}) {
  const [msgs, setMsgs] = useState<Mensaje[]>(mensajesIniciales);
  const [enLinea, setEnLinea] = useState(amigo.enLinea);
  const [todos, setTodos] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorChat, setErrorChat] = useState("");
  const [, startTransition] = useTransition();
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  // Latido de presencia + refresco de la conversación. Un minuto para el latido,
  // 15 s para traer mensajes nuevos: suficiente para que se sienta vivo sin
  // castigar la batería ni la base.
  useEffect(() => {
    marcarActividad();
    const latido = setInterval(() => marcarActividad(), 60_000);
    const refresco = setInterval(async () => {
      const r = await getConversacion(amigo.id);
      setMsgs(r.mensajes);
      if (r.amigo) setEnLinea(r.amigo.enLinea);
    }, 15_000);
    return () => { clearInterval(latido); clearInterval(refresco); };
  }, [amigo.id]);

  function mandar(clave: string) {
    // Se pinta al momento; el refresco lo reemplaza por el real del servidor.
    const provisional: Mensaje = {
      id: `tmp-${clave}-${msgs.length}`, sticker: clave, texto: null, mio: true, leido: false,
      fecha: new Date().toISOString(),
    };
    setMsgs((m) => [...m, provisional]);
    startTransition(async () => { await enviarSticker(amigo.id, clave); });
  }

  // Mandar lo escrito. Se pinta al momento y, si el servidor lo rechaza, se
  // quita y se devuelve el texto a la caja para que no se pierda.
  async function escribir() {
    const t = texto.trim();
    if (!t || enviando) return;
    const provisional: Mensaje = {
      id: `tmp-txt-${msgs.length}`, sticker: null, texto: t, mio: true, leido: false,
      fecha: new Date().toISOString(),
    };
    setMsgs((m) => [...m, provisional]);
    setTexto("");
    setEnviando(true);
    const r = await enviarMensaje(amigo.id, t);
    setEnviando(false);
    if ("error" in r) {
      setMsgs((m) => m.filter((x) => x.id !== provisional.id));
      setTexto(t);
      setErrorChat(r.error);
    }
  }

  const visibles = todos ? STICKERS : STICKERS.slice(0, 5);

  return (
    <div className="min-h-screen bg-bg flex">
      <AppSidebar active="amigos" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <Link href="/app/amigos"
              className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center hover:border-accent/40 transition"
              aria-label="Volver">←</Link>
            <CampanaNotificaciones />
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
            <section className="bg-surface border border-border rounded-3xl shadow-sm flex flex-col" style={{ height: "72vh" }}>
              {/* Cabecera */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Avatar url={amigo.avatar} nombre={amigo.nombre} size={44} />
                <div>
                  <h1 className="font-display text-lg font-extrabold leading-tight">Chat con {amigo.nombre.split(" ")[0]}</h1>
                  <p className="text-[12.5px] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${enLinea ? "bg-green" : "bg-hint"}`} />
                    <span className={enLinea ? "text-green" : "text-hint"}>{enLinea ? "En línea" : "Sin conexión"}</span>
                  </p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
                {msgs.length === 0 && (
                  <p className="text-center text-sub text-[13px] py-10">
                    Escríbele o mándale una felicitación para romper el hielo. 💜
                  </p>
                )}
                {msgs.map((m, i) => {
                  const s = m.sticker ? stickerDe(m.sticker) : null;
                  const nuevoDia = i === 0 || dia(msgs[i - 1].fecha) !== dia(m.fecha);
                  return (
                    <div key={m.id}>
                      {nuevoDia && (
                        <p className="text-center text-[11.5px] text-hint my-3">{dia(m.fecha)}, {hora(m.fecha)}</p>
                      )}
                      <div className={`flex items-end gap-2 ${m.mio ? "flex-row-reverse" : ""}`}>
                        <Avatar url={m.mio ? yoAvatar : amigo.avatar} nombre={m.mio ? "Yo" : amigo.nombre} size={28} />
                        <div className={`max-w-[68%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          m.mio ? "bg-accent-soft" : "bg-bg border border-border"
                        }`}>
                          {m.texto ? (
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
                          ) : (
                          <div className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/octi.png" alt="" className="octi-vivo w-9 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-display font-extrabold text-[13.5px] leading-tight">
                                {s?.titulo ?? "¡Ánimo!"} {s?.emoji}
                              </p>
                              {s?.cuerpo && <p className="text-[12px] text-sub leading-snug">{s.cuerpo}</p>}
                            </div>
                          </div>
                          )}
                          {m.mio && (
                            <p className="text-[10.5px] text-hint text-right mt-1">
                              {hora(m.fecha)} {m.leido ? "✓✓" : "✓"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={fin} />
              </div>

              {/* Escribir. Los stickers siguen debajo, para quien prefiere eso. */}
              <form onSubmit={(e) => { e.preventDefault(); escribir(); }}
                className="border-t border-border p-3 flex items-end gap-2">
                <textarea value={texto} rows={1}
                  onChange={(e) => { setTexto(e.target.value); setErrorChat(""); }}
                  onKeyDown={(e) => {
                    // Enter manda; Shift+Enter hace salto de línea.
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); escribir(); }
                  }}
                  placeholder={`Escríbele a ${amigo.nombre.split(" ")[0]}…`} maxLength={2000}
                  className="flex-1 min-w-0 bg-bg border border-border rounded-2xl px-4 py-2.5 text-[14px] outline-none focus:border-accent resize-none max-h-32" />
                <button type="submit" disabled={!texto.trim() || enviando}
                  aria-label="Enviar mensaje"
                  className="shrink-0 w-11 h-11 rounded-full bg-accent text-white grid place-items-center hover:brightness-110 active:scale-95 transition disabled:opacity-40">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 12 20 4l-4 16-4.5-6.5z" /><path d="m11.5 13.5 8.5-9.5" />
                  </svg>
                </button>
              </form>
              {errorChat && <p className="text-[12px] text-pink px-4 pb-2">{errorChat}</p>}

              {/* Stickers */}
              <div className="border-t border-border p-3 flex items-center gap-2 overflow-x-auto">
                <button onClick={() => setTodos((v) => !v)}
                  className="w-10 h-10 shrink-0 rounded-full bg-accent text-white grid place-items-center text-lg font-bold hover:brightness-110 transition"
                  aria-label={todos ? "Ver menos stickers" : "Ver más stickers"}>
                  {todos ? "−" : "+"}
                </button>
                {visibles.map((s) => (
                  <button key={s.clave} onClick={() => mandar(s.clave)}
                    className="shrink-0 w-[74px] rounded-xl border border-border hover:border-accent hover:bg-accent-soft/50 transition p-1.5 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/octi.png" alt="" className="octi-vivo w-8 mx-auto" />
                    <span className="block text-[9.5px] font-bold leading-tight mt-0.5 truncate">{s.titulo}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Más amigos */}
            <aside className="space-y-4">
              <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
                <h3 className="font-display font-extrabold text-[15px] mb-3">Otros chats</h3>
                <div className="space-y-1">
                  {amigos.filter((a) => a.id !== amigo.id).map((a) => (
                    <Link key={a.id} href={`/app/amigos/${a.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-bg transition">
                      <div className="relative shrink-0">
                        <Avatar url={a.avatar} nombre={a.nombre} size={34} />
                        {a.sinLeer > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold grid place-items-center">
                            {a.sinLeer > 9 ? "9" : a.sinLeer}
                          </span>
                        )}
                      </div>
                      <span className="text-[13.5px] font-semibold truncate">{a.nombre}</span>
                      {a.enLinea && <span className="ml-auto w-2 h-2 rounded-full bg-green shrink-0" />}
                    </Link>
                  ))}
                  {amigos.length <= 1 && <p className="text-[13px] text-hint px-2">Aún no tienes más chats aquí.</p>}
                </div>
              </section>

              <InvitarCard userId={yoId} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Avatar({ url, nombre, size }: { url: string | null; nombre: string; size: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={nombre} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <span className="rounded-full bg-accent/15 text-accent grid place-items-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size / 2.8 }}>
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  );
}
