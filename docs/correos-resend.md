# Correos automáticos de reserva web (Resend + Netlify)

Cuando un cliente reserva en `alojamientos.html` con el botón verde **SOLICITAR RESERVA**,
la función `netlify/functions/send-booking-email.mts` envía **dos correos**:

| Para | Asunto | Contenido |
|---|---|---|
| El cliente | *Recibimos tu solicitud de reserva · Apto* | Datos de la reserva + botón de WhatsApp |
| El dueño (`booking.edilberto@gmail.com`) | *🔔 Nueva reserva web: nombre · apto · fechas* | Todos los datos + botón "Abrir el panel" |

> ⚠️ El botón **RESERVAR EN LÍNEA** lleva al motor de **Ayenda** (`engine.ayenda.co`).
> Esas reservas NO pasan por la página: las notifica Ayenda y luego el robot de
> Gmail (Apps Script) las trae al calendario con `source = 'ayenda'`. Este sistema
> de correos **solo** cubre las reservas hechas con SOLICITAR RESERVA (`source = 'web'`).

---

## 🩺 Diagnóstico en 10 segundos
Abre en el navegador:

```
https://betotours.com/.netlify/functions/send-booking-email?check=1
```

Te dice, sin mostrar secretos: si la clave de Resend está puesta y sirve, si el dominio
del remitente está verificado, si puede leer la tabla de reservas, y qué opcionales
están activos. Cualquier línea con ❌ es lo que hay que arreglar.

## ✉️ Enviar un correo de prueba real
1. En Netlify agrega la variable `MAIL_TEST_SECRET` con una palabra secreta (ej. `beto2026`).
2. Redespliega (Deploys → Trigger deploy).
3. Abre:
```
https://betotours.com/.netlify/functions/send-booking-email?test=TU_CORREO&secret=beto2026
```
Envía el correo de cliente a `TU_CORREO` y el aviso al dueño, con datos de ejemplo.

---

## Configuración (una sola vez)

### 1. Resend: cuenta, dominio y clave
1. <https://resend.com> → cuenta gratis (3.000 correos/mes, 100/día).
2. **Domains → Add Domain** → `betotours.com` → copiar los registros DNS en **Netlify → Domain management → DNS**
   (TXT `resend._domainkey`, CNAME `rsend`, CNAME `send`, TXT `_dmarc`) → **Verify**.
3. **API Keys → Create API Key** (permiso *Sending access*) → copiar la clave `re_…`.

### 2. Variables en Netlify
Netlify → sitio → **Site configuration → Environment variables → Add a variable**:

| Variable | Valor | ¿Obligatoria? |
|---|---|---|
| `RESEND_API_KEY` | la clave `re_…` | ✅ Sí |
| `MAIL_TO_OWNER` | correo que recibe el aviso | Opcional (por defecto `booking.edilberto@gmail.com`) |
| `MAIL_FROM` | remitente | Opcional (por defecto `Aparta Suites Torre de Prado <reservas@betotours.com>`) |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → `service_role` | Opcional (la tabla ya es legible con la clave pública) |
| `MAIL_TEST_SECRET` | palabra secreta para el correo de prueba | Opcional |
| `WEBHOOK_SECRET` | palabra secreta para el webhook de Supabase | Opcional (ver abajo) |

**Después de cambiar variables: Deploys → Trigger deploy → Deploy site.** Las funciones
leen las variables al desplegar.

---

## 🔁 (Recomendado) Webhook de Supabase: el correo sale aunque el cliente cierre la página
Hoy la página llama a la función después de guardar. Con el webhook, es **Supabase** quien
avisa a la función cada vez que entra una reserva, sin depender del navegador del cliente.

1. En Netlify agrega `WEBHOOK_SECRET` con una palabra secreta larga → Trigger deploy.
2. Supabase → **Database → Webhooks → Create a new hook**:
   - **Name:** `correo-reserva-web`
   - **Table:** `reservations` · **Events:** solo `Insert`
   - **Type:** HTTP Request · **Method:** `POST`
   - **URL:** `https://betotours.com/.netlify/functions/send-booking-email`
   - **HTTP Headers:** agregar `x-webhook-secret` = la misma palabra secreta
3. Listo. La función ignora automáticamente las reservas que no sean `web`
   (Ayenda, manuales, bloqueos), así no se duplican avisos.

---

## Si no llega el correo
1. Abre `?check=1` (arriba) y corrige lo que salga con ❌.
2. Revisa **Spam / Promociones** en ambos correos la primera vez.
3. Confirma que la reserva de prueba sí aparece en el panel (Reservas). Si no aparece,
   el problema es al guardar, no en el correo.
4. Netlify → **Logs → Functions → send-booking-email** muestra la respuesta exacta de cada llamada.
5. En la página, tras enviar la solicitud, el mensaje dice si el correo salió (📧) o no.
