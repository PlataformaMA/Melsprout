import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")), l.slice(l.indexOf("=")+1).trim()]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: mods } = await sb.from("cursos_modulos").select("id, nombre").eq("activo", true).eq("especial", true);
const byw = mods.find(m => /boost your web/i.test(m.nombre));
const { data: clases } = await sb.from("cursos_clases").select("id, titulo, duracion_min").eq("modulo_id", byw.id).eq("activo", true).order("duracion_min");
const corta = clases[0];
console.log("probando con la clase más corta:", corta.titulo, `(${corta.duracion_min} min)`);
const correo = `prueba.vel.${Date.now()}@resend.dev`;
const { data: creado } = await sb.auth.admin.createUser({ email: correo, email_confirm: true });
const uid = creado.user.id;
await sb.from("profiles").upsert({ id: uid, full_name: "Prueba Vel", onboarding_completo: true, xp: 0 });
await sb.from("curso_accesos").insert({ user_id: uid, modulo_id: byw.id });
const { data: link } = await sb.auth.admin.generateLink({ type: "magiclink", email: correo });
const espera = (ms) => new Promise(r => setTimeout(r, ms));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new","--remote-debugging-port=9370","--disable-gpu","--no-first-run","--autoplay-policy=no-user-gesture-required","--mute-audio","--user-data-dir=/tmp/chrome-vel"], { stdio: "ignore" });
await espera(2500);
const t = await (await fetch("http://localhost:9370/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const enviar = (m, p = {}) => ws.send(JSON.stringify({ id: ++id, method: m, params: p }));
const pedir = (m, p = {}) => new Promise(res => { const mio = ++id; const h = (e) => { const x = JSON.parse(e.data); if (x.id === mio) { ws.removeEventListener("message", h); res(x.result); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id: mio, method: m, params: p })); });
await new Promise(r => ws.addEventListener("open", r));
enviar("Page.enable");
enviar("Page.navigate", { url: `https://melsprout.boostacademy.io/auth/callback?token_hash=${link.properties.hashed_token}&type=magiclink` });
await espera(6000);
enviar("Page.navigate", { url: `https://melsprout.boostacademy.io/app/clase/${corta.id}` });
await espera(10000);
// Simula a la alumna: toca el botón de 2x y le da play
const r1 = await pedir("Runtime.evaluate", { returnByValue: true, expression: `
  (() => {
    const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === '2x');
    if (b) b.click();
    const v = document.querySelector('video');
    if (!v) return 'no hay video';
    v.muted = true; v.play();
    return 'velocidad: ' + v.playbackRate + ' | duración real: ' + Math.round(v.duration) + ' s';
  })()` });
console.log(r1?.result?.value);
// Deja correr: a 2x, una clase de pocos minutos termina rápido
for (let i = 1; i <= 20; i++) {
  await espera(15000);
  const r = await pedir("Runtime.evaluate", { returnByValue: true, expression: `
    (() => { const v = document.querySelector('video');
      const txt = document.body.innerText;
      return [Math.round(v.currentTime), Math.round(v.duration), v.playbackRate, /completada/i.test(txt) ? 'dice completada' : (txt.match(/\\d+% visto/) || ['sin %'])[0]].join(' | '); })()` });
  console.log(`  ${i*15}s → segundo ${r?.result?.value}`);
  const { data: p } = await sb.from("clase_progreso").select("completada, xp_dado, segundos_vistos").eq("user_id", uid).eq("clase_id", corta.id).maybeSingle();
  if (p?.completada) { console.log("  → quedó COMPLETADA en la base, xp_dado:", p.xp_dado); break; }
  if (i === 20) console.log("  → NO se completó");
}
const { data: fin } = await sb.from("profiles").select("xp").eq("id", uid).maybeSingle();
console.log("XP final de la cuenta de prueba:", fin?.xp);
ws.close(); chrome.kill();
await sb.from("clase_progreso").delete().eq("user_id", uid);
await sb.from("curso_accesos").delete().eq("user_id", uid);
await sb.auth.admin.deleteUser(uid);
console.log("cuenta de prueba borrada");
