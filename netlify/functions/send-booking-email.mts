// ============================================================
// Correos automáticos de reserva web (Resend)
// Se llama desde public/alojamientos.html justo después de guardar la reserva.
//   • Al cliente: "Recibimos tu solicitud de reserva"
//   • Al dueño:   "🔔 Nueva reserva web" con todos los datos y link al panel
//
// Seguridad: no envía nada "a ciegas". Recibe solo el id de la reserva y la
// busca en Supabase: debe existir, ser de origen 'web' y tener menos de 15 min.
// Así nadie puede usar esta función para mandar spam desde el dominio.
//
// Variables de entorno (Netlify → Site settings → Environment variables):
//   RESEND_API_KEY        (obligatoria) clave de resend.com
//   SUPABASE_SERVICE_KEY  (recomendada) clave service_role de Supabase, para leer la reserva
//   MAIL_FROM             (opcional) remitente. Por defecto reservas@betotours.com
//   MAIL_TO_OWNER         (opcional) a quién llega el aviso. Por defecto booking.edilberto@gmail.com
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://evodmxqehoyjfkiulrwf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2b2RteHFlaG95amZraXVscndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjg3ODksImV4cCI6MjA5NTkwNDc4OX0.OOPmj5K_MP4kjjQshsbNZoBf1WNykLtBHugxl56WYrc';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Aparta Suites Torre de Prado <reservas@betotours.com>';
const MAIL_TO_OWNER = process.env.MAIL_TO_OWNER || 'booking.edilberto@gmail.com';

const WHATSAPP = '573006054141';
const SITE = 'https://betotours.com';
const HOTEL = { name: 'Aparta Suites Torre de Prado', address: 'Carrera 47 # 64-41, Medellín, Colombia', phone: '+57 300 605 4141' };

type Reserva = {
  id: string; room_id: string; room_name: string | null; guest_name: string; guest_phone: string | null;
  guest_email: string | null; check_in: string; check_out: string; guests: number | null; note: string | null;
  source: string; created_at: string;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fmtDate = (s: string) => {
  const d = new Date(`${s}T12:00:00-05:00`);
  const t = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const nightsBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86400000));

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

// ---------- Handler ----------
export default async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  if (!RESEND_API_KEY) return json(500, { error: 'Falta configurar RESEND_API_KEY en Netlify' });

  let id = '';
  try { const b = await req.json(); id = String(b?.id || ''); } catch { /* sin cuerpo */ }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { error: 'id inválido' });

  // 1) Verificar que la reserva exista, sea web y sea reciente
  const q = `${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}&select=id,room_id,room_name,guest_name,guest_phone,guest_email,check_in,check_out,guests,note,source,created_at`;
  const r = await fetch(q, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) return json(502, { error: `No se pudo leer la reserva (${r.status}). ¿Falta SUPABASE_SERVICE_KEY?` });
  const rows = (await r.json()) as Reserva[];
  const res = rows[0];
  if (!res) return json(404, { error: 'Reserva no encontrada' });
  if (res.source !== 'web') return json(403, { error: 'Solo se notifican reservas hechas en la web' });
  if (Date.now() - Date.parse(res.created_at) > 15 * 60 * 1000) return json(403, { error: 'La reserva no es reciente' });

  // 2) Armar los correos
  const noches = nightsBetween(res.check_in, res.check_out);
  const apto = res.room_name || `Apartamento ${res.room_id}`;
  const nombre = esc(res.guest_name);
  const primerNombre = esc(res.guest_name.split(' ')[0]);
  const tel = (res.guest_phone || '').replace(/\D/g, '');
  const waCliente = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Torre de Prado 👋 Soy ${res.guest_name}, solicité el ${apto} del ${res.check_in} al ${res.check_out}.`)}`;

  const detalle = filas([
    ['Apartamento', `<b>${esc(apto)}</b>`],
    ['Entrada', `${esc(fmtDate(res.check_in))} · desde 3:00 p.m.`],
    ['Salida', `${esc(fmtDate(res.check_out))} · hasta 11:00 a.m.`],
    ['Noches', `${noches}`],
    ['Huéspedes', `${res.guests ?? 1}`],
  ]);

  const htmlCliente = layout(`¡Recibimos tu solicitud, ${primerNombre}! 🎉`, `
    <p style="font-size:14px;line-height:1.55;margin:0 0 8px">Gracias por elegir <b>${esc(HOTEL.name)}</b>. Ya tenemos tu solicitud de reserva con estos datos:</p>
    ${detalle}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;font-size:14px;line-height:1.5;margin-bottom:18px">
      <b>¿Qué sigue?</b> En breve te <b>confirmamos la disponibilidad por WhatsApp</b> al número que nos dejaste. Si quieres agilizar, escríbenos ahora:
    </div>
    <div style="text-align:center;margin-bottom:18px">${boton(waCliente, '📲 Escribirnos por WhatsApp')}</div>
    <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0">📍 ${esc(HOTEL.address)}<br>Esta solicitud queda <b>sujeta a disponibilidad</b> hasta que la confirmemos.</p>
  `);

  const htmlDueno = layout('🔔 Nueva reserva desde la web', `
    <p style="font-size:14px;line-height:1.55;margin:0 0 8px"><b>${nombre}</b> acaba de solicitar una reserva en la página. Está <b>pendiente</b> de confirmar.</p>
    ${filas([
      ['Cliente', `<b>${nombre}</b>`],
      ['WhatsApp', tel ? `<a href="https://wa.me/${tel}" style="color:#15803d;font-weight:bold">${esc(res.guest_phone)}</a>` : '—'],
      ['Correo', res.guest_email ? `<a href="mailto:${esc(res.guest_email)}" style="color:#15803d">${esc(res.guest_email)}</a>` : '—'],
      ['Apartamento', `<b>${esc(apto)}</b>`],
      ['Entrada', esc(fmtDate(res.check_in))],
      ['Salida', esc(fmtDate(res.check_out))],
      ['Noches / Huéspedes', `${noches} noche${noches === 1 ? '' : 's'} · ${res.guests ?? 1} huésped(es)`],
      ['Nota del cliente', res.note ? esc(res.note) : '—'],
    ])}
    <div style="text-align:center;margin-bottom:8px">${boton(`${SITE}/#/admin`, '🗂️ Abrir el panel y confirmar')}</div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:12px 0 0">Recuerda: el sistema no deja confirmar si las fechas se cruzan con otra reserva confirmada.</p>
  `);

  // 3) Enviar (los dos en paralelo; si uno falla, el otro igual sale)
  const asuntoCliente = `Recibimos tu solicitud de reserva · ${apto}`;
  const asuntoDueno = `🔔 Nueva reserva web: ${res.guest_name} · ${apto} · ${res.check_in} → ${res.check_out}`;
  const results = await Promise.allSettled([
    res.guest_email ? sendEmail(res.guest_email, asuntoCliente, htmlCliente, MAIL_TO_OWNER) : Promise.reject(new Error('El cliente no dejó correo')),
    sendEmail(MAIL_TO_OWNER, asuntoDueno, htmlDueno, res.guest_email || undefined),
  ]);
  const estado = (p: PromiseSettledResult<unknown>) => p.status === 'fulfilled' ? 'enviado' : `error: ${(p as PromiseRejectedResult).reason?.message || 'desconocido'}`;
  return json(200, { ok: true, cliente: estado(results[0]), dueno: estado(results[1]) });
};
