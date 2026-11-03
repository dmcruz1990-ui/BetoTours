# Seguridad del panel Admin (login real)

Se quitó el acceso demo `12345`. Ahora el panel usa **login real con Supabase Auth**
(correo + contraseña). Para entrar hay que tener un usuario creado en Supabase.

---

## Paso 1 — Crear el usuario administrador (en Supabase)
1. Entra a **supabase.com** → tu proyecto.
2. Menú izquierdo → **Authentication** → **Users**.
3. Botón **"Add user"** → **"Create new user"**.
4. Escribe el **correo** de Beto y una **contraseña fuerte**.
5. Marca **"Auto Confirm User"** (para que quede activo sin verificar correo).
6. **Create user**.

✅ Con ese correo y contraseña ya se entra al panel (pestaña **Admin** en la web).

> Para más administradores, repite el paso (cada persona con su correo y clave).
> Para cambiar la clave: Authentication → Users → el usuario → **Reset password**.

---

## Paso 2 — Blindar los datos (RLS) — recomendado
Hoy, con la "anon key" (que es pública) cualquiera podría leer las reservas por la API.
Este SQL deja que **solo el admin logueado** pueda ver/editar/borrar reservas.
**Insertar** queda abierto (lo necesita el formulario público de la web y el robot de Ayenda).

Pega esto en **Supabase → SQL Editor → Run**:

```sql
-- Ver / editar / borrar reservas: solo usuarios autenticados (el admin logueado)
drop policy if exists "reservations_select" on public.reservations;
create policy "reservations_select" on public.reservations
  for select using (auth.role() = 'authenticated');

drop policy if exists "reservations_update" on public.reservations;
create policy "reservations_update" on public.reservations
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "reservations_delete" on public.reservations;
create policy "reservations_delete" on public.reservations
  for delete using (auth.role() = 'authenticated');

-- Crear reservas: queda abierto (formulario público de la web + robot de Ayenda)
drop policy if exists "reservations_insert" on public.reservations;
create policy "reservations_insert" on public.reservations
  for insert with check (true);
```

> ⚠️ Importante: el **robot de Ayenda** (Apps Script) sigue funcionando porque solo
> **inserta** (no necesita leer). El **formulario público** de alojamientos también
> sigue creando solicitudes. Lo que se cierra es **leer/editar/borrar** sin login.

---

## Si no pueden entrar al panel

El login ahora dice la **causa real**:

| Mensaje | Qué hacer |
|---|---|
| *Correo o contraseña incorrectos* | Usar **"¿Olvidaste tu contraseña?"** o cambiarla en Supabase (abajo) |
| *Este usuario existe pero no está confirmado* | Supabase → Authentication → Users → el usuario → **Confirm** (o recrearlo con *Auto Confirm User*) |
| *Demasiados intentos* | Esperar unos minutos |
| *No hay conexión con el servidor* | Revisar internet |

### Ver los usuarios y poner una contraseña nueva (Supabase)
1. supabase.com → proyecto de BetoTours → **Authentication → Users**. Ahí está la lista de
   correos que pueden entrar. (Las contraseñas no se pueden ver: Supabase las guarda cifradas.)
2. Para poner una contraseña nueva: en la fila del usuario → menú **⋯** → **Send password recovery**
   (le llega un correo), o bien bórralo y créalo otra vez con **Add user → Create new user** +
   **Auto Confirm User**.
3. Si el correo no aparece en la lista, ese usuario **no existe**: créalo con el Paso 1.

### "¿Olvidaste tu contraseña?" (desde el propio panel)
Escribe el correo en el login y toca el enlace: llega un correo de Supabase con un enlace que abre
el panel en **"Crea tu nueva contraseña"**. Para que ese enlace abra betotours.com (y no
`localhost`), configura una sola vez en Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://betotours.com`
- **Redirect URLs → Add URL:** `https://betotours.com/**`

## Notas
- Como ya no hay clave demo, **crea el usuario (Paso 1) antes o apenas se publique**
  el cambio, si no, nadie podrá entrar al panel.
- El login queda guardado en el navegador (no hay que entrar cada vez).
- Más adelante se puede endurecer también `availability` y `blog_posts` igual,
  dejando la lectura pública (la web los necesita) y la escritura solo para el admin.
