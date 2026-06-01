-- ============================================================
-- BetoTours · Esquema de base de datos (Blog + Disponibilidad)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ----------------------------------------------------------------
-- 1. ADMINS: lista de correos autorizados a entrar al panel.
--    Cualquier usuario que se registre con uno de estos correos
--    tendrá permisos de escritura.
-- ----------------------------------------------------------------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 👉 CAMBIA este correo por el de Beto (o agrega varios).
insert into public.admins (email) values
  ('dmcruz1990@gmail.com')
on conflict (email) do nothing;

-- Función helper: ¿el usuario logueado es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.email = (auth.jwt() ->> 'email')
  );
$$;

-- ----------------------------------------------------------------
-- 2. BLOG
-- ----------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image text,
  author text default 'Beto Tours',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, created_at desc);

alter table public.blog_posts enable row level security;

-- Lectura pública SOLO de posts publicados.
drop policy if exists "blog public read" on public.blog_posts;
create policy "blog public read"
  on public.blog_posts for select
  using (published = true);

-- Admins pueden ver TODO (incluye borradores).
drop policy if exists "blog admin read all" on public.blog_posts;
create policy "blog admin read all"
  on public.blog_posts for select
  to authenticated
  using (public.is_admin());

-- Admins pueden crear / editar / borrar.
drop policy if exists "blog admin write" on public.blog_posts;
create policy "blog admin write"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------
-- 3. DISPONIBILIDAD (tours y alojamientos)
-- ----------------------------------------------------------------
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('tour','stay')),
  ref_id text not null,
  name text not null,
  is_available boolean not null default true,
  note text,
  updated_at timestamptz not null default now(),
  unique (kind, ref_id)
);

alter table public.availability enable row level security;

-- Lectura pública (para mostrar badges Disponible/Ocupado en la web).
drop policy if exists "availability public read" on public.availability;
create policy "availability public read"
  on public.availability for select
  using (true);

-- Solo admins escriben.
drop policy if exists "availability admin write" on public.availability;
create policy "availability admin write"
  on public.availability for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Trigger para refrescar updated_at automáticamente.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_blog_touch on public.blog_posts;
create trigger trg_blog_touch before update on public.blog_posts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_avail_touch on public.availability;
create trigger trg_avail_touch before update on public.availability
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------
-- 4. DATOS INICIALES de disponibilidad
--    (todos disponibles por defecto; Beto los va cambiando)
-- ----------------------------------------------------------------

-- 4.1 Tours de Beto
insert into public.availability (kind, ref_id, name) values
  ('tour','guatape','Tour a Guatapé y El Peñol'),
  ('tour','pablo-escobar','Tour Pablo Escobar'),
  ('tour','city-tour-graffitour','City Tour + Graffitour'),
  ('tour','coffee-tour','Coffee Tour Experience'),
  ('tour','santa-fe','Santa Fe de Antioquia'),
  ('tour','rio-claro','Aventura en Río Claro'),
  ('tour','hacienda-napoles-basico','Hacienda Nápoles (Básico)'),
  ('tour','hacienda-napoles','Hacienda Nápoles (Safari)')
on conflict (kind, ref_id) do nothing;

-- 4.2 Aparta Suites Torre de Prado
insert into public.availability (kind, ref_id, name) values
  ('stay','301','Aparta Suite 301'),
  ('stay','302','Aparta Suite 302'),
  ('stay','303','Aparta Suite 303'),
  ('stay','401','Aparta Suite 401'),
  ('stay','402','Aparta Suite 402'),
  ('stay','403','Aparta Suite 403'),
  ('stay','501','Aparta Suite 501'),
  ('stay','502','Aparta Suite 502'),
  ('stay','504','Aparta Suite 504'),
  ('stay','601','Penthouse 601')
on conflict (kind, ref_id) do nothing;

-- 4.3 Un post de ejemplo (borrador) para probar el blog
insert into public.blog_posts (slug, title, excerpt, content, published, author)
values (
  'bienvenidos-a-beto-tours',
  '¡Bienvenidos al blog de Beto Tours!',
  'Consejos, historias y los mejores planes para vivir Medellín como un paisa.',
  E'¡Hola, parcero! 👋\n\nEste es el blog oficial de Beto Tours. Aquí vas a encontrar consejos de viaje, historias de Medellín y novedades de nuestros planes.\n\n¡Nos vemos en la Eterna Primavera!',
  false,
  'Beto'
)
on conflict (slug) do nothing;

-- ✅ Listo. Ahora crea el usuario admin (ver instrucciones del chat).
