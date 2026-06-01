-- =====================================================================
--  CRM de reservas — Aparta Suites Torre de Prado
--  Pegar este SQL en: Supabase → SQL Editor → New query → Run
-- =====================================================================

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,                       -- '301', '601', etc.
  room_name text,                              -- 'Aparta Suite 301'
  guest_name text not null,
  guest_phone text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  guests int default 1,
  nights int generated always as (greatest((check_out - check_in), 0)) stored,
  status text not null default 'pending',      -- pending | confirmed | cancelled
  source text not null default 'web',          -- web | whatsapp | ayenda | manual
  total numeric,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists reservations_room_idx   on public.reservations (room_id);
create index if not exists reservations_dates_idx   on public.reservations (check_in, check_out);
create index if not exists reservations_status_idx  on public.reservations (status);

alter table public.reservations enable row level security;

-- Acceso vía anon key (mismo modelo que la tabla 'availability' ya existente).
-- Cualquiera puede CREAR una solicitud de reserva (desde la web pública).
-- Lectura/edición/borrado abiertos para el panel demo. Endurecer cuando haya login real.

drop policy if exists "reservations_select" on public.reservations;
create policy "reservations_select" on public.reservations for select using (true);

drop policy if exists "reservations_insert" on public.reservations;
create policy "reservations_insert" on public.reservations for insert with check (true);

drop policy if exists "reservations_update" on public.reservations;
create policy "reservations_update" on public.reservations for update using (true) with check (true);

drop policy if exists "reservations_delete" on public.reservations;
create policy "reservations_delete" on public.reservations for delete using (true);

-- Tiempo real: las reservas se ven en vivo en el panel sin recargar.
alter publication supabase_realtime add table public.reservations;
