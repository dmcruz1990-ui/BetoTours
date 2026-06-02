# Guía para Beto — Conectar las reservas de Ayenda al calendario

⏱️ Toma ~10 minutos. Se hace **una sola vez**.

> ⚠️ **MUY IMPORTANTE:** todo esto se hace desde el **correo de Gmail donde te
> llegan las reservas de Ayenda** (los correos de `no-responder@ayenda.co`).
> Tiene que ser ese mismo correo, no otro.

---

## Paso 1 — Crear la "etiqueta" en Gmail
1. Abre **Gmail** (con el correo donde llegan las reservas).
2. Abre un correo de reserva de Ayenda.
3. Arriba a la derecha del correo, toca los **⋮ (tres puntitos)** → **"Filtrar mensajes similares"**.
4. Toca **"Crear filtro"**.
5. Marca la casilla **"Aplicar la etiqueta"** → **"Elegir etiqueta" → "Nueva etiqueta"** → escribe **Reservas** → Crear.
6. Toca **"Crear filtro"**.

✅ Listo: desde ahora todos los correos de Ayenda quedan marcados con la etiqueta "Reservas".

---

## Paso 2 — Crear el robot (Apps Script)
1. Entra a **script.google.com** (con el MISMO correo).
2. Toca **"Nuevo proyecto"**.
3. Borra todo el texto que aparezca y **pega el código** que está más abajo.
4. Toca el **💾 (Guardar)**.

---

## Paso 3 — Darle permiso (solo la primera vez)
1. Arriba, donde dice la función, deja **`procesarReservas`** y toca **▶ Ejecutar**.
2. Google te pide permiso para leer el correo → **"Revisar permisos"** → elige tu cuenta.
3. Si sale un aviso *"Google no verificó esta app"*:
   → toca **"Configuración avanzada"** → **"Ir a (nombre del proyecto) (no seguro)"** → **"Permitir"**.
   *(Es seguro, es tu propio robot.)*

---

## Paso 4 — Dejarlo trabajando solo
1. En el menú de la izquierda, toca el **⏰ (Activadores / Triggers)**.
2. Botón **"+ Añadir activador"** (abajo a la derecha).
3. Configura así:
   - Función: **procesarReservas**
   - Fuente del evento: **Según tiempo**
   - Tipo: **Temporizador por minutos** → **Cada 5 minutos**
4. **Guardar**.

✅ ¡Listo! Cada reserva nueva de Ayenda entrará sola al calendario, en su apartamento, en menos de 5 minutos.

---

## Probar
- Espera (o haz) una reserva nueva en Ayenda.
- Deja el correo **sin abrir**.
- En 5 minutos, abre el calendario de BetoTours → debe aparecer sola. 🎉

---

## El código para pegar (Paso 2)

```javascript
const SUPABASE_URL = 'https://evodmxqehoyjfkiulrwf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2b2RteHFlaG95amZraXVscndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjg3ODksImV4cCI6MjA5NTkwNDc4OX0.OOPmj5K_MP4kjjQshsbNZoBf1WNykLtBHugxl56WYrc';
const GMAIL_LABEL = 'Reservas';

function procesarReservas() {
  const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
  if (!label) return;
  label.getThreads(0, 30).forEach(thread => {
    thread.getMessages().forEach(msg => {
      if (!msg.isUnread()) return;
      const data = parseEmailAyenda(msg);
      if (data) enviarASupabase(data);
      msg.markRead();
    });
  });
}

function parseEmailAyenda(msg) {
  const body = msg.getPlainBody();
  const subject = msg.getSubject() || '';
  const g = (re) => { const m = body.match(re); return m ? m[1].trim() : ''; };
  const ref = g(/N[uú]mero [UÚ]nico de Reserva:\s*(\d+)/i);
  const checkin  = g(/Checkin:\s*(\d{4}-\d{2}-\d{2})/i);
  const checkout = g(/Checkout:\s*(\d{4}-\d{2}-\d{2})/i);
  if (!ref || !checkin || !checkout) return null;
  const nombre   = g(/Nombre Completo:\s*(.+)/i) || subject.split(':').pop().trim();
  const telefono = g(/Tel[eé]fonos?:\s*([+\d][\d\s-]*)/i);
  const emailRaw = g(/Email:\s*(\S+)/i);
  const email    = /@/.test(emailRaw) ? emailRaw : null;
  const totalStr = g(/Total:\s*\$?\s*([\d.,]+)/i);
  const total    = totalStr ? Number(totalStr.replace(/[^\d]/g, '')) : null;
  const estado   = g(/Estado:\s*([A-Za-zÁÉÍÓÚáéíóú]+)/i).toLowerCase();
  const status   = /cancel/.test(estado + ' ' + subject.toLowerCase()) ? 'cancelled'
                 : /(confirm|ok|aprob)/.test(estado) ? 'confirmed' : 'pending';
  const aptoText = g(/Reserva en\s+(.+?),\s*Medell[ií]n/i);
  const roomId   = (aptoText.match(/\d{3}/) || [])[0]
                 || (/penthouse/i.test(aptoText) ? '601' : /casita/i.test(aptoText) ? 'casita' : /finca/i.test(aptoText) ? 'finca' : '');
  return {
    external_ref: 'ayenda-' + ref, room_id: roomId, room_name: aptoText,
    guest_name: nombre, guest_phone: telefono || null, guest_email: email,
    check_in: checkin, check_out: checkout, guests: 1,
    status: status, source: 'ayenda', note: 'Ref ' + ref,
  };
}

function enviarASupabase(data) {
  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/reservations?on_conflict=external_ref', {
    method: 'post', contentType: 'application/json',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'resolution=merge-duplicates,return=minimal' },
    payload: JSON.stringify(data), muteHttpExceptions: true,
  });
}
```

---

## Si quieren manejarlo desde OTRO correo (opcional)
Si Beto prefiere que el robot viva en otro Gmail (no en el que recibe las reservas):
1. En el correo que **recibe** las reservas: Gmail → ⚙️ **Configuración → Reenvío y POP/IMAP** → **Añadir dirección de reenvío** → poner el otro correo → confirmar.
2. Luego hacer toda esta guía en ese **otro** correo.
