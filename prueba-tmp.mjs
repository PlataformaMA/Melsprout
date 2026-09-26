import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")), l.slice(l.indexOf("=")+1).trim()]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SITIO = "https://melsprout.boostacademy.io";
const correo = `prueba.orden.${Date.now()}@resend.dev`;

const { data: mods } = await sb.from("cursos_modulos").select("id, nombre").eq("activo", true).eq("especial", true);
const byw = mods.find(m => /boost your web/i.test(m.nombre));
const { data: filas } = await sb.from("cursos_clases").select("id, titulo, orden, seccion").eq("modulo_id", byw.id).eq("activo", true).order("orden");

const { data: creado, error: e1 } = await sb.auth.admin.createUser({ email: correo, password: "Prueba-Orden-2026!", email_confirm: true });
if (e1) { console.log("error creando:", e1.message); process.exit(1); }
const uid = creado.user.id;
await sb.from("profiles").upsert({ id: uid, full_name: "Prueba Orden", onboarding_completo: true });
await sb.from("curso_accesos").insert({ user_id: uid, modulo_id: byw.id });
// Avance: solo las 2 primeras clases terminadas
await sb.from("clase_progreso").insert([0,1].map(i => ({ user_id: uid, clase_id: filas[i].id, completada: true, segundos_vistos: 600 })));

const { data: link } = await sb.auth.admin.generateLink({ type: "magiclink", email: correo });
const th = link.properties.hashed_token;
const jar = [];
let r = await fetch(`${SITIO}/auth/callback?token_hash=${th}&type=magiclink`, { redirect: "manual" });
for (const c of r.headers.getSetCookie()) jar.push(c.split(";")[0]);
const cookie = jar.join("; ");
const get = async (ruta) => {
  const res = await fetch(SITIO + ruta, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, loc: res.headers.get("location"), html: res.status === 200 ? await res.text() : "" };
};
const curso = await get(`/app/especiales/${byw.id}`);
console.log("portada del curso:", curso.status, curso.loc ?? "");
const html = curso.html;
console.log("candados en la lista:", (html.match(/Termina la anterior/g) || []).length, "de", filas.length, "clases");
for (const i of [0,1,2,3,4,5,9]) {
  const c = filas[i];
  const enlace = html.includes(`href="/app/clase/${c.id}"`);
  console.log(` clase ${String(i+1).padStart(2)} ${enlace ? "abierta (con enlace)" : "sin enlace"}  ${c.titulo.slice(0,40)}`);
}
// Clase 3 debe abrir; clase 5 debe rebotar; clase 6 (primera del modulo 2) debe abrir
for (const i of [2, 4, 5]) {
  const c = filas[i];
  const res = await get(`/app/clase/${c.id}`);
  console.log(`entrar a clase ${i+1}: ${res.status} ${res.loc ?? "OK"}  (${c.seccion})`);
}
await sb.from("curso_accesos").delete().eq("user_id", uid);
await sb.from("clase_progreso").delete().eq("user_id", uid);
await sb.auth.admin.deleteUser(uid);
console.log("cuenta de prueba eliminada:", correo);
