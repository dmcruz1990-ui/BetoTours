// ============================================================
// Correos automáticos de reserva web (Resend)
//
// Entradas que acepta:
//   1) POST {id}            ← desde public/alojamientos.html tras guardar la reserva.
//                              Busca la reserva en Supabase: debe existir, ser 'web' y < 15 min (anti-spam).
//   2) POST webhook Supabase ← Database Webhook (INSERT en reservations), con header
//                              x-webhook-secret = WEBHOOK_SECRET. Usa el registro directo.
//                              Envía para source 'web' y 'ayenda' (las de Ayenda las inserta el robot
//                              de Gmail); ignora 'manual', bloqueos y canceladas.
//   3) GET ?check=1          ← diagnóstico sin secretos: qué está configurado y qué falla.
//   4) GET ?test=<correo>&secret=<MAIL_TEST_SECRET> ← envía un correo de prueba real.
//
// Correos que envía por cada reserva web:
//   • Al cliente: "Recibimos tu solicitud de reserva"
//   • Al dueño:   "🔔 Nueva reserva web" con datos y link al panel
//
// Variables de entorno (Netlify → Site configuration → Environment variables):
//   RESEND_API_KEY        (obligatoria) clave de resend.com
//   MAIL_TO_OWNER         (opcional) a quién llega el aviso. Por defecto booking.edilberto@gmail.com
//   MAIL_FROM             (opcional) remitente. Por defecto reservas@betotours.com
//   SUPABASE_SERVICE_KEY  (opcional) clave service_role; si no está, usa la anon (la tabla es legible)
//   WEBHOOK_SECRET        (opcional) activa la entrada por webhook de Supabase
//   MAIL_TEST_SECRET      (opcional) activa el envío de prueba por URL
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://evodmxqehoyjfkiulrwf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2b2RteHFlaG95amZraXVscndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjg3ODksImV4cCI6MjA5NTkwNDc4OX0.OOPmj5K_MP4kjjQshsbNZoBf1WNykLtBHugxl56WYrc';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Aparta Suites Torre de Prado <reservas@betotours.com>';
const MAIL_TO_OWNER = process.env.MAIL_TO_OWNER || 'booking.edilberto@gmail.com';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const MAIL_TEST_SECRET = process.env.MAIL_TEST_SECRET || '';

const WHATSAPP = '573006054141';
const SITE = 'https://betotours.com';
const HOTEL = { name: 'Aparta Suites Torre de Prado', address: 'Carrera 47 # 64-41, Medellín, Colombia', phone: '+57 300 605 4141' };

type Reserva = {
  id: string; room_id: string; room_name: string | null; guest_name: string; guest_phone: string | null;
  guest_email: string | null; check_in: string; check_out: string; guests: number | null; note: string | null;
  source: string; created_at: string; status?: string | null; total?: number | null; external_ref?: string | null;
};

// Fuentes que disparan correos: 'web' (formulario de la página) y 'ayenda' (motor de Ayenda,
// que el robot de Gmail inserta en la tabla). 'manual' y bloqueos del panel NO avisan.
const FUENTES_NOTIFICADAS = (process.env.MAIL_SOURCES || 'web,ayenda').split(',').map(s => s.trim()).filter(Boolean);
// Fuentes que notifica el WEBHOOK. 'web' NO va aquí porque la página ya la notifica al guardar (evita duplicados).
const FUENTES_WEBHOOK = (process.env.WEBHOOK_SOURCES || 'ayenda').split(',').map(s => s.trim()).filter(Boolean);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fmtDate = (s: string) => {
  const d = new Date(`${s}T12:00:00-05:00`);
  const t = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const nightsBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86400000));
const emailValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

// ---------- Plantilla base ----------
const layout = (titulo: string, cuerpo: string) => `<!doctype html><html lang="es"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.06)">
  <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:22px;text-align:center">
    <div style="font-size:22px;font-weight:800">🏨 ${esc(HOTEL.name)}</div>
    <div style="font-size:13px;opacity:.9;margin-top:4px">by Beto Tours · Medellín</div>
  </td></tr>
  <tr><td style="padding:24px">
    <h1 style="margin:0 0 12px;font-size:20px;color:#15803d">${titulo}</h1>
    ${cuerpo}
  </td></tr>
  <tr><td style="padding:14px 24px;background:#f8fafc;color:#94a3b8;font-size:11px;text-align:center;border-top:1px solid #e2e8f0">
    ${esc(HOTEL.name)} · ${esc(HOTEL.address)} · WhatsApp ${esc(HOTEL.phone)}
  </td></tr>
</table></td></tr></table></body></html>`;

const filas = (pares: [string, string][]) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;margin:8px 0 16px">${
    pares.map(([k, v]) => `<tr><td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;color:#64748b;font-weight:bold;width:40%">${esc(k)}</td><td style="padding:8px 4px;border-bottom:1px solid #f1f5f9">${v}</td></tr>`).join('')
  }</table>`;

const boton = (href: string, texto: string, color = '#16a34a') =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:12px;font-size:14px">${texto}</a>`;

// ---------- Armar y enviar los dos correos de una reserva web ----------
async function notificarReserva(res: Reserva) {
  const noches = nightsBetween(res.check_in, res.check_out);
  const apto = res.room_name || `Apartamento ${res.room_id}`;
  const nombre = esc(res.guest_name);
  const primerNombre = esc((res.guest_name || '').split(' ')[0]);
  const tel = (res.guest_phone || '').replace(/\D/g, '');
  const waCliente = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Torre de Prado 👋 Soy ${res.guest_name}, solicité el ${apto} del ${res.check_in} al ${res.check_out}.`)}`;

  // Ayenda (o cualquier reserva ya confirmada) → "Reserva confirmada". Web → "Recibimos tu solicitud".
  const esAyenda = res.source === 'ayenda';
  const confirmada = esAyenda || res.status === 'confirmed';
  const ref = ((res.external_ref || '').replace(/^ayenda-/i, '') || ((res.note || '').match(/Ref\s*(\d+)/i) || [])[1] || '').trim();
  const totalStr = res.total ? `$${Number(res.total).toLocaleString('es-CO')}` : '';
  const canal = esAyenda ? 'Ayenda' : 'la web';

  const detalle = filas([
    ...(ref ? [['N° de reserva', `<b>${esc(ref)}</b>`] as [string, string]] : []),
    ['Apartamento', `<b>${esc(apto)}</b>`],
    ['Entrada', `${esc(fmtDate(res.check_in))} · desde 3:00 p.m.`],
    ['Salida', `${esc(fmtDate(res.check_out))} · hasta 11:00 a.m.`],
    ['Noches', `${noches}`],
    ['Huéspedes', `${res.guests ?? 1}`],
    ...(totalStr ? [['Total', `<b>${totalStr}</b>`] as [string, string]] : []),
  ]);

  const htmlCliente = confirmada
    ? layout(`¡Tu reserva está confirmada, ${primerNombre}! ✅`, `
    <p style="font-size:14px;line-height:1.55;margin:0 0 8px">Gracias por elegir <b>${esc(HOTEL.name)}</b>. Estos son los datos de tu reserva:</p>
    ${detalle}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;font-size:14px;line-height:1.5;margin-bottom:18px">
      <b>Check-in desde las 3:00 p.m. · Check-out hasta las 11:00 a.m.</b><br>Antes de tu llegada te enviaremos por WhatsApp la guía de bienvenida (WiFi, cómo llegar, recomendaciones). Si tienes alguna duda, escríbenos:
    </div>
    <div style="text-align:center;margin-bottom:18px">${boton(waCliente, '📲 Escribirnos por WhatsApp')}</div>
    <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0">📍 ${esc(HOTEL.address)}<br>¡Te esperamos en Medellín! 🇨🇴</p>
  `)
    : layout(`¡Recibimos tu solicitud, ${primerNombre}! 🎉`, `
    <p style="font-size:14px;line-height:1.55;margin:0 0 8px">Gracias por elegir <b>${esc(HOTEL.name)}</b>. Ya tenemos tu solicitud de reserva con estos datos:</p>
    ${detalle}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;font-size:14px;line-height:1.5;margin-bottom:18px">
      <b>¿Qué sigue?</b> En breve te <b>confirmamos la disponibilidad por WhatsApp</b> al número que nos dejaste. Si quieres agilizar, escríbenos ahora:
    </div>
    <div style="text-align:center;margin-bottom:18px">${boton(waCliente, '📲 Escribirnos por WhatsApp')}</div>
    <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0">📍 ${esc(HOTEL.address)}<br>Esta solicitud queda <b>sujeta a disponibilidad</b> hasta que la confirmemos.</p>
  `);

  const htmlDueno = layout(confirmada ? `🔔 Nueva reserva confirmada (${canal})` : '🔔 Nueva reserva desde la web', `
    <p style="font-size:14px;line-height:1.55;margin:0 0 8px"><b>${nombre}</b> ${confirmada ? `acaba de reservar por <b>${esc(canal)}</b>. La reserva ya está <b>confirmada</b>.` : 'acaba de solicitar una reserva en la página. Está <b>pendiente</b> de confirmar.'}</p>
    ${filas([
      ...(ref ? [['N° de reserva', `<b>${esc(ref)}</b>`] as [string, string]] : []),
      ['Cliente', `<b>${nombre}</b>`],
      ['WhatsApp', tel ? `<a href="https://wa.me/${tel}" style="color:#15803d;font-weight:bold">${esc(res.guest_phone)}</a>` : '—'],
      ['Correo', res.guest_email ? `<a href="mailto:${esc(res.guest_email)}" style="color:#15803d">${esc(res.guest_email)}</a>` : '—'],
      ['Apartamento', `<b>${esc(apto)}</b>`],
      ['Entrada', esc(fmtDate(res.check_in))],
      ['Salida', esc(fmtDate(res.check_out))],
      ['Noches / Huéspedes', `${noches} noche${noches === 1 ? '' : 's'} · ${res.guests ?? 1} huésped(es)`],
      ...(totalStr ? [['Total', `<b>${totalStr}</b>`] as [string, string]] : []),
      ['Nota', res.note ? esc(res.note) : '—'],
    ])}
    <div style="text-align:center;margin-bottom:8px">${boton(`${SITE}/#/admin`, confirmada ? '🗂️ Ver en el panel' : '🗂️ Abrir el panel y confirmar')}</div>
    ${confirmada ? '' : '<p style="font-size:12px;color:#94a3b8;text-align:center;margin:12px 0 0">Recuerda: el sistema no deja confirmar si las fechas se cruzan con otra reserva confirmada.</p>'}
  `);

  const asuntoCliente = confirmada ? `Reserva confirmada · ${apto}${ref ? ` · N° ${ref}` : ''}` : `Recibimos tu solicitud de reserva · ${apto}`;
  const asuntoDueno = `🔔 Nueva reserva ${confirmada ? `(${canal})` : 'web'}: ${res.guest_name} · ${apto} · ${res.check_in} → ${res.check_out}`;
  const results = await Promise.allSettled([
    res.guest_email && emailValido(res.guest_email)
      ? sendEmail(res.guest_email, asuntoCliente, htmlCliente, MAIL_TO_OWNER)
      : Promise.reject(new Error('El cliente no dejó un correo válido')),
    sendEmail(MAIL_TO_OWNER, asuntoDueno, htmlDueno, res.guest_email || undefined),
  ]);
  const estado = (p: PromiseSettledResult<unknown>) => p.status === 'fulfilled' ? 'enviado' : `error: ${(p as PromiseRejectedResult).reason?.message || 'desconocido'}`;
  return { cliente: estado(results[0]), dueno: estado(results[1]) };
}

// ---------- Diagnóstico (sin exponer secretos) ----------
async function diagnostico() {
  const out: Record<string, unknown> = {
    resend_api_key: RESEND_API_KEY ? `configurada (${RESEND_API_KEY.slice(0, 6)}…)` : '❌ FALTA — agrégala en Netlify y vuelve a desplegar',
    remitente: MAIL_FROM,
    aviso_a: MAIL_TO_OWNER,
    supabase_service_key: process.env.SUPABASE_SERVICE_KEY ? 'configurada' : 'no (usa la clave pública; la tabla es legible)',
    webhook_supabase: WEBHOOK_SECRET ? 'activo' : 'no configurado (opcional)',
    correo_de_prueba: MAIL_TEST_SECRET ? 'activo (?test=correo&secret=…)' : 'no configurado (opcional)',
    fuentes_notificadas: `web (la página al guardar) · ${FUENTES_WEBHOOK.join(', ')} (por webhook de Supabase)`,
  };
  // ¿Se puede leer la tabla de reservas?
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/reservations?select=id&limit=1`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    out.lectura_supabase = r.ok ? '✅ ok' : `❌ HTTP ${r.status}: ${(await r.text()).slice(0, 120)}`;
  } catch (e: any) { out.lectura_supabase = `❌ ${e.message}`; }
  // ¿La clave de Resend sirve y el dominio está verificado?
  if (RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } });
      const txt = r.ok ? '' : await r.text();
      // Una clave con permiso "solo envío" (lo recomendado) no puede listar dominios: eso es CORRECTO, no un error.
      if (!r.ok && /restricted_api_key|only send/i.test(txt)) out.resend = '✅ clave válida con permiso de solo envío (correcto). Con esta clave no se puede leer la lista de dominios; verifica el dominio en resend.com → Domains.';
      else if (!r.ok) out.resend = `❌ la clave no sirve (HTTP ${r.status}): ${txt.slice(0, 120)}`;
      else {
        const d = await r.json();
        const doms = (d?.data || []).map((x: any) => `${x.name}: ${x.status}`);
        const fromDom = (MAIL_FROM.match(/@([^>\s]+)/) || [])[1] || '';
        const okDom = (d?.data || []).find((x: any) => x.name === fromDom && x.status === 'verified');
        out.resend = okDom ? `✅ clave ok · dominio ${fromDom} verificado` : `⚠️ clave ok, pero el dominio del remitente (${fromDom || '?'}) no aparece verificado. Dominios: ${doms.join(', ') || 'ninguno'}`;
      }
    } catch (e: any) { out.resend = `❌ ${e.message}`; }
  }
  return out;
}

// ---------- Handler ----------
export default async (req: Request) => {
  const url = new URL(req.url);

  // GET ?check=1 → diagnóstico
  if (req.method === 'GET' && url.searchParams.get('check')) return json(200, await diagnostico());

  // GET ?test=correo&secret=… → correo de prueba real
  if (req.method === 'GET' && url.searchParams.get('test')) {
    if (!MAIL_TEST_SECRET) return json(403, { error: 'Envío de prueba desactivado: configura MAIL_TEST_SECRET en Netlify' });
    if (url.searchParams.get('secret') !== MAIL_TEST_SECRET) return json(403, { error: 'secret incorrecto' });
    if (!RESEND_API_KEY) return json(500, { error: 'Falta configurar RESEND_API_KEY en Netlify' });
    const to = url.searchParams.get('test') || '';
    if (!emailValido(to)) return json(400, { error: 'correo inválido' });
    const demo: Reserva = { id: 'prueba', room_id: '301', room_name: 'Aparta Suite 301 (PRUEBA)', guest_name: 'Cliente de Prueba', guest_phone: '3001234567',
      guest_email: to, check_in: '2026-12-20', check_out: '2026-12-23', guests: 2, note: 'Este es un correo de prueba del sistema.', source: 'web', created_at: new Date().toISOString() };
    try { return json(200, { ok: true, ...(await notificarReserva(demo)), nota: `Cliente → ${to} · Dueño → ${MAIL_TO_OWNER}. Revisa Spam/Promociones.` }); }
    catch (e: any) { return json(500, { ok: false, error: e.message }); }
  }

  if (req.method !== 'POST') return json(405, { error: 'Método no permitido', ayuda: 'Abre ?check=1 para ver el diagnóstico' });
  if (!RESEND_API_KEY) return json(500, { error: 'Falta configurar RESEND_API_KEY en Netlify' });

  let body: any = {};
  try { body = await req.json(); } catch { /* sin cuerpo */ }

  // Entrada 2: webhook de Supabase (INSERT en reservations)
  if (body && body.type && body.record) {
    if (!WEBHOOK_SECRET) return json(403, { error: 'Webhook desactivado: configura WEBHOOK_SECRET en Netlify' });
    if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) return json(403, { error: 'secret incorrecto' });
    if (body.type !== 'INSERT' || body.table !== 'reservations') return json(200, { ok: true, ignorado: `${body.type} en ${body.table}` });
    const rec = body.record as Reserva;
    // Las reservas 'web' ya las notifica la página al guardarlas → el webhook no las repite (evita correos dobles).
    if (rec.source === 'web' && !FUENTES_WEBHOOK.includes('web')) return json(200, { ok: true, ignorado: "fuente 'web': la página ya envía ese correo (evita duplicados)" });
    if (!FUENTES_WEBHOOK.includes(rec.source)) return json(200, { ok: true, ignorado: `fuente '${rec.source}' (el webhook notifica: ${FUENTES_WEBHOOK.join(', ')})` });
    if (rec.status === 'cancelled') return json(200, { ok: true, ignorado: 'reserva cancelada' });
    if (!rec.guest_name || !rec.check_in || !rec.check_out) return json(200, { ok: true, ignorado: 'registro incompleto' });
    if (/^bloquead/i.test(rec.guest_name)) return json(200, { ok: true, ignorado: 'bloqueo de fechas' });
    return json(200, { ok: true, via: 'webhook', ...(await notificarReserva(rec)) });
  }

  // Entrada 1: la página manda el id de la reserva recién creada
  const id = String(body?.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { error: 'id inválido' });
  const q = `${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}&select=id,room_id,room_name,guest_name,guest_phone,guest_email,check_in,check_out,guests,note,source,created_at,status,total,external_ref`;
  const r = await fetch(q, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) return json(502, { error: `No se pudo leer la reserva (HTTP ${r.status})` });
  const rows = (await r.json()) as Reserva[];
  const res = rows[0];
  if (!res) return json(404, { error: 'Reserva no encontrada' });
  if (res.source !== 'web') return json(403, { error: 'Solo se notifican reservas hechas en la web' });
  if (Date.now() - Date.parse(res.created_at) > 15 * 60 * 1000) return json(403, { error: 'La reserva no es reciente' });
  return json(200, { ok: true, via: 'pagina', ...(await notificarReserva(res)) });
};
