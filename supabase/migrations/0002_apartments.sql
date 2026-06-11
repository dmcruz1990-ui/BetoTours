-- ============================================================
-- BetoTours · Apartamentos editables (fotos + precios)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- Permite editar desde el panel admin las fotos, precios y datos
-- de cada apartamento, y que la página pública (alojamientos.html)
-- los lea en vivo desde aquí.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. TABLA de apartamentos
-- ----------------------------------------------------------------
create table if not exists public.apartments (
  id         text primary key,            -- '301', '601', 'casita'... (mismo room_id de las reservas)
  name       text not null,
  category   text   default 'Aparta Suite', -- 'Aparta Suite' | 'Estudio' | 'Penthouse' | 'Casa' | 'Finca'
  guests     int    default 2,
  bed        text   default '—',
  price      text   default '—',          -- precio COP por noche, ej '150.000' (texto para conservar el formato)
  image      text   default '',           -- foto principal (URL)
  gallery    text[] default '{}',         -- fotos adicionales (URLs) para el cotizador
  amenities  text[] default '{}',         -- ['Cocina','Baño privado','Wifi'...]
  book_url   text   default '',           -- link de reserva online (Ayenda)
  penthouse  boolean default false,
  active     boolean default true,        -- si se muestra en la web pública
  sort       int    default 0,            -- orden de aparición
  updated_at timestamptz default now()
);

create index if not exists apartments_active_sort_idx
  on public.apartments (active, sort);

alter table public.apartments enable row level security;

-- Lectura pública SOLO de apartamentos activos (para la web).
drop policy if exists "apartments public read" on public.apartments;
create policy "apartments public read"
  on public.apartments for select
  using (active = true);

-- Admins ven TODO (incluye inactivos).
drop policy if exists "apartments admin read all" on public.apartments;
create policy "apartments admin read all"
  on public.apartments for select
  to authenticated
  using (public.is_admin());

-- Solo admins crean / editan / borran.
drop policy if exists "apartments admin write" on public.apartments;
create policy "apartments admin write"
  on public.apartments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Refrescar updated_at automáticamente (la función ya existe en schema.sql).
drop trigger if exists trg_apartments_touch on public.apartments;
create trigger trg_apartments_touch before update on public.apartments
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------
-- 2. STORAGE: bucket público para las fotos de los apartamentos
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('apartamentos', 'apartamentos', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las fotos (bucket público).
drop policy if exists "apt fotos public read" on storage.objects;
create policy "apt fotos public read"
  on storage.objects for select
  using (bucket_id = 'apartamentos');

-- Solo admins suben / reemplazan / borran fotos.
drop policy if exists "apt fotos admin write" on storage.objects;
create policy "apt fotos admin write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'apartamentos' and public.is_admin())
  with check (bucket_id = 'apartamentos' and public.is_admin());

-- ----------------------------------------------------------------
-- 3. DATOS INICIALES (las mismas fotos y precios que ya tiene la web)
--    Beto puede cambiarlos desde el panel; subir el resto de fotos luego.
-- ----------------------------------------------------------------
insert into public.apartments (id, name, category, guests, bed, price, image, amenities, book_url, penthouse, sort) values
  ('200',   'Aparta Suite 200',              'Aparta Suite', 2,  '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 10),
  ('201b',  'Aparta Suite 201 B',            'Aparta Suite', 2,  '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 20),
  ('202',   'Aparta Suite 202 (Super Suite)','Aparta Suite', 10, '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 30),
  ('301',   'Aparta Suite 301',              'Aparta Suite', 4,  'Cama 1.40',  '150.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-10.37.31_9f0aa777-992x935.jpg', array['Cocina','Baño privado','Sofá cama','Wifi'],      'https://engine.ayenda.co/aparta-suites-torre-de-prado-301', false, 40),
  ('302',   'Aparta Suite 302',              'Aparta Suite', 4,  'Cama 1.40',  '130.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-10.45.32_7b7db9ac-992x992.jpg', array['Cocina','Baño privado','Sofá cama','Wifi'],      'https://engine.ayenda.co/aparta-suites-torre-de-prado-302', false, 50),
  ('303',   'Aparta Suite 303',              'Aparta Suite', 3,  'Cama 1.40',  '110.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-10.59.11_5cfc35fb-1-992x864.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-303', false, 60),
  ('304',   'Estudio 304',                   'Estudio',      2,  '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 70),
  ('305',   'Aparta Suite 305',              'Aparta Suite', 2,  '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 80),
  ('401',   'Aparta Suite 401',              'Aparta Suite', 6,  'Cama 1.60',  '160.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-11.15.54_10b11ab2-992x852.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-401', false, 90),
  ('402',   'Aparta Suite 402',              'Aparta Suite', 6,  'Cama 1.40',  '160.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-11.21.17_fc571f6e-992x992.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-402', false, 100),
  ('403',   'Aparta Suite 403',              'Aparta Suite', 3,  'Cama Doble', '110.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Proyecto-sin-nombre-Capa-1-copia-1-992x992.jpeg',                array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-403', false, 110),
  ('404',   'Aparta Suite 404',              'Aparta Suite', 2,  '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 120),
  ('501',   'Aparta Suite 501',              'Aparta Suite', 7,  'Cama 1.60',  '170.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-11.43.12_0f6934f3-992x992.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-501', false, 130),
  ('502',   'Aparta Suite 502',              'Aparta Suite', 5,  'Cama 1.40',  '150.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-11.48.55_4fa23264-992x992.jpg', array['Cocina','Baño privado','Smart TV','Sofá cama'],  'https://engine.ayenda.co/aparta-suites-torre-de-prado-502', false, 140),
  ('503',   'Aparta Suite 503',              'Aparta Suite', 3,  'Cama 1.40',  '110.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-11.48.55_4fa23264-992x992.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       '',                                                       false, 150),
  ('504',   'Aparta Suite 504',              'Aparta Suite', 6,  'Cama 1.40',  '160.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-12.01.05_5b34f624-992x992.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-504', false, 160),
  ('601',   'Penthouse 601',                 'Penthouse',    9,  'Cama 1.40',  '170.000', 'https://apartasuitestorredeprado.com/wp-content/uploads/2024/12/Imagen-de-WhatsApp-2024-12-17-a-las-12.05.58_0cef3b65-992x992.jpg', array['Cocina','Baño privado','Smart TV','Wifi'],       'https://engine.ayenda.co/aparta-suites-torre-de-prado-601', true,  170),
  ('casita','Casita cerca al Centro',        'Casa',         2,  '—',          '—',       '',                                                                                                                          array['Cocina','Baño privado','Wifi'],                  '',                                                       false, 180),
  ('finca', 'Finca Sopetrán',                'Finca',        2,  '—',          '—',       '',                                                                                                                          array['Piscina','Cocina','Wifi'],                       '',                                                       false, 190)
on conflict (id) do nothing;

-- ✅ Listo. Ahora ve al panel admin → pestaña "Apartamentos" para editar fotos y precios.
