# Correos automáticos de reserva (Resend + Netlify)

Cuando un cliente reserva en `alojamientos.html`, la página llama a la función
`netlify/functions/send-booking-email.mts`, que envía **dos correos**:

| Para | Asunto | Contenido |
|---|---|---|
| El cliente | *Recibimos tu solicitud de reserva · Apto* | Datos de la reserva + botón de WhatsApp |
| El dueño (`booking.edilberto@gmail.com`) | *🔔 Nueva reserva web: nombre · apto · fechas* | Todos los datos + botón "Abrir el panel" |

La función **verifica en Supabase** que la reserva exista, sea de la web y tenga
menos de 15 minutos. Así nadie puede usarla para mandar spam.

---

## Configuración (una sola vez) — 3 pasos

### 1. Crear la cuenta en Resend y verificar el dominio
1. Entra a <https://resend.com> y crea una cuenta (gratis: 3.000 correos/mes).
2. Menú **Domains → Add Domain** → escribe `betotours.com`.
3. Resend te muestra **2-3 registros DNS** (tipo TXT y MX/CNAME). Cópialos tal cual
   en el panel donde está el dominio (Netlify → Domain management → DNS, o el
   proveedor donde compraste el dominio).
4. Espera unos minutos y dale **Verify**. Cuando quede en verde, ya puedes enviar
   desde `reservas@betotours.com`.

> Mientras el dominio no esté verificado, Resend solo deja enviar al correo
> con el que creaste la cuenta. Para probar antes de verificar, en Netlify pon
> `MAIL_FROM = onboarding@resend.dev` y `MAIL_TO_OWNER = <tu correo de Resend>`.

### 2. Crear la clave (API key)
Resend → **API Keys → Create API Key** → nombre `betotours`, permiso *Sending access*.
Copia la clave (empieza por `re_`). **Solo se muestra una vez.**

### 3. Pegar las claves en Netlify
Netlify → el sitio → **Site configuration → Environment variables → Add a variable**:

| Variable | Valor | Obligatoria |
|---|---|---|
| `RESEND_API_KEY` | la clave `re_...` del paso 2 | ✅ Sí |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → **service_role** | ✅ Recomendada (permite leer la reserva aunque la base tenga seguridad estricta) |
| `MAIL_TO_OWNER` | correo que recibe el aviso | Opcional (por defecto `booking.edilberto@gmail.com`) |
| `MAIL_FROM` | remitente | Opcional (por defecto `Aparta Suites Torre de Prado <reservas@betotours.com>`) |

Después de guardar las variables: **Deploys → Trigger deploy → Deploy site**
(las funciones leen las variables al desplegar).

---

## Probar
1. Entra a `betotours.com/alojamientos.html`, elige un apartamento y envía una
   solicitud con **tu propio correo**.
2. Debe llegarte el correo de cliente, y a `booking.edilberto@gmail.com` el aviso.
3. Si no llega nada: Netlify → **Logs → Functions → send-booking-email** muestra
   el error exacto (por ejemplo, clave faltante o dominio sin verificar).

## Notas
- El correo del cliente ahora es **obligatorio** en el formulario web (antes era opcional).
- Solo se notifican reservas hechas **desde la web**. Las que creas en el panel siguen
  confirmándose por WhatsApp como siempre.
