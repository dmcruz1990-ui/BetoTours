# Integración automática de reservas (Ayenda → Calendario BetoTours)

Objetivo: que las reservas de Ayenda/Booking/Airbnb caigan **solas** en el
Calendario de BetoTours, sin copiar/pegar a mano.

## Flujo

```
Ayenda / Booking / Airbnb
        ↓  (correo de nueva reserva / cancelación)
   Correo Gmail (etiqueta "Reservas")
        ↓  (lee el correo cada 5-10 min)
   Google Apps Script  (extrae los datos)
        ↓  (POST con la anon key)
   API BetoTours  =  Supabase (tabla reservations)
        ↓  (tiempo real)
   Calendario general BetoTours
```

> **"API BetoTours"** = el endpoint REST de Supabase que ya existe
> (`/rest/v1/reservations`). No hay que montar un servidor nuevo: el script
> escribe directo en la tabla con la anon key (la política RLS ya permite insertar).

## Ventaja clave 🎯
Los correos de **Booking/Airbnb normalmente SÍ dicen el apartamento** reservado.
Eso resuelve el problema que tenía el Excel (que salía "Habitación 1" en todas):
con los correos, cada reserva puede caer en su **suite correcta**.

---

## Plan de trabajo por fases

### Fase 0 — Preparar el correo (Beto)
- Usar un Gmail (ej. `reservasbeto@gmail.com`).
- En Ayenda/Booking/Airbnb, poner ese correo para recibir las notificaciones de reserva.
- Crear en Gmail una **etiqueta + filtro** llamada `Reservas` que marque automáticamente esos correos.

### Fase 1 — Preparar el destino (lo hace el dev) ✅ listo el SQL
Evitar reservas duplicadas: agregar una referencia única por reserva.
Correr una vez en **Supabase → SQL Editor**:

```sql
alter table public.reservations add column if not exists external_ref text;
create unique index if not exists reservations_external_ref_uidx
  on public.reservations (external_ref) where external_ref is not null;
```

Con esto, si el mismo correo llega dos veces, **no se duplica** (se actualiza).

### Fase 2 — El robot (Google Apps Script)
- Pegar el script de abajo en [script.google.com](https://script.google.com).
- Ajustar el **parseo** según cómo se ven los correos reales.
- 👉 **Lo que se necesita de Beto:** reenviar **3–5 correos de ejemplo reales**
  (uno de Booking, uno de Airbnb, uno de Ayenda, y uno de cancelación) para
  programar bien la extracción de datos.

### Fase 3 — Pruebas
- Hacer una reserva de prueba → confirmar que aparece sola en el Calendario general.
- Ajustar: fechas, apartamento, valor, y el caso de **cancelaciones**.

### Fase 4 — Dejarlo automático
- Activar un **disparador por tiempo** (cada 5–10 min) en Apps Script.
- A partir de ahí, todo entra solo. 🎉

---

## Script base (Google Apps Script)

> Es un esqueleto: el `parseEmail` se afina con los correos reales de Beto.

```javascript
const SUPABASE_URL = 'https://evodmxqehoyjfkiulrwf.supabase.co';
const SUPABASE_KEY = 'PEGAR_AQUI_LA_ANON_KEY';
const GMAIL_LABEL  = 'Reservas';

// Corre cada 5-10 min (disparador por tiempo)
function procesarReservas() {
  const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
  if (!label) return;
  label.getThreads(0, 30).forEach(thread => {
    thread.getMessages().forEach(msg => {
      if (!msg.isUnread()) return;
      const data = parseEmail(msg);
      if (data) enviarASupabase(data);
      msg.markRead();
    });
  });
}

// Extrae los datos del correo. AJUSTAR con los correos reales.
function parseEmail(msg) {
  const body = msg.getPlainBody();
  const subject = msg.getSubject();

  const canal = /booking/i.test(body + subject) ? 'externo'
              : /airbnb/i.test(body + subject)  ? 'externo'
              : 'externo';

  // Ejemplos de extracción (regex a ajustar según el correo):
  const ref     = (subject.match(/\b\d{6,}\b/) || [])[0] || Utilities.getUuid();
  const nombre  = (body.match(/Hu[eé]sped:\s*(.+)/i) || [])[1] || 'Sin nombre';
  const llegada = toISO((body.match(/Entrada:\s*([\d\/\-]+)/i) || [])[1]);
  const salida  = toISO((body.match(/Salida:\s*([\d\/\-]+)/i) || [])[1]);
  const apto    = (body.match(/Apartamento[:\s]*([0-9]{3}|Estudio \d+|Penthouse \d+)/i) || [])[1] || '';
  const roomId  = (apto.match(/\d{3}/) || [])[0] || '301';

  if (!llegada || !salida) return null;

  return {
    external_ref: 'mail-' + ref,
    room_id: roomId,
    room_name: apto || ('Aparta Suite ' + roomId),
    guest_name: nombre,
    check_in: llegada,
    check_out: salida,
    guests: 1,
    status: /cancel/i.test(subject + body) ? 'cancelled' : 'confirmed',
    source: canal,
  };
}

function toISO(s) {
  if (!s) return null;
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return null;
  const y = m[3].length === 2 ? '20' + m[3] : m[3];
  return y + '-' + ('0'+m[2]).slice(-2) + '-' + ('0'+m[1]).slice(-2);
}

function enviarASupabase(data) {
  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/reservations?on_conflict=external_ref', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  });
}
```

---

## Qué se necesita de Beto para arrancar
1. El **Gmail** donde llegan (o llegarán) las reservas.
2. **3–5 correos de ejemplo reales** (Booking, Airbnb, Ayenda y una cancelación)
   para programar bien la extracción.
3. Correr el SQL de la **Fase 1** en Supabase.
