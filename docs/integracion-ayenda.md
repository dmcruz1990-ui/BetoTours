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

> ✅ El `parseEmail` ya está afinado con el **correo real de Ayenda**
> (`no-responder@ayenda.co`). Funciona con el formato actual; si Ayenda cambia
> el correo, se ajustan los textos de búsqueda.

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
      const data = parseEmailAyenda(msg);
      if (data) enviarASupabase(data);
      msg.markRead();
    });
  });
}

// Parser del correo real de Ayenda (no-responder@ayenda.co)
function parseEmailAyenda(msg) {
  const body = msg.getPlainBody();
  const subject = msg.getSubject() || '';
  const g = (re) => { const m = body.match(re); return m ? m[1].trim() : ''; };

  const ref = g(/N[uú]mero [UÚ]nico de Reserva:\s*(\d+)/i);
  const checkin  = g(/Checkin:\s*(\d{4}-\d{2}-\d{2})/i);
  const checkout = g(/Checkout:\s*(\d{4}-\d{2}-\d{2})/i);
  if (!ref || !checkin || !checkout) return null; // no es un correo de reserva

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
                 || (/penthouse/i.test(aptoText) ? '601'
                 :  /casita/i.test(aptoText) ? 'casita'
                 :  /finca/i.test(aptoText)  ? 'finca' : '');

  return {
    external_ref: 'ayenda-' + ref,
    room_id: roomId,
    room_name: aptoText,
    guest_name: nombre,
    guest_phone: telefono || null,
    guest_email: email,
    check_in: checkin,
    check_out: checkout,
    guests: 1,
    status: status,
    source: 'ayenda',
    note: 'Ref ' + ref,
  };
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

### Ejemplo real procesado (correo de Ayenda)
```
Emerson Castillo Velez · tel 3142793134 · Habitación 402
Checkin 2026-06-02 → Checkout 2026-06-05 · $420.000 · Pendiente · Ref 4030668
```


---

## Qué se necesita de Beto para arrancar
1. El **Gmail** donde llegan (o llegarán) las reservas.
2. **3–5 correos de ejemplo reales** (Booking, Airbnb, Ayenda y una cancelación)
   para programar bien la extracción.
3. Correr el SQL de la **Fase 1** en Supabase.
