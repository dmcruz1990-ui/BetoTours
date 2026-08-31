-- ============================================================
-- BetoTours · Check-in: selfie del huésped + vehículo (automotor)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- Agrega a los registros de check-in:
--   • selfie  → foto (selfie) del huésped titular
--   • vehicle → datos del vehículo opcional { tipo, placa, matricula_foto, declaracion }
-- (Las selfies de los acompañantes van dentro del JSON 'companions', no requieren columna.)
-- ============================================================

alter table public.guest_registrations
  add column if not exists selfie  text,
  add column if not exists vehicle jsonb;

-- ✅ Listo. Nada más que hacer: el formulario y el panel ya usan estas columnas.
