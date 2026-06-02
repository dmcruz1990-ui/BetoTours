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

## Notas
- Como ya no hay clave demo, **crea el usuario (Paso 1) antes o apenas se publique**
  el cambio, si no, nadie podrá entrar al panel.
- El login queda guardado en el navegador (no hay que entrar cada vez).
- Más adelante se puede endurecer también `availability` y `blog_posts` igual,
  dejando la lectura pública (la web los necesita) y la escritura solo para el admin.
