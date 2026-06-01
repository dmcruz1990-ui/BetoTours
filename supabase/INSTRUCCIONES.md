# BetoTours · Blog + Panel Admin — Puesta en marcha

## 1. Crear las tablas en Supabase
1. Entra a tu proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Copia y pega TODO el contenido de [`schema.sql`](./schema.sql) y dale **Run**.
   - Esto crea las tablas `blog_posts`, `availability` y `admins`, con su seguridad (RLS).
   - Deja todos los tours y alojamientos como "disponibles" por defecto.

> En el SQL, busca la línea con `'dmcruz1990@gmail.com'` y cámbiala (o agrega más)
> por los correos que podrán entrar al panel de administración.

## 2. Crear el usuario administrador
El panel usa correo + contraseña. Crea el usuario así:
1. En Supabase → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Usa el **mismo correo** que pusiste en la tabla `admins` del paso 1.
3. Ponle una contraseña y marca **Auto Confirm User** (para que pueda entrar sin verificar email).
4. ¡Listo! Ese correo + contraseña son las credenciales del panel.

> ¿Quieres permitir auto-registro? No es necesario: con crear el usuario manualmente basta.
> Solo los correos que estén en la tabla `admins` tendrán permisos de escritura.

## 3. Usar la web
- **Blog público:** `tudominio.com/#/blog` (o el botón "Blog" del menú).
- **Panel admin:** `tudominio.com/#/admin` → inicia sesión con el correo/clave del paso 2.
  - Pestaña **Disponibilidad:** activa/desactiva cada tour y cada aparta suite.
    Lo que marques como "Ocupado" sale como **Agotado** en las tarjetas de la web.
  - Pestaña **Blog:** crea, edita, publica o borra artículos. Solo los marcados
    como **Publicado** aparecen en el blog público.

## Seguridad
- La **anon key** que está en el código es pública por diseño y es seguro exponerla:
  toda la protección está en las políticas RLS de la base de datos.
- Nadie puede escribir en el blog ni cambiar disponibilidad sin iniciar sesión con
  un correo autorizado en la tabla `admins`.
