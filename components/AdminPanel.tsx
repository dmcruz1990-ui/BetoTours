import React, { useEffect, useState } from 'react';
import { supabase, BlogPost, AvailabilityItem, Reservation, ReservationStatus } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AdminPanelProps {
  language: 'es' | 'en';
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Clave de acceso demo (modo local, sin Supabase). Cambiar cuando se configure auth real.
const DEMO_PASSWORD = '12345';

const AdminPanel: React.FC<AdminPanelProps> = ({ language }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [demo, setDemo] = useState<boolean>(() => {
    try { return localStorage.getItem('beto_demo') === '1'; } catch { return false; }
  });
  const [tab, setTab] = useState<'reservas' | 'board' | 'rooms' | 'avail' | 'blog'>('reservas');

  // Login form — pre-llenado para acceso demo
  const [email, setEmail] = useState('dmcruz1990@gmail.com');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [authMsg, setAuthMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Verificar si el usuario logueado es admin (probando acceso a una tabla protegida)
  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    (async () => {
      const { error } = await supabase.from('admins').select('email').limit(1);
      setIsAdmin(!error);
    })();
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg('');
    // Acceso demo: si la clave coincide, entra sin Supabase (modo local).
    if (password.trim() === DEMO_PASSWORD) {
      try { localStorage.setItem('beto_demo', '1'); } catch {}
      setDemo(true);
      return;
    }
    // Si pusieron otra clave, intentamos login real contra Supabase.
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMsg(error.message + ' — (la clave demo es 12345)');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try { localStorage.removeItem('beto_demo'); } catch {}
    setDemo(false);
    await supabase.auth.signOut();
  };

  // ¿Tiene acceso al panel? Demo local O sesión real de admin.
  const authed = demo || (!!session && isAdmin);

  if (checking) {
    return <div className="text-center py-32 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  // ---------- LOGIN ----------
  if (!authed && !session) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-lock text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-black text-gray-900">Panel Beto Tours</h1>
            <p className="text-gray-500 text-sm mt-1">Acceso solo para administradores</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-xl p-3 mb-4 text-center">
            <i className="fa-solid fa-circle-info mr-1"></i> Acceso demo: clave <b>12345</b>. Solo presiona <b>Entrar</b>.
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
            <input type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
            {authMsg && <p className="text-red-500 text-sm">{authMsg}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">
              {authLoading ? '...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- LOGUEADO PERO NO ADMIN ----------
  if (!demo && session && !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-4xl mb-4"></i>
          <h1 className="text-xl font-black mb-2">Sin permisos</h1>
          <p className="text-gray-500 text-sm mb-6">El correo <b>{session.user.email}</b> no está autorizado como administrador.</p>
          <button onClick={handleLogout} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  // ---------- PANEL ----------
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Panel de administración</h1>
          <p className="text-gray-500 text-sm">
            {demo ? <><i className="fa-solid fa-flask text-green-600 mr-1"></i>Modo demo (local)</> : session?.user.email}
          </p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 text-sm">
          <i className="fa-solid fa-right-from-bracket mr-2"></i>Salir
        </button>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        <button onClick={() => setTab('reservas')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'reservas' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-bell-concierge mr-2"></i>Reservas
        </button>
        <button onClick={() => setTab('board')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'board' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-table-columns mr-2"></i>Tablero
        </button>
        <button onClick={() => setTab('rooms')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'rooms' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-calendar-days mr-2"></i>Calendario
        </button>
        <button onClick={() => setTab('avail')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'avail' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-toggle-on mr-2"></i>Disponibilidad
        </button>
        <button onClick={() => setTab('blog')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'blog' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-newspaper mr-2"></i>Blog
        </button>
      </div>

      {tab === 'reservas' ? <ReservationsManager /> : tab === 'board' ? <TimelineBoard /> : tab === 'rooms' ? <RoomsCalendar /> : tab === 'avail' ? <AvailabilityManager /> : <BlogManager />}
    </div>
  );
};

// ============ DISPONIBILIDAD ============
const AvailabilityManager: React.FC = () => {
  const [items, setItems] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('availability').select('*').order('kind').order('ref_id');
    setItems((data as AvailabilityItem[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (item: AvailabilityItem) => {
    setSavingId(item.id);
    const { error } = await supabase.from('availability')
      .update({ is_available: !item.is_available }).eq('id', item.id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    }
    setSavingId(null);
  };

  if (loading) return <div className="text-center py-16 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;

  const groups: { key: 'tour' | 'stay'; label: string; icon: string }[] = [
    { key: 'stay', label: 'Alojamientos (Aparta Suites)', icon: 'fa-bed' },
    { key: 'tour', label: 'Tours de Beto', icon: 'fa-map-location-dot' },
  ];

  return (
    <div className="space-y-10">
      {groups.map(g => (
        <div key={g.key}>
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <i className={`fa-solid ${g.icon} text-green-600`}></i>{g.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.filter(i => i.kind === g.key).map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <span className={`text-xs font-bold ${item.is_available ? 'text-green-600' : 'text-red-500'}`}>
                    {item.is_available ? '● Disponible' : '● Ocupado'}
                  </span>
                </div>
                <button onClick={() => toggle(item)} disabled={savingId === item.id}
                  className={`relative w-14 h-7 rounded-full transition ${item.is_available ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${item.is_available ? 'left-8' : 'left-1'}`}></span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============ HABITACIONES (CALENDARIO) ============
interface Room { id: string; name: string; guests: number; bed: string; price: string; penthouse?: boolean; }

const ROOMS: Room[] = [
  { id: '200', name: 'Aparta Suite 200', guests: 2, bed: '—', price: '—' },
  { id: '301', name: 'Aparta Suite 301', guests: 4, bed: 'Cama 1.40', price: '150.000' },
  { id: '302', name: 'Aparta Suite 302', guests: 4, bed: 'Cama 1.40', price: '130.000' },
  { id: '303', name: 'Aparta Suite 303', guests: 3, bed: 'Cama 1.40', price: '110.000' },
  { id: '304', name: 'Estudio 304', guests: 2, bed: '—', price: '—' },
  { id: '305', name: 'Aparta Suite 305', guests: 2, bed: '—', price: '—' },
  { id: '401', name: 'Aparta Suite 401', guests: 6, bed: 'Cama 1.60', price: '160.000' },
  { id: '402', name: 'Aparta Suite 402', guests: 6, bed: 'Cama 1.40', price: '160.000' },
  { id: '403', name: 'Aparta Suite 403', guests: 3, bed: 'Cama Doble', price: '110.000' },
  { id: '404', name: 'Aparta Suite 404', guests: 2, bed: '—', price: '—' },
  { id: '501', name: 'Aparta Suite 501', guests: 7, bed: 'Cama 1.60', price: '170.000' },
  { id: '502', name: 'Aparta Suite 502', guests: 5, bed: 'Cama 1.40', price: '150.000' },
  { id: '504', name: 'Aparta Suite 504', guests: 6, bed: 'Cama 1.40', price: '160.000' },
  { id: '601', name: 'Penthouse 601', guests: 9, bed: 'Cama 1.40', price: '170.000', penthouse: true },
  { id: 'casita', name: 'Casita cerca al Centro', guests: 2, bed: '—', price: '—' },
  { id: 'finca', name: 'Finca Sopetrán', guests: 2, bed: '—', price: '—' },
];

const AYENDA_BASE = 'https://engine.ayenda.co/aparta-suites-torre-de-prado-';
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const roomById = (id: string) => ROOMS.find(r => r.id === id);
const todayStr = () => { const t = new Date(); return ymd(t.getFullYear(), t.getMonth(), t.getDate()); };
const fmtDate = (s: string) => { const d = new Date(s + 'T00:00:00'); return `${d.getDate()} ${MONTHS_ES[d.getMonth()].slice(0, 3).toLowerCase()}`; };
const addDaysStr = (s: string, n: number) => {
  const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n);
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
};
// Noches ocupadas [check_in, check_out) como array de 'YYYY-MM-DD'
const nightsBetween = (checkIn: string, checkOut: string): string[] => {
  const out: string[] = [];
  const d = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  while (d < end) { out.push(ymd(d.getFullYear(), d.getMonth(), d.getDate())); d.setDate(d.getDate() + 1); }
  return out;
};

const STATUS_META: Record<ReservationStatus, { label: string; chip: string; dot: string; cell: string }> = {
  pending:   { label: 'Pendiente',  chip: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', cell: 'bg-amber-400 text-white hover:bg-amber-500' },
  confirmed: { label: 'Confirmada', chip: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500', cell: 'bg-red-500 text-white hover:bg-red-600' },
  cancelled: { label: 'Cancelada',  chip: 'text-gray-400 bg-gray-100 border-gray-200',  dot: 'bg-gray-400', cell: '' },
};
const SOURCE_LABEL: Record<string, string> = { web: 'Web', whatsapp: 'WhatsApp', ayenda: 'Ayenda', externo: 'Externo', manual: 'Manual' };

// ¿El error de Supabase indica que falta la tabla reservations?
const isMissingTable = (err: any) => {
  if (!err) return false;
  const msg = (err.message || '') + ' ' + (err.details || '') + ' ' + (err.hint || '');
  return err.code === '42P01' || err.code === 'PGRST205' || /relation .*reservations.* does not exist/i.test(msg) || (/reservations/i.test(msg) && /schema cache|not exist|could not find/i.test(msg));
};

const MISSING_TABLE_MSG = 'Falta crear la tabla en Supabase. Corre el SQL de supabase/migrations/0001_reservations_crm.sql en el editor SQL de Supabase.';

const blankReservation = (over: Partial<Reservation> = {}): Partial<Reservation> => ({
  room_id: ROOMS[0].id, guest_name: '', guest_phone: '', guest_email: '',
  check_in: todayStr(), check_out: addDaysStr(todayStr(), 1), guests: 1,
  status: 'pending', source: 'manual', note: '', ...over,
});

// ============ FORMULARIO DE RESERVA (compartido) ============
const ReservationForm: React.FC<{ initial: Partial<Reservation>; onSaved: () => void; onCancel: () => void; }> = ({ initial, onSaved, onCancel }) => {
  const [f, setF] = useState<Partial<Reservation>>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof Reservation, v: any) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.guest_name?.trim()) { setErr('Escribe el nombre del huésped.'); return; }
    if (!f.check_in || !f.check_out || f.check_out <= f.check_in) { setErr('Las fechas no son válidas (la salida debe ser después de la entrada).'); return; }
    setSaving(true); setErr('');
    const room = roomById(f.room_id || '');
    const payload: any = {
      room_id: f.room_id, room_name: room?.name || f.room_name || null,
      guest_name: f.guest_name.trim(), guest_phone: f.guest_phone || null, guest_email: f.guest_email || null,
      check_in: f.check_in, check_out: f.check_out, guests: f.guests || 1,
      status: f.status || 'pending', source: f.source || 'manual',
      total: f.total ?? null, note: f.note || null,
    };
    const { error } = f.id
      ? await supabase.from('reservations').update(payload).eq('id', f.id)
      : await supabase.from('reservations').insert(payload);
    setSaving(false);
    if (error) { setErr(isMissingTable(error) ? MISSING_TABLE_MSG : error.message); return; }
    onSaved();
  };

  const inp = 'w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
      <h2 className="text-xl font-black mb-6">{f.id ? 'Editar reserva' : 'Nueva reserva'}</h2>
      {err && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg p-3">{err}</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm font-bold text-gray-600">Habitación
          <select value={f.room_id} onChange={e => set('room_id', e.target.value)} className={inp + ' mt-1 font-normal'}>
            {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600">Huéspedes
          <input type="number" min={1} max={12} value={f.guests || 1} onChange={e => set('guests', Number(e.target.value))} className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Entrada (check-in)
          <input type="date" value={f.check_in} onChange={e => set('check_in', e.target.value)} className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Salida (check-out)
          <input type="date" value={f.check_out} onChange={e => set('check_out', e.target.value)} className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600 sm:col-span-2">Nombre del huésped
          <input value={f.guest_name} onChange={e => set('guest_name', e.target.value)} placeholder="Ej: Juan Pérez" className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Celular / WhatsApp
          <input value={f.guest_phone || ''} onChange={e => set('guest_phone', e.target.value)} placeholder="3001234567" className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Correo (opcional)
          <input type="email" value={f.guest_email || ''} onChange={e => set('guest_email', e.target.value)} className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Estado
          <select value={f.status} onChange={e => set('status', e.target.value)} className={inp + ' mt-1 font-normal'}>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600">Origen
          <select value={f.source} onChange={e => set('source', e.target.value)} className={inp + ' mt-1 font-normal'}>
            <option value="manual">Manual</option>
            <option value="web">Web</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="ayenda">Ayenda</option>
            <option value="externo">Externo</option>
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600 sm:col-span-2">Nota (opcional)
          <textarea value={f.note || ''} onChange={e => set('note', e.target.value)} rows={2} className={inp + ' mt-1 font-normal resize-y'} />
        </label>
      </div>
      <div className="flex gap-3 pt-5">
        <button onClick={save} disabled={saving} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar reserva'}
        </button>
        <button onClick={onCancel} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">Cancelar</button>
      </div>
    </div>
  );
};

// ============ IMPORTADOR (pegar Excel/CSV de Ayenda/Booking) ============
// Convierte una fecha DD/MM/AAAA a AAAA-MM-DD
const parseDate = (s: string): string | null => {
  const m = (s || '').trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const yr = y.length === 2 ? '20' + y : y;
  return `${yr}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
const parseMoney = (s: string): number | null => {
  const n = (s || '').replace(/[^\d]/g, '');
  return n ? Number(n) : null;
};
const mapStatus = (s: string): ReservationStatus => {
  const v = (s || '').toLowerCase();
  if (/cancel/.test(v)) return 'cancelled';
  if (/ok|confirm/.test(v)) return 'confirmed';
  if (/pend/.test(v)) return 'pending';
  return 'confirmed';
};
const mapSource = (s: string): Reservation['source'] => {
  const v = (s || '').toLowerCase();
  if (/booking|airbnb|expedia|despegar|hotel|ayenda|trivago/.test(v)) return 'externo';
  if (/whats/.test(v)) return 'whatsapp';
  if (/web|directo|p[aá]gina/.test(v)) return 'web';
  return 'externo';
};

interface ParsedRow { ok: boolean; reason?: string; r?: any; raw: string; }

// Hash simple y estable (para repartir habitaciones de forma "aleatoria" pero consistente)
const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
};
const RANDOM_ROOM = '__random__';

// Parser robusto del formato Ayenda/Booking. Detecta cada campo por su contenido
// (no por posición), así soporta filas sin email donde las columnas se corren.
const parseAyenda = (text: string, roomId: string): ParsedRow[] => {
  return text.split(/\r?\n/).map(line => line.trimEnd()).filter(l => l.trim() !== '').map((raw): ParsedRow => {
    const cols = (raw.includes('\t') ? raw.split('\t') : raw.split(/\s*[;,]\s*/)).map(s => s.trim());
    const idCell = cols[0] || '';
    // Saltar encabezado
    if (/^reserva$/i.test(idCell) || (/cliente/i.test(cols[1] || '') && /desde|hasta|estado/i.test(raw.toLowerCase()))) {
      return { ok: false, reason: 'encabezado', raw };
    }
    const name = cols[1] || '';
    const dates = cols.map(parseDate).filter(Boolean) as string[];
    if (!name) return { ok: false, reason: 'sin nombre', raw };
    if (dates.length < 2) return { ok: false, reason: 'fechas inválidas', raw };
    const email = cols.find(c => /@/.test(c)) || null;
    const phone = cols.find((c, i) => i > 0 && c !== idCell && !/@/.test(c) && !parseDate(c) && /^\+?\d[\d\s\-]{6,}$/.test(c)) || null;
    const statusCell = cols.find(c => /^(ok|cancel|pend|confirm)/i.test(c)) || '';
    const channelCell = cols.find(c => /booking|airbnb|expedia|despegar|ayenda|whats|web|directo|trivago|hotel/i.test(c)) || '';
    const moneyCell = cols.find(c => /\$/.test(c) && (parseMoney(c) || 0) > 0) || '';
    // Asignación de habitación: fija, o "aleatoria" estable según la reserva (temporal)
    const isRandom = roomId === RANDOM_ROOM;
    const rid = isRandom ? ROOMS[hashStr(idCell + name) % ROOMS.length].id : roomId;
    const room = roomById(rid);
    const refNote = idCell && /^\d+$/.test(idCell) ? `Ref ${idCell}${channelCell ? ' · ' + channelCell : ''}` : null;
    return {
      ok: true, raw,
      r: {
        room_id: rid, room_name: room?.name || rid,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
        check_in: dates[0], check_out: dates[1],
        guests: 1,
        status: mapStatus(statusCell),
        source: mapSource(channelCell),
        total: parseMoney(moneyCell),
        note: isRandom ? `${refNote ? refNote + ' · ' : ''}⚠️ habitación temporal` : refNote,
      },
    };
  });
};

const ImportPanel: React.FC<{ onDone: () => void; onCancel: () => void; }> = ({ onDone, onCancel }) => {
  const [text, setText] = useState('');
  const [roomId, setRoomId] = useState(RANDOM_ROOM);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');

  const parsed = text.trim() ? parseAyenda(text, roomId) : [];
  const valid = parsed.filter(p => p.ok);
  const toImport = valid.filter(p => includeCancelled || p.r.status !== 'cancelled');
  const skipped = parsed.filter(p => !p.ok && p.reason !== 'encabezado');

  const doImport = async () => {
    if (toImport.length === 0) return;
    setSaving(true); setResult('');
    const rows = toImport.map(p => p.r);
    const { error } = await supabase.from('reservations').insert(rows);
    setSaving(false);
    if (error) { setResult((isMissingTable(error) ? MISSING_TABLE_MSG : error.message)); return; }
    onDone();
  };

  const inp = 'p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-3xl">
      <h2 className="text-xl font-black mb-1">Importar reservas</h2>
      <p className="text-gray-500 text-sm mb-5">Copia las filas de tu Excel de Ayenda/Booking y pégalas aquí. Reconoce el formato: <b>Reserva, Cliente, email, teléfono, asesor, Desde, Hasta, noches, habitación, valor, canal, comisión, estado</b>.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <label className="text-sm font-bold text-gray-600 flex flex-col gap-1">Asignar a la habitación
          <select value={roomId} onChange={e => setRoomId(e.target.value)} className={inp + ' font-normal'}>
            <option value={RANDOM_ROOM}>🎲 Aleatorio (temporal)</option>
            {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600 flex items-end gap-2 pb-3">
          <input type="checkbox" checked={includeCancelled} onChange={e => setIncludeCancelled(e.target.checked)} className="w-5 h-5 accent-green-600" />
          Incluir reservas canceladas
        </label>
      </div>

      <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
        placeholder="Pega aquí las filas copiadas del Excel…"
        className={'w-full font-mono text-xs ' + inp + ' resize-y'} />

      {parsed.length > 0 && (
        <div className="mt-4 text-sm bg-gray-50 rounded-xl p-4">
          <p className="font-bold text-gray-700 mb-2">Vista previa:</p>
          <p className="text-gray-600">✅ <b>{toImport.length}</b> reservas se importarán {roomId === RANDOM_ROOM ? <b>repartidas al azar (temporal)</b> : <>a <b>{roomById(roomId)?.name}</b></>}.</p>
          {!includeCancelled && valid.some(p => p.r.status === 'cancelled') &&
            <p className="text-gray-400 text-xs mt-1">({valid.filter(p => p.r.status === 'cancelled').length} canceladas omitidas — marca la casilla para incluirlas)</p>}
          {skipped.length > 0 && <p className="text-amber-600 text-xs mt-1">⚠️ {skipped.length} líneas no se pudieron leer (revisa fechas/formato).</p>}
          <div className="mt-3 max-h-40 overflow-auto space-y-1">
            {toImport.slice(0, 8).map((p, i) => (
              <div key={i} className="text-xs text-gray-600 flex gap-2">
                <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${STATUS_META[p.r.status as ReservationStatus].dot}`}></span>
                <span><b>{p.r.room_name}</b> · {p.r.guest_name} · {fmtDate(p.r.check_in)}→{fmtDate(p.r.check_out)} · {SOURCE_LABEL[p.r.source]} · {STATUS_META[p.r.status as ReservationStatus].label}</span>
              </div>
            ))}
            {toImport.length > 8 && <p className="text-xs text-gray-400">…y {toImport.length - 8} más.</p>}
          </div>
        </div>
      )}

      {result && <p className="text-red-500 text-sm mt-4 bg-red-50 border border-red-100 rounded-lg p-3">{result}</p>}

      <div className="flex gap-3 pt-5">
        <button onClick={doImport} disabled={saving || toImport.length === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Importando…' : `Importar ${toImport.length || ''} reservas`}
        </button>
        <button onClick={onCancel} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">Cancelar</button>
      </div>
    </div>
  );
};

// ============ RESERVAS (CRM / bandeja) ============
const SetupBanner: React.FC = () => (
  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 mb-6 text-sm">
    <p className="font-black mb-1"><i className="fa-solid fa-database mr-2"></i>Falta activar la base de datos de reservas</p>
    <p>Abre <b>Supabase → SQL Editor → New query</b>, pega el contenido de <code className="bg-amber-100 px-1 rounded">supabase/migrations/0001_reservations_crm.sql</code> y dale <b>Run</b>. Después recarga esta página.</p>
  </div>
);

const ReservationsManager: React.FC = () => {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all');
  const [editing, setEditing] = useState<Partial<Reservation> | null>(null);
  const [importing, setImporting] = useState(false);
  const [live, setLive] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });
    if (error && isMissingTable(error)) { setMissing(true); setItems([]); }
    else { setMissing(false); setItems((data as Reservation[]) || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Suscripción en vivo: las reservas entran/cambian sin recargar.
  useEffect(() => {
    const ch = supabase
      .channel('reservations-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const r = payload.new as Reservation;
          setItems(prev => prev.some(i => i.id === r.id) ? prev : [r, ...prev]);
          setNewId(r.id);
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i => i.id === payload.new.id ? (payload.new as Reservation) : i));
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== payload.old.id));
        }
      })
      .subscribe((status: string) => setLive(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Quitar el resaltado de "nueva" tras unos segundos.
  useEffect(() => {
    if (!newId) return;
    const t = setTimeout(() => setNewId(null), 6000);
    return () => clearTimeout(t);
  }, [newId]);

  const setStatus = async (r: Reservation, status: ReservationStatus) => {
    await supabase.from('reservations').update({ status }).eq('id', r.id);
    setItems(prev => prev.map(i => i.id === r.id ? { ...i, status } : i));
  };
  const remove = async (r: Reservation) => {
    if (!confirm(`¿Borrar la reserva de ${r.guest_name}?`)) return;
    await supabase.from('reservations').delete().eq('id', r.id);
    setItems(prev => prev.filter(i => i.id !== r.id));
  };

  if (editing) return <ReservationForm initial={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;
  if (importing) return <ImportPanel onDone={() => { setImporting(false); load(); }} onCancel={() => setImporting(false)} />;
  if (loading) return <div className="text-center py-16 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;

  const counts = {
    all: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    confirmed: items.filter(i => i.status === 'confirmed').length,
    cancelled: items.filter(i => i.status === 'cancelled').length,
  };
  const shown = filter === 'all' ? items : items.filter(i => i.status === filter);
  const filters: { key: 'all' | ReservationStatus; label: string }[] = [
    { key: 'all', label: `Todas (${counts.all})` },
    { key: 'pending', label: `Pendientes (${counts.pending})` },
    { key: 'confirmed', label: `Confirmadas (${counts.confirmed})` },
    { key: 'cancelled', label: `Canceladas (${counts.cancelled})` },
  ];

  return (
    <div>
      {missing && <SetupBanner />}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${live ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          <span className={`relative flex w-2 h-2`}>
            {live && <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>}
            <span className={`relative inline-flex rounded-full w-2 h-2 ${live ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </span>
          {live ? 'En vivo' : 'Conectando…'}
        </span>
        <span className="text-xs text-gray-400">Las nuevas reservas aparecen aquí automáticamente.</span>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {filters.map(ff => (
            <button key={ff.key} onClick={() => setFilter(ff.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${filter === ff.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {ff.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImporting(true)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 text-sm">
            <i className="fa-solid fa-file-import mr-2"></i>Importar
          </button>
          <button onClick={() => setEditing(blankReservation())} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 text-sm">
            <i className="fa-solid fa-plus mr-2"></i>Nueva reserva
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-inbox text-4xl mb-3"></i>
          <p className="font-bold">No hay reservas {filter !== 'all' ? STATUS_META[filter as ReservationStatus].label.toLowerCase() + 's' : 'todavía'}.</p>
          {!missing && <p className="text-xs mt-1">Las solicitudes desde la página de alojamientos caerán aquí.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(r => {
            const meta = STATUS_META[r.status];
            const phone = (r.guest_phone || '').replace(/\D/g, '');
            return (
              <div key={r.id} className={`relative bg-white rounded-2xl border shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4 transition ${r.id === newId ? 'border-green-400 ring-2 ring-green-300' : 'border-gray-100'}`}>
                {r.id === newId && <span className="absolute -mt-7 ml-1 text-[10px] font-black text-green-600">● NUEVA</span>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}><span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} mr-1`}></span>{meta.label}</span>
                    <span className="text-[11px] font-bold text-gray-400">{SOURCE_LABEL[r.source] || r.source}</span>
                    <span className="text-[11px] text-gray-300">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
                  </div>
                  <p className="font-black text-gray-900 truncate">{r.guest_name}
                    <span className="font-bold text-gray-400 text-sm"> · {r.room_name || r.room_id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    <i className="fa-solid fa-calendar mr-1"></i>{fmtDate(r.check_in)} → {fmtDate(r.check_out)}
                    {r.nights ? <span className="text-gray-400"> ({r.nights} noche{r.nights > 1 ? 's' : ''})</span> : null}
                    <span className="mx-2 text-gray-300">·</span><i className="fa-solid fa-user mr-1"></i>{r.guests || 1}
                    {r.guest_phone && <><span className="mx-2 text-gray-300">·</span><i className="fa-solid fa-phone mr-1"></i>{r.guest_phone}</>}
                  </p>
                  {r.note && <p className="text-xs text-gray-400 mt-1 italic">"{r.note}"</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {phone && (
                    <a href={`https://wa.me/57${phone}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                      className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-bold"><i className="fa-brands fa-whatsapp"></i></a>
                  )}
                  {r.status !== 'confirmed' && (
                    <button onClick={() => setStatus(r, 'confirmed')} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold" title="Confirmar"><i className="fa-solid fa-check"></i></button>
                  )}
                  {r.status !== 'cancelled' && (
                    <button onClick={() => setStatus(r, 'cancelled')} className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 text-sm font-bold" title="Cancelar"><i className="fa-solid fa-ban"></i></button>
                  )}
                  <button onClick={() => setEditing(r)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-bold" title="Editar"><i className="fa-solid fa-pen"></i></button>
                  <button onClick={() => remove(r)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 text-sm font-bold" title="Borrar"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ TABLERO (TIMELINE estilo channel manager) ============
// Color de la barra según estado/origen (igual que la leyenda de Ayenda)
const barColor = (r: Reservation): { cls: string; label: string } => {
  if (/bloque/i.test(r.guest_name) || /bloque/i.test(r.note || '')) return { cls: 'bg-red-300 text-red-900', label: 'Bloqueado' };
  if (r.source === 'ayenda' || r.source === 'externo') return { cls: 'bg-blue-300 text-blue-900', label: 'Externo' };
  if (r.status === 'pending') return { cls: 'bg-amber-400 text-white', label: 'Pendiente' };
  if (r.status === 'confirmed') return { cls: 'bg-green-400 text-white', label: 'Reservado' };
  return { cls: 'bg-gray-200 text-gray-700', label: '' };
};

const TimelineBoard: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [start, setStart] = useState(todayStr());
  const [days, setDays] = useState(14);
  const [editing, setEditing] = useState<Partial<Reservation> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reservations').select('*').neq('status', 'cancelled');
    if (error && isMissingTable(error)) { setMissing(true); setReservations([]); }
    else { setMissing(false); setReservations((data as Reservation[]) || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const ch = supabase.channel('board-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (editing) return <ReservationForm initial={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;

  // Lista de días de la ventana
  const dayList = Array.from({ length: days }, (_, i) => addDaysStr(start, i));
  // Mapa habitación -> (día -> reserva)
  const map: Record<string, Record<string, Reservation>> = {};
  reservations.forEach(r => {
    if (!map[r.room_id]) map[r.room_id] = {};
    nightsBetween(r.check_in, r.check_out).forEach(d => { map[r.room_id][d] = r; });
  });

  const dow = (ds: string) => { const d = new Date(ds + 'T00:00:00'); return WEEKDAYS_ES[(d.getDay() + 6) % 7]; };
  const dayNum = (ds: string) => new Date(ds + 'T00:00:00').getDate();
  const isWeekend = (ds: string) => { const w = new Date(ds + 'T00:00:00').getDay(); return w === 0 || w === 6; };
  const isToday = (ds: string) => ds === todayStr();

  const shift = (n: number) => setStart(addDaysStr(start, n));

  const COL = 46; // ancho de cada día en px

  return (
    <div>
      {missing && <SetupBanner />}

      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-days)} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><i className="fa-solid fa-chevron-left"></i></button>
          <button onClick={() => setStart(todayStr())} className="px-3 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold">Hoy</button>
          <button onClick={() => shift(days)} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><i className="fa-solid fa-chevron-right"></i></button>
          <span className="text-sm font-bold text-gray-700 ml-1">{fmtDate(start)} → {fmtDate(addDaysStr(start, days - 1))}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold">Ver:</span>
          {[7, 14, 30].map(n => (
            <button key={n} onClick={() => setDays(n)} className={`px-2.5 py-1 rounded-lg font-bold ${days === n ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{n}d</button>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-3 text-xs flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-400"></span>Reservado</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-400"></span>Pendiente</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-blue-300"></span>Externo</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-300"></span>Bloqueado</span>
      </div>

      {/* Aviso de estado: cuántas reservas hay y si caen en la ventana visible */}
      {!loading && (reservations.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-3 text-sm">
          <i className="fa-solid fa-circle-info mr-1"></i> No hay reservas cargadas todavía. Ve a la pestaña <b>Reservas → Importar</b> para cargarlas. (Si ya importaste y no aparece nada, revisa que corriste el SQL en Supabase.)
        </div>
      ) : (() => {
        const winEnd = addDaysStr(start, days);
        const inWindow = reservations.filter(r => r.check_in < winEnd && r.check_out > start).length;
        const earliest = reservations.reduce((a, b) => (a.check_in < b.check_in ? a : b));
        return (
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3 text-xs text-gray-500">
            <span><b className="text-gray-700">{reservations.length}</b> reservas cargadas · <b className="text-gray-700">{inWindow}</b> en este rango</span>
            {inWindow === 0 && (
              <button onClick={() => setStart(earliest.check_in)} className="font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg">
                <i className="fa-solid fa-arrow-right-long mr-1"></i>Ir a la 1ª reserva ({fmtDate(earliest.check_in)})
              </button>
            )}
          </div>
        );
      })())}

      {/* Tabla timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="min-w-max">
          {/* Encabezado de días */}
          <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="w-44 flex-shrink-0 px-3 py-2 font-black text-gray-500 text-xs uppercase tracking-wide border-r border-gray-100">Alojamiento</div>
            {dayList.map(ds => (
              <div key={ds} style={{ width: COL }} className={`flex-shrink-0 text-center py-2 border-r border-gray-50 ${isToday(ds) ? 'bg-green-50' : isWeekend(ds) ? 'bg-gray-50' : ''}`}>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{dow(ds)}</div>
                <div className={`text-sm font-black ${isToday(ds) ? 'text-green-600' : 'text-gray-700'}`}>{dayNum(ds)}</div>
              </div>
            ))}
          </div>

          {/* Filas por habitación */}
          {loading ? (
            <div className="text-center py-12 text-gray-300"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>
          ) : ROOMS.map(room => {
            const rmap = map[room.id] || {};
            return (
              <div key={room.id} className="flex border-b border-gray-50 hover:bg-gray-50/50">
                <div className="w-44 flex-shrink-0 px-3 py-3 text-sm font-bold text-gray-700 border-r border-gray-100 flex items-center gap-2">
                  <i className={`fa-solid ${room.penthouse ? 'fa-crown' : 'fa-door-closed'} text-[10px] text-gray-400`}></i>
                  <span className="truncate">{room.name}</span>
                </div>
                {dayList.map(ds => {
                  const r = rmap[ds];
                  const isStart = r && r.check_in === ds;
                  const meta = r ? barColor(r) : null;
                  return (
                    <button key={ds} onClick={() => r ? setEditing(r) : setEditing(blankReservation({ room_id: room.id, check_in: ds, check_out: addDaysStr(ds, 1) }))}
                      title={r ? `${r.guest_name} · ${fmtDate(r.check_in)}→${fmtDate(r.check_out)} (${meta!.label})` : `${room.name} · ${fmtDate(ds)} — libre`}
                      style={{ width: COL }}
                      className={`flex-shrink-0 h-12 border-r border-gray-50 relative flex items-center justify-center text-[11px] font-bold overflow-visible ${isToday(ds) ? 'bg-green-50/40' : isWeekend(ds) && !r ? 'bg-gray-50/60' : ''}`}>
                      {r && (
                        <span className={`absolute inset-y-1.5 left-0.5 right-0.5 rounded ${meta!.cls} flex items-center px-1 whitespace-nowrap overflow-hidden`}>
                          {isStart ? r.guest_name.split(' ')[0] : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-3 text-center">
        <i className="fa-solid fa-circle-info mr-1"></i>
        Clic en una celda libre para crear una reserva; clic en una barra para abrir la reserva. Desliza para ver más días.
      </p>
    </div>
  );
};

// ============ CALENDARIO POR HABITACIÓN ============
const RoomsCalendar: React.FC = () => {
  const [roomId, setRoomId] = useState<string>(ROOMS[0].id);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState<Partial<Reservation> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reservations').select('*').neq('status', 'cancelled');
    if (error && isMissingTable(error)) { setMissing(true); setReservations([]); }
    else { setMissing(false); setReservations((data as Reservation[]) || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // El calendario también se actualiza en vivo.
  useEffect(() => {
    const ch = supabase
      .channel('calendar-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const room = roomById(roomId)!;

  // Mapa de noche -> reserva (de la habitación seleccionada)
  const dayMap: Record<string, Reservation> = {};
  reservations.filter(r => r.room_id === roomId).forEach(r => {
    nightsBetween(r.check_in, r.check_out).forEach(d => { dayMap[d] = r; });
  });
  // Conteo de noches ocupadas por habitación (para los badges del selector)
  const occByRoom: Record<string, number> = {};
  reservations.forEach(r => {
    occByRoom[r.room_id] = (occByRoom[r.room_id] || 0) + nightsBetween(r.check_in, r.check_out).length;
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const busyThisMonth = Object.keys(dayMap).filter(d => d.startsWith(ymd(year, month, 1).slice(0, 7))).length;

  if (editing) return <ReservationForm initial={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;

  const onDayClick = (d: number) => {
    const dateStr = ymd(year, month, d);
    const res = dayMap[dateStr];
    if (res) { setEditing(res); return; }
    setEditing(blankReservation({ room_id: roomId, check_in: dateStr, check_out: addDaysStr(dateStr, 1), source: 'manual' }));
  };

  return (
    <div>
      {missing && <SetupBanner />}
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Selector de habitaciones */}
        <div>
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Habitaciones</h2>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {ROOMS.map(r => {
              const occupied = occByRoom[r.id] || 0;
              const active = r.id === roomId;
              return (
                <button key={r.id} onClick={() => setRoomId(r.id)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-100 hover:border-green-300'}`}>
                  <span className="flex items-center gap-2">
                    <i className={`fa-solid ${r.penthouse ? 'fa-crown' : 'fa-door-closed'} text-xs`}></i>{r.name}
                  </span>
                  {occupied > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-red-100 text-red-600'}`}>{occupied}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-5 border-b border-gray-100">
            <div>
              <p className="text-lg font-black text-gray-900">{room.name}</p>
              <p className="text-xs text-gray-500"><i className="fa-solid fa-user mr-1"></i>{room.guests} huéspedes · {room.bed} · <b className="text-green-700">${room.price}</b>/noche</p>
            </div>
            <a href={AYENDA_BASE + room.id} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg inline-flex items-center gap-1">
              <i className="fa-solid fa-arrow-up-right-from-square"></i>Reserva Ayenda
            </a>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><i className="fa-solid fa-chevron-left"></i></button>
            <p className="font-black text-gray-800">{MONTHS_ES[month]} {year}</p>
            <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><i className="fa-solid fa-chevron-right"></i></button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS_ES.map(d => <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>)}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-300"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const dateStr = ymd(year, month, d);
                const res = dayMap[dateStr];
                const cellCls = res ? STATUS_META[res.status].cell : 'bg-green-50 text-green-700 hover:bg-green-100';
                return (
                  <button key={i} onClick={() => onDayClick(d)} title={res ? `${res.guest_name} (${STATUS_META[res.status].label})` : 'Libre — clic para reservar'}
                    className={`aspect-square rounded-lg text-sm font-bold transition flex items-center justify-center ${cellCls} ${isToday(d) ? 'ring-2 ring-green-600' : ''}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200"></span>Libre</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400"></span>Pendiente</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500"></span>Confirmada</span>
            </div>
            <span className="text-gray-500"><b className="text-red-500">{busyThisMonth}</b> noches ocupadas este mes</span>
          </div>

          <p className="text-[11px] text-gray-400 mt-4 text-center">
            <i className="fa-solid fa-circle-info mr-1"></i>
            Clic en un día libre para crear una reserva; clic en uno ocupado para ver/editar la reserva.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============ BLOG ============
const emptyPost = { slug: '', title: '', excerpt: '', content: '', cover_image: '', author: 'Beto', published: false };

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const payload = {
      slug: editing.slug || slugify(editing.title),
      title: editing.title,
      excerpt: editing.excerpt || null,
      content: editing.content,
      cover_image: editing.cover_image || null,
      author: editing.author || 'Beto',
      published: editing.published,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('blog_posts').insert(payload));
    }
    setSaving(false);
    if (error) { alert('Error: ' + error.message); return; }
    setEditing(null);
    load();
  };

  const remove = async (post: BlogPost) => {
    if (!confirm(`¿Borrar "${post.title}"?`)) return;
    await supabase.from('blog_posts').delete().eq('id', post.id);
    load();
  };

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-3xl">
        <h2 className="text-xl font-black mb-6">{editing.id ? 'Editar artículo' : 'Nuevo artículo'}</h2>
        <div className="space-y-4">
          <input placeholder="Título" value={editing.title}
            onChange={e => setEditing({ ...editing, title: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
          <input placeholder="Resumen corto (aparece en la tarjeta)" value={editing.excerpt}
            onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
          <input placeholder="URL de imagen de portada (opcional)" value={editing.cover_image}
            onChange={e => setEditing({ ...editing, cover_image: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
          <textarea placeholder="Contenido del artículo..." value={editing.content} rows={12}
            onChange={e => setEditing({ ...editing, content: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none resize-y" />
          <label className="flex items-center gap-3 font-semibold text-gray-700">
            <input type="checkbox" checked={editing.published}
              onChange={e => setEditing({ ...editing, published: e.target.checked })} className="w-5 h-5 accent-green-600" />
            Publicado (visible en la web)
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving || !editing.title}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(null)} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setEditing({ ...emptyPost })}
        className="mb-6 px-5 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
        <i className="fa-solid fa-plus mr-2"></i>Nuevo artículo
      </button>

      {loading ? (
        <div className="text-center py-16 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>
      ) : posts.length === 0 ? (
        <p className="text-gray-400 py-10 text-center">No hay artículos todavía.</p>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">{post.title}</p>
                <span className={`text-xs font-bold ${post.published ? 'text-green-600' : 'text-gray-400'}`}>
                  {post.published ? '● Publicado' : '○ Borrador'}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing({ ...post, excerpt: post.excerpt || '', cover_image: post.cover_image || '' })}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 text-sm font-bold">
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button onClick={() => remove(post)}
                  className="px-3 py-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 text-sm font-bold">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
