import { createClient } from '@supabase/supabase-js';

// Estos valores son públicos por diseño (la anon key está protegida por RLS).
// Se pueden sobreescribir con variables de entorno en Netlify si se desea.
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://evodmxqehoyjfkiulrwf.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2b2RteHFlaG95amZraXVscndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjg3ODksImV4cCI6MjA5NTkwNDc4OX0.OOPmj5K_MP4kjjQshsbNZoBf1WNykLtBHugxl56WYrc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityItem {
  id: string;
  kind: 'tour' | 'stay'; // tour = plan de Beto, stay = aparta suite
  ref_id: string; // id del tour o número/identificador del aparta suite
  name: string;
  is_available: boolean;
  note: string | null;
  updated_at: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
export type ReservationSource = 'web' | 'whatsapp' | 'ayenda' | 'externo' | 'manual';

export interface Reservation {
  id: string;
  room_id: string;        // '301', '601'...
  room_name: string | null;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;       // 'YYYY-MM-DD'
  check_out: string;      // 'YYYY-MM-DD'
  guests: number | null;
  nights?: number | null;
  status: ReservationStatus;
  source: ReservationSource;
  total: number | null;
  note: string | null;
  doc_type?: string | null;     // CC, CE, Pasaporte…
  doc_number?: string | null;
  nationality?: string | null;
  created_at: string;
}
