import React, { useEffect, useState, useRef } from 'react';
import { supabase, BlogPost, AvailabilityItem, Reservation, ReservationStatus, Apartment } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AdminPanelProps {
  language: 'es' | 'en';
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminPanel: React.FC<AdminPanelProps> = ({ language }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'inicio' | 'reservas' | 'board' | 'rooms' | 'apartments' | 'cotizador' | 'avail' | 'conta' | 'checkins' | 'guia' | 'blog'>('inicio');

  // Login real (Supabase Auth)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg('');
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setAuthMsg('Correo o contraseña incorrectos.');
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const authed = !!session;

  if (checking) {
    return <div className="text-center py-32 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  // ---------- LOGIN ----------
  if (!authed) {
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
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
            <input type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
            {authMsg && <p className="text-red-500 text-sm">{authMsg}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">
              {authLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
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
          <p className="text-gray-500 text-sm">{session?.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell onOpenReservas={() => setTab('reservas')} />
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 text-sm">
            <i className="fa-solid fa-right-from-bracket mr-2"></i>Salir
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        <button onClick={() => setTab('inicio')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'inicio' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-house mr-2"></i>Inicio
        </button>
        <button onClick={() => setTab('board')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'board' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-table-columns mr-2"></i>Calendario general
        </button>
        <button onClick={() => setTab('reservas')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'reservas' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-bell-concierge mr-2"></i>Reservas
        </button>
        <button onClick={() => setTab('rooms')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'rooms' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-calendar-days mr-2"></i>Por habitación
        </button>
        <button onClick={() => setTab('apartments')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'apartments' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-building mr-2"></i>Apartamentos
        </button>
        <button onClick={() => setTab('cotizador')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'cotizador' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-file-invoice-dollar mr-2"></i>Cotizador
        </button>
        <button onClick={() => setTab('avail')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'avail' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-toggle-on mr-2"></i>Disponibilidad
        </button>
        <button onClick={() => setTab('conta')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'conta' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-chart-line mr-2"></i>Contabilidad
        </button>
        <button onClick={() => setTab('checkins')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'checkins' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-id-card mr-2"></i>Check-ins
        </button>
        <button onClick={() => setTab('guia')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'guia' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-book-open mr-2"></i>Guía
        </button>
        <button onClick={() => setTab('blog')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'blog' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-newspaper mr-2"></i>Blog
        </button>
      </div>

      {tab === 'inicio' ? <Dashboard onGoImport={() => setTab('reservas')} /> : tab === 'reservas' ? <ReservationsManager /> : tab === 'board' ? <TimelineBoard /> : tab === 'rooms' ? <RoomsCalendar /> : tab === 'apartments' ? <ApartmentsManager /> : tab === 'cotizador' ? <Cotizador /> : tab === 'avail' ? <AvailabilityManager /> : tab === 'conta' ? <Contabilidad /> : tab === 'checkins' ? <Checkins /> : tab === 'guia' ? <GuestGuide /> : <BlogManager />}
    </div>
  );
};

// ============ CAMPANITA DE NOTIFICACIONES ============
// Avisa en vivo cuando entra una reserva nueva (web, Ayenda, Booking…) o cuando se cancela una.
interface Notif { key: string; kind: 'new' | 'cancel'; title: string; sub: string; at: number; }

const timeAgo = (ms: number) => {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60); if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

// Un "ding" corto en base64 (no requiere archivos externos)
const playDing = () => {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.start(); o.stop(ctx.currentTime + 0.45);
  } catch { /* sin sonido */ }
};

const NotificationBell: React.FC<{ onOpenReservas: () => void }> = ({ onOpenReservas }) => {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(0);

  const push = (n: Notif) => {
    setItems(prev => (prev.some(x => x.key === n.key) ? prev : [n, ...prev].slice(0, 40)));
    setUnseen(u => u + 1);
    playDing();
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(n.title, { body: n.sub, icon: '/favicon.ico' });
      }
    } catch { /* navegador sin soporte */ }
  };

  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch { /* ignore */ }
    const ch = supabase.channel('notif-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        const r = payload.new as Reservation;
        if (!r || r.status === 'cancelled' || r.source === 'manual' || isBlock(r)) return;
        const canal = SOURCE_LABEL[r.source] || r.source;
        push({
          key: 'new-' + r.id, kind: 'new', title: '🆕 Nueva reserva',
          sub: `${r.guest_name} · ${r.room_name || r.room_id} · ${fmtDate(r.check_in)}→${fmtDate(r.check_out)} · ${canal}`,
          at: Date.now(),
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (payload) => {
        const r = payload.new as Reservation;
        const prev = payload.old as any;
        if (r && r.status === 'cancelled' && prev?.status !== 'cancelled' && !isBlock(r)) {
          push({
            key: 'cancel-' + r.id, kind: 'cancel', title: '❌ Reserva cancelada',
            sub: `${r.guest_name} · ${r.room_name || r.room_id} · ${fmtDate(r.check_in)}`,
            at: Date.now(),
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggle = () => { setOpen(o => !o); if (!open) setUnseen(0); };

  return (
    <div className="relative">
      <button onClick={toggle} title="Notificaciones"
        className="relative w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center">
        <i className={`fa-solid fa-bell text-lg ${unseen > 0 ? 'fa-shake text-green-600' : ''}`}></i>
        {unseen > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-black text-gray-800 text-sm"><i className="fa-solid fa-bell mr-2 text-green-600"></i>Notificaciones</span>
              {items.length > 0 && (
                <button onClick={() => { setItems([]); setUnseen(0); }} className="text-xs font-bold text-gray-400 hover:text-gray-600">Limpiar</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-gray-400 text-sm">
                  <i className="fa-regular fa-bell-slash text-2xl mb-2 block"></i>
                  Sin novedades por ahora.<br />Te avisaremos al instante cuando entre o se cancele una reserva.
                </div>
              ) : items.map(n => (
                <button key={n.key + n.at} onClick={() => { onOpenReservas(); setOpen(false); }}
                  className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3">
                  <span className={`mt-0.5 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${n.kind === 'new' ? 'bg-green-600' : 'bg-red-500'}`}>
                    <i className={`fa-solid ${n.kind === 'new' ? 'fa-calendar-check' : 'fa-calendar-xmark'} text-xs`}></i>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-gray-800 text-sm">{n.title}</span>
                    <span className="block text-xs text-gray-500 truncate">{n.sub}</span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">{timeAgo(n.at)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============ GUÍA DE BIENVENIDA DEL HUÉSPED ============
// Muestra la guía (public/bienvenida.html) y deja compartirla con el huésped.
const GUIA_URL = 'https://betotours.com/bienvenida.html';

const GuestGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const waText = encodeURIComponent(`¡Hola! 😊 Aquí tienes tu guía de bienvenida de Aparta Suites Torre de Prado (WiFi, horarios, servicios y más):\n${GUIA_URL}`);
  const copy = async () => {
    try { await navigator.clipboard.writeText(GUIA_URL); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copia el enlace de la guía:', GUIA_URL); }
  };
  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Guía de bienvenida del huésped</h2>
          <p className="text-gray-500 text-sm">Compártela con tus huéspedes: WiFi, horarios, servicios, ubicación, normas, tours y contactos. Se envía sola en el WhatsApp de confirmación.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600">
            <i className="fa-brands fa-whatsapp"></i>Compartir por WhatsApp
          </a>
          <button onClick={copy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200">
            <i className={`fa-solid ${copied ? 'fa-check text-green-600' : 'fa-link'}`}></i>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}
          </button>
          <a href="/bienvenida.html" target="_blank" rel="noopener"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200">
            <i className="fa-solid fa-up-right-from-square"></i>Abrir
          </a>
        </div>
      </div>

      {/* Vista previa de la guía tal como la ve el huésped */}
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-3 sm:p-5 flex justify-center">
        <iframe
          src="/bienvenida.html"
          title="Guía de bienvenida"
          className="w-full max-w-[420px] h-[640px] rounded-2xl bg-white shadow-lg border border-gray-200"
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-3 text-center">
        <i className="fa-solid fa-circle-info mr-1"></i>
        Así se ve en el celular del huésped. El enlace público es <b>{GUIA_URL}</b> (queda activo cuando la página se publique).
      </p>
    </div>
  );
};

// ============ DISPONIBILIDAD / BLOQUEOS ============
// Un "bloqueo" es una reserva interna marcada como Bloqueado (sale en gris en los calendarios)
const isBlock = (r: Reservation) => /bloque/i.test(r.guest_name || '') || /bloqueo/i.test(r.note || '');

const AvailabilityManager: React.FC = () => {
  const [roomId, setRoomId] = useState<string>(ROOMS[0].id);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ check_in: string; check_out: string; motivo: string } | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reservations').select('*').neq('status', 'cancelled');
    if (error && isMissingTable(error)) { setMissing(true); setReservations([]); }
    else { setMissing(false); setReservations((data as Reservation[]) || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const room = roomById(roomId)!;
  const dayMap: Record<string, Reservation> = {};
  reservations.filter(r => r.room_id === roomId).forEach(r => {
    nightsBetween(r.check_in, r.check_out).forEach(d => { dayMap[d] = r; });
  });
  const blocksByRoom: Record<string, number> = {};
  reservations.filter(isBlock).forEach(r => {
    blocksByRoom[r.room_id] = (blocksByRoom[r.room_id] || 0) + nightsBetween(r.check_in, r.check_out).length;
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const onDayClick = (d: number) => {
    const ds = ymd(year, month, d);
    const res = dayMap[ds];
    if (res && !isBlock(res)) return;           // ocupado por huésped
    if (res && isBlock(res)) { setDetail(res); return; } // ver/editar bloqueo
    setForm({ check_in: ds, check_out: addDaysStr(ds, 1), motivo: '' }); // crear bloqueo
  };

  const guardarBloqueo = async () => {
    if (!form || form.check_out <= form.check_in) return;
    setSaving(true);
    await supabase.from('reservations').insert({
      room_id: roomId, room_name: room.name, guest_name: 'Bloqueado',
      check_in: form.check_in, check_out: form.check_out, guests: 1,
      status: 'confirmed', source: 'manual',
      note: form.motivo.trim() ? 'Bloqueo: ' + form.motivo.trim() : 'Bloqueo',
    });
    setSaving(false); setForm(null); load();
  };

  const liberarBloqueo = async (r: Reservation) => {
    setSaving(true);
    await supabase.from('reservations').delete().eq('id', r.id);
    setSaving(false); setDetail(null); load();
  };

  const blockedThisMonth = Object.entries(dayMap).filter(([d, r]) => d.startsWith(ymd(year, month, 1).slice(0, 7)) && isBlock(r)).length;
  const inp = 'w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none';

  return (
    <div>
      {missing && <SetupBanner />}
      <p className="text-gray-500 text-sm mb-4"><i className="fa-solid fa-circle-info mr-1"></i>Toca un día <b>libre</b> para bloquearlo (sale en gris). Toca un día <b>bloqueado</b> para liberarlo. Los días con reserva no se pueden bloquear.</p>
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Selector de habitaciones */}
        <div>
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Habitaciones</h2>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {ROOMS.map(r => {
              const blk = blocksByRoom[r.id] || 0;
              const active = r.id === roomId;
              return (
                <button key={r.id} onClick={() => setRoomId(r.id)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-100 hover:border-green-300'}`}>
                  <span className="flex items-center gap-2"><i className={`fa-solid ${r.penthouse ? 'fa-crown' : 'fa-door-closed'} text-xs`}></i>{r.name}</span>
                  {blk > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-gray-200 text-gray-600'}`}>{blk}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendario de bloqueos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-black text-gray-900">{room.name}</p>
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
                const ds = ymd(year, month, d);
                const res = dayMap[ds];
                const blocked = res && isBlock(res);
                const occupied = res && !isBlock(res);
                const cls = blocked ? 'bg-gray-400 text-white hover:bg-gray-500'
                  : occupied ? 'bg-green-200 text-green-800 cursor-not-allowed opacity-70'
                  : 'bg-green-50 text-green-700 hover:bg-gray-200';
                return (
                  <button key={i} onClick={() => onDayClick(d)}
                    title={blocked ? 'Bloqueado — clic para ver/liberar' : occupied ? `Ocupado: ${res!.guest_name}` : 'Libre — clic para bloquear'}
                    className={`aspect-square rounded-lg text-sm font-bold transition flex items-center justify-center ${cls} ${isToday(d) ? 'ring-2 ring-green-600' : ''}`}>
                    {blocked ? <i className="fa-solid fa-lock text-xs"></i> : d}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100 text-xs flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200"></span>Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-400"></span>Bloqueado</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200"></span>Con reserva</span>
            <span className="ml-auto text-gray-500"><b className="text-gray-700">{blockedThisMonth}</b> días bloqueados este mes</span>
          </div>
        </div>
      </div>

      {/* Ventana: crear bloqueo (fecha + motivo) */}
      {form && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setForm(null); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-black text-gray-900 mb-1"><i className="fa-solid fa-lock text-gray-500 mr-2"></i>Bloquear días</h2>
            <p className="text-sm text-gray-500 mb-4">{room.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-bold text-gray-600">Desde
                <input type="date" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} className={inp + ' mt-1 font-normal'} />
              </label>
              <label className="text-sm font-bold text-gray-600">Hasta (salida)
                <input type="date" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} className={inp + ' mt-1 font-normal'} />
              </label>
            </div>
            <label className="text-sm font-bold text-gray-600 block mt-3">Motivo
              <input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Mantenimiento, uso personal…" className={inp + ' mt-1 font-normal'} />
            </label>
            <p className="text-xs text-gray-400 mt-2">Tiempo: <b>{Math.max(0, nightsBetween(form.check_in, form.check_out).length)} día(s)</b></p>
            <div className="flex gap-2 mt-5">
              <button onClick={guardarBloqueo} disabled={saving || form.check_out <= form.check_in} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50">{saving ? 'Guardando…' : 'Bloquear'}</button>
              <button onClick={() => setForm(null)} className="px-5 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana: ver bloqueo (fecha, motivo, tiempo) */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900"><i className="fa-solid fa-lock text-gray-500 mr-2"></i>Día bloqueado</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p><span className="text-gray-400 font-bold">Habitación:</span> <b>{detail.room_name || detail.room_id}</b></p>
              <p><span className="text-gray-400 font-bold">Desde:</span> {fullDate(detail.check_in)}</p>
              <p><span className="text-gray-400 font-bold">Hasta:</span> {fullDate(detail.check_out)}</p>
              <p><span className="text-gray-400 font-bold">Tiempo:</span> {detail.nights || nightsBetween(detail.check_in, detail.check_out).length} día(s)</p>
              <p><span className="text-gray-400 font-bold">Motivo:</span> {(detail.note || '').replace(/^bloqueo:?\s*/i, '') || 'Sin especificar'}</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => liberarBloqueo(detail)} disabled={saving} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50"><i className="fa-solid fa-lock-open mr-1.5"></i>{saving ? '...' : 'Liberar'}</button>
              <button onClick={() => setDetail(null)} className="px-5 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ HABITACIONES (CALENDARIO) ============
interface Room { id: string; name: string; guests: number; bed: string; price: string; penthouse?: boolean; }

const ROOMS: Room[] = [
  { id: '200', name: 'Aparta Suite 200', guests: 2, bed: '—', price: '—' },
  { id: '201b', name: 'Aparta Suite 201 B', guests: 2, bed: '—', price: '—' },
  { id: '202', name: 'Aparta Suite 202 (Super Suite)', guests: 10, bed: '—', price: '—' },
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
  { id: '503', name: 'Aparta Suite 503', guests: 2, bed: '—', price: '—' },
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
// Días enteros entre dos fechas 'YYYY-MM-DD' (b - a). Positivo si b es posterior.
const daysDiff = (a: string, b: string) =>
  Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
// Noches ocupadas [check_in, check_out) como array de 'YYYY-MM-DD'
const nightsBetween = (checkIn: string, checkOut: string): string[] => {
  const out: string[] = [];
  const d = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  while (d < end) { out.push(ymd(d.getFullYear(), d.getMonth(), d.getDate())); d.setDate(d.getDate() + 1); }
  return out;
};
// ¿Se cruzan dos rangos [aIn,aOut) y [bIn,bOut)?
const rangesOverlap = (aIn: string, aOut: string, bIn: string, bOut: string) => aIn < bOut && bIn < aOut;
// Apartamentos libres en un rango de fechas
const freeRoomsInRange = (reservations: Reservation[], ci: string, co: string): Room[] =>
  ROOMS.filter(room => !reservations.some(r => r.room_id === room.id && rangesOverlap(ci, co, r.check_in, r.check_out)));

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
const ReservationForm: React.FC<{ initial: Partial<Reservation>; quick?: boolean; onSaved: () => void; onCancel: () => void; }> = ({ initial, quick, onSaved, onCancel }) => {
  const [f, setF] = useState<Partial<Reservation>>(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [ocr, setOcr] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');
  const [err, setErr] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteMsg, setPasteMsg] = useState('');
  const set = (k: keyof Reservation, v: any) => setF(p => ({ ...p, [k]: v }));

  // Reserva rápida: pega el mensaje de WhatsApp y carga los datos solos
  const rellenarDesdeTexto = () => {
    if (!pasteText.trim()) { setPasteMsg('Pega primero el mensaje del cliente.'); return; }
    const { campos, data } = parseReservaTexto(pasteText);
    if (!campos.length) { setPasteMsg('No reconocí datos. Revisa el texto o llena los campos a mano.'); return; }
    setF(p => ({ ...p, ...data }));
    setPasteMsg(`✅ Cargué: ${campos.join(', ')}. Elige el apartamento y revisa antes de guardar.`);
  };

  const subirImagen = async (file: File) => {
    setUploadingImg(true); setOcrMsg('');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `reserva-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('documentos').upload(path, file, { upsert: true, contentType: file.type });
    if (!error) { const { data } = supabase.storage.from('documentos').getPublicUrl(path); setF(p => ({ ...p, image_url: data.publicUrl })); }
    setUploadingImg(false);
    leerImagen(file);
  };

  // OCR en el navegador (Tesseract) para autollenar fechas, valor y nombre
  const leerImagen = async (file: File) => {
    setOcr(true); setOcrMsg('Leyendo la imagen…');
    try {
      const T: any = await new Promise((res, rej) => {
        if ((window as any).Tesseract) return res((window as any).Tesseract);
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = () => res((window as any).Tesseract); s.onerror = rej; document.head.appendChild(s);
      });
      const { data } = await T.recognize(file, 'spa');
      const texto: string = data.text || '';
      const flat = texto.replace(/\s+/g, ' ');
      // Fechas (ISO, dd/mm, "dd mmm")
      const fechas = extraerFechas(texto);
      // Valor (mayor monto con $ o COP)
      const montos = (flat.match(/(\$|cop)\s*[\d.,]{4,}/gi) || []).map(m => parseMoney(m)).filter(Boolean) as number[];
      const total = montos.length ? Math.max(...montos) : null;
      // Nombre (línea con 2+ palabras Capitalizadas)
      const nombre = (texto.split('\n').map(l => l.trim()).find(l => /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+){1,3}[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(l))) || '';
      // Celular (con + e indicativo, o 10 dígitos colombiano). Evita fechas/montos.
      const candTel = (flat.match(/\+?\d[\d\s().\-]{6,}\d/g) || []).map(s => s.trim())
        .filter(s => !/[\/]/.test(s) && !parseDate(s));
      const norm = (s: string) => s.replace(/[^\d+]/g, '');
      const tel = candTel.find(s => /^\+/.test(s.trim()) && norm(s).length >= 8)
        || candTel.find(s => { const d = norm(s).replace(/\D/g, ''); return d.length === 10 && d[0] === '3'; })
        || candTel.find(s => { const d = norm(s).replace(/\D/g, ''); return d.length >= 7 && d.length <= 13; }) || '';
      setF(p => ({
        ...p,
        guest_name: p.guest_name || nombre,
        guest_phone: p.guest_phone || (tel ? norm(tel) : ''),
        check_in: fechas[0] || p.check_in,
        check_out: fechas[1] || p.check_out,
        total: p.total ?? total,
      }));
      const leidos = [fechas[0] && 'entrada', fechas[1] && 'salida', total && 'valor', nombre && 'nombre', tel && 'celular'].filter(Boolean);
      setOcrMsg(leidos.length ? `✅ Leído: ${leidos.join(', ')}. Revisa y completa lo que falte.` : 'No se pudo leer bien la imagen. Llena los datos a mano.');
    } catch (e) {
      setOcrMsg('No se pudo leer la imagen. Llena los datos a mano (la foto sí quedó guardada).');
    }
    setOcr(false);
  };

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
      doc_type: f.doc_type || null, doc_number: f.doc_number || null, nationality: f.nationality || null,
      image_url: f.image_url || null,
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
      <h2 className="text-xl font-black mb-4">{f.id ? 'Editar reserva' : quick ? '⚡ Reserva rápida' : 'Nueva reserva'}</h2>
      {err && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg p-3">{err}</p>}

      {/* Reserva rápida: pega el mensaje de WhatsApp y carga los datos solos */}
      {!f.id && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-black text-blue-800 mb-1"><i className="fa-solid fa-bolt mr-1"></i>Reserva rápida: pega el mensaje del cliente</p>
          <p className="text-xs text-blue-700/80 mb-2">Pega aquí lo que te mandaron por WhatsApp (nombre, correo, documento, fechas, # de personas) y le doy "Rellenar".</p>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={4}
            placeholder={'Ej:\nNombre: Juan Pérez\nCorreo: juan@gmail.com\nDocumento: 1018456789\nEntrada: 15 de junio\nSalida: 18 de junio\nPersonas: 3'}
            className="w-full p-3 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-y" />
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={rellenarDesdeTexto} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
              <i className="fa-solid fa-wand-magic-sparkles mr-1.5"></i>Rellenar datos
            </button>
            {pasteText && <button type="button" onClick={() => { setPasteText(''); setPasteMsg(''); }} className="text-blue-500 hover:text-blue-700 text-sm font-bold">Limpiar</button>}
          </div>
          {pasteMsg && <p className="text-xs text-gray-600 mt-2">{pasteMsg}</p>}
        </div>
      )}

      {/* Subir imagen de la reserva → lee los datos solo (OCR) */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
        <p className="text-sm font-black text-green-800 mb-2"><i className="fa-solid fa-wand-magic-sparkles mr-1"></i>Sube la foto de la reserva y carga los datos solo</p>
        <div className="flex items-center gap-3">
          <label className={`px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer inline-flex items-center gap-2 ${(uploadingImg || ocr) ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            <i className={`fa-solid ${(uploadingImg || ocr) ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>{ocr ? 'Leyendo…' : uploadingImg ? 'Subiendo…' : (f.image_url ? 'Cambiar foto' : 'Subir foto')}
            <input type="file" accept="image/*" disabled={uploadingImg || ocr} className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) subirImagen(file); e.currentTarget.value = ''; }} />
          </label>
          {f.image_url && <a href={f.image_url} target="_blank" rel="noopener noreferrer"><img src={f.image_url} className="h-12 w-12 object-cover rounded-lg border border-gray-200" /></a>}
          {f.image_url && <button type="button" onClick={() => set('image_url', null)} className="text-red-400 hover:text-red-600 text-sm"><i className="fa-solid fa-trash"></i></button>}
        </div>
        {ocrMsg && <p className="text-xs text-gray-500 mt-2">{ocrMsg}</p>}
      </div>

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
          <input value={f.guest_phone || ''} onChange={e => set('guest_phone', e.target.value)} placeholder="+57 300 123 4567" className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Correo (opcional)
          <input type="email" value={f.guest_email || ''} onChange={e => set('guest_email', e.target.value)} className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600">Tipo de documento
          <select value={f.doc_type || ''} onChange={e => set('doc_type', e.target.value)} className={inp + ' mt-1 font-normal'}>
            <option value="">—</option>
            <option value="CC">CC (Cédula)</option>
            <option value="CE">CE (Cédula extranjería)</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="TI">TI</option>
            <option value="NIT">NIT</option>
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600">N° de documento
          <input value={f.doc_number || ''} onChange={e => set('doc_number', e.target.value)} placeholder="Documento" className={inp + ' mt-1 font-normal'} />
        </label>
        <label className="text-sm font-bold text-gray-600 sm:col-span-2">Nacionalidad
          <input value={f.nationality || ''} onChange={e => set('nationality', e.target.value)} placeholder="Ej: Colombiana" className={inp + ' mt-1 font-normal'} />
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
        <label className="text-sm font-bold text-gray-600 sm:col-span-2">Valor / Precio total (opcional)
          <input type="number" min={0} step={1000} value={f.total ?? ''} placeholder="Ej: 420000"
            onChange={e => set('total', e.target.value === '' ? null : Number(e.target.value))}
            className={inp + ' mt-1 font-normal'} />
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

// ============ INICIO (resumen para el hotelero) ============
const money = (n: number | null | undefined) => '$' + (n || 0).toLocaleString('es-CO');
const fullDate = (s: string) => { const d = new Date(s + 'T00:00:00'); return `${WEEKDAYS_ES[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS_ES[d.getMonth()].slice(0, 3).toLowerCase()}`; };

// Número oficial de confirmación de Beto Tours / Aparta Suites
const CONFIRM_PHONE = '573332482626';

// Mensaje de confirmación para enviar al huésped por WhatsApp
const confirmacionWA = (r: Reservation) => {
  const nombre = r.guest_name.split(' ')[0];
  // El 304, la 201 B y la casita están en otra dirección (Villa Hermosa, La Mansión)
  const esMansion = r.room_id === '304' || r.room_id === 'casita' || r.room_id === '201b';
  const direccion = esMansion ? 'Carrera 45D # 63-33, Barrio Villa Hermosa (La Mansión), Medellín' : 'Carrera 47 # 64-41, Medellín';
  const mapsLink = esMansion ? 'https://maps.app.goo.gl/1zjs7MWBSzQytnP16?g_st=ic' : 'https://maps.app.goo.gl/6hp1SAxcHP8W4CaV6?g_st=ic';
  return `¡Hola ${nombre}! 😊\n\n` +
    `Gracias por elegir *Aparta Suites Torre de Prado* by Beto Tours.\n\n` +
    `🏠 ${r.room_name || r.room_id}\n` +
    `📅 Entrada: ${fullDate(r.check_in)} (desde las 3:00 p.m.)\n` +
    `📅 Salida: ${fullDate(r.check_out)} (hasta las 11:00 a.m.)\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📖 *TU GUÍA DE BIENVENIDA*\n` +
    `👉 https://betotours.com/bienvenida.html\n` +
    `Ábrela aquí: WiFi y clave, cómo llegar, check-in, qué hacer en Medellín, tours, restaurantes y todas las recomendaciones. ¡Guárdala! 📲\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `📍 *Ubicación*\n` +
    `${direccion}\n` +
    `Para llegar fácilmente, usa este enlace:\n` +
    `${mapsLink}\n\n` +
    `⏰ *Horarios*\n` +
    `• Check-in: desde las 3:00 p.m.\n` +
    `• Check-out: hasta las 11:00 a.m.\n\n` +
    `🚗 *Parqueadero*\n` +
    `Contamos con parqueadero sujeto a disponibilidad al momento de tu llegada.\n` +
    `• Automóvil: $17.000 COP por noche\n` +
    `• Motocicleta: $8.000 COP por noche\n` +
    `Si no hay disponibilidad, existe un parqueadero privado a ~3 cuadras del alojamiento, donde también podrás estacionar tu vehículo de forma segura.\n\n` +
    `🏨 *Reservas directas*\n` +
    `Para futuras estadías, reserva directamente con nosotros en:\n` +
    `https://betotours.com/alojamientos.html\n` +
    `Reservando directo accedes a nuestras mejores tarifas y atención personalizada.\n\n` +
    `🎒 *Tours y experiencias en Medellín*\n` +
    `Durante tu estadía también puedes reservar nuestros tours y actividades en:\n` +
    `www.betotours.com\n\n` +
    `Encontrarás opciones como:\n` +
    `• Guatapé y Piedra del Peñol\n` +
    `• Tour Comuna 13\n` +
    `• City Tour Medellín\n` +
    `• Hacienda Nápoles\n` +
    `• Santa Fe de Antioquia\n` +
    `• Y muchas más experiencias\n\n` +
    `📲 Si tienes alguna pregunta o necesitas ayuda antes de tu llegada, estaremos encantados de atenderte.\n\n` +
    `¡Te esperamos y te deseamos una excelente estadía! ✨\n\nBeto Tours`;
};
const waLink = (phone: string | null, text: string) => {
  const p = (phone || '').replace(/\D/g, '');
  if (!p) return '';
  const full = p.length === 10 ? '57' + p : p; // celular colombiano sin indicativo
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
};

// Datos del hotel para el PDF de confirmación
const HOTEL = { name: 'Aparta Suites Torre de Prado', address: 'Carrera 47 # 64-41, Medellín, Colombia', phone: '+57 333 248 2626', rnt: '', nit: '' };

// Reporte / Registro Nacional de Huéspedes (Ley 300 de 1996) — imprimible para descargar
const generarReporteHuespedes = (res: Reservation[], periodo: string) => {
  const w = window.open('', '_blank', 'width=1000,height=800');
  if (!w) { alert('Permite las ventanas emergentes para generar el reporte.'); return; }
  const filas = res.slice().sort((a, b) => a.check_in.localeCompare(b.check_in));
  const totalNoches = filas.reduce((s, r) => s + (r.nights || nightsBetween(r.check_in, r.check_out).length), 0);
  const rows = filas.map((r, i) => `<tr>
    <td>${i + 1}</td>
    <td>${r.guest_name}</td>
    <td style="text-align:center">${r.doc_type || ''}</td>
    <td>${r.doc_number || ''}</td>
    <td>${r.nationality || ''}</td>
    <td style="text-align:center">${r.room_id}</td>
    <td>${fullDate(r.check_in)}</td>
    <td>${fullDate(r.check_out)}</td>
    <td style="text-align:center">${r.nights || nightsBetween(r.check_in, r.check_out).length}</td>
    <td style="text-align:center">${r.guests || 1}</td>
    <td>${r.guest_phone || ''}</td>
    <td></td>
  </tr>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Registro de Huéspedes ${periodo}</title>
  <style>
    *{font-family:Arial,sans-serif;box-sizing:border-box}
    body{margin:0;padding:24px;color:#1e293b;font-size:12px}
    .head{text-align:center;border-bottom:3px solid #16a34a;padding-bottom:12px;margin-bottom:8px}
    .head h1{margin:0;font-size:18px;color:#15803d}
    .head h2{margin:4px 0;font-size:14px}
    .meta{display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-bottom:12px}
    table{width:100%;border-collapse:collapse;font-size:10px}
    th,td{border:1px solid #cbd5e1;padding:5px;text-align:left}
    th{background:#f0fdf4;font-size:9px;text-transform:uppercase;color:#166534}
    .foot{margin-top:16px;font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px}
    .btn{background:#16a34a;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:bold;cursor:pointer}
    @media print{.no-print{display:none}}
  </style></head><body>
  <div class="no-print" style="text-align:right;margin-bottom:10px"><button class="btn" onclick="window.print()">⬇️ Descargar / Imprimir PDF</button></div>
  <div class="head">
    <h1>REGISTRO NACIONAL DE HUÉSPEDES</h1>
    <h2>${HOTEL.name}</h2>
    <p style="margin:2px 0;font-size:11px">${HOTEL.address} · Tel: ${HOTEL.phone}</p>
  </div>
  <div class="meta">
    <span><b>RNT:</b> ${HOTEL.rnt || '________________'}　<b>NIT:</b> ${HOTEL.nit || '________________'}</span>
    <span><b>Período:</b> ${periodo}　<b>Generado:</b> ${new Date().toLocaleDateString('es-CO')}</span>
  </div>
  <table>
    <thead><tr>
      <th>#</th><th>Nombre del huésped</th><th>Tipo doc.</th><th>N° documento</th><th>Nacionalidad</th>
      <th>Hab.</th><th>Entrada</th><th>Salida</th><th>Noches</th><th>Pers.</th><th>Teléfono</th><th>Firma</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="12" style="text-align:center;padding:20px">Sin huéspedes en el período.</td></tr>'}</tbody>
  </table>
  <p style="margin-top:8px;font-size:11px"><b>Total huéspedes:</b> ${filas.length}　<b>Total noches:</b> ${totalNoches}</p>
  <div class="foot">
    Documento generado para el cumplimiento del <b>Registro Nacional de Huéspedes</b> (Ley 300 de 1996, art. 87 y normas concordantes).
    Para huéspedes extranjeros, recuerde reportar a <b>Migración Colombia (SIRE)</b>.
    Complete los campos de documento y nacionalidad según la tarjeta de registro de cada huésped.
  </div>
  </body></html>`;
  w.document.write(html); w.document.close();
};
const SOURCE_LABELS: Record<string, string> = { web: 'Directa (Web)', whatsapp: 'WhatsApp', ayenda: 'Ayenda', externo: 'Externo', manual: 'Directa', booking: 'Booking', airbnb: 'Airbnb', expedia: 'Expedia' };
const STATUS_TXT: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };

// Historial completo de reservas (imprimible / descargable)
const generarHistorial = (res: Reservation[]) => {
  const w = window.open('', '_blank', 'width=1000,height=800');
  if (!w) { alert('Permite las ventanas emergentes para generar el historial.'); return; }
  const filas = res.slice().sort((a, b) => b.check_in.localeCompare(a.check_in));
  const total = filas.reduce((s, r) => s + (r.total || 0), 0);
  const rows = filas.map((r, i) => `<tr>
    <td>${i + 1}</td><td>${r.guest_name}</td><td style="text-align:center">${r.room_id}</td>
    <td>${fullDate(r.check_in)}</td><td>${fullDate(r.check_out)}</td>
    <td style="text-align:center">${r.nights || nightsBetween(r.check_in, r.check_out).length}</td>
    <td>${SOURCE_LABELS[channelOf(r) || r.source] || r.source}</td>
    <td>${STATUS_TXT[r.status] || r.status}</td>
    <td style="text-align:right">${(r.total || 0) > 0 ? money(r.total) : '—'}</td></tr>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Historial de reservas</title>
  <style>*{font-family:Arial,sans-serif}body{margin:0;padding:24px;font-size:11px;color:#1e293b}
  h1{color:#15803d;font-size:18px;margin:0 0 4px}.sub{color:#64748b;font-size:11px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #cbd5e1;padding:5px}
  th{background:#f0fdf4;text-transform:uppercase;font-size:9px;color:#166534;text-align:left}
  .btn{background:#16a34a;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:bold;cursor:pointer}
  @media print{.no-print{display:none}}</style></head><body>
  <div class="no-print" style="text-align:right;margin-bottom:10px"><button class="btn" onclick="window.print()">⬇️ Descargar / Imprimir PDF</button></div>
  <h1>Historial de reservas — ${HOTEL.name}</h1>
  <p class="sub">Total: ${filas.length} reservas · Generado ${new Date().toLocaleDateString('es-CO')}</p>
  <table><thead><tr><th>#</th><th>Huésped</th><th>Hab.</th><th>Entrada</th><th>Salida</th><th>Noches</th><th>Canal</th><th>Estado</th><th>Valor</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="9" style="text-align:center;padding:20px">Sin reservas.</td></tr>'}</tbody>
  <tfoot><tr style="font-weight:bold"><td colspan="8" style="text-align:right;padding:6px">TOTAL</td><td style="text-align:right">${money(total)}</td></tr></tfoot>
  </table></body></html>`;
  w.document.write(html); w.document.close();
};

// Genera una confirmación imprimible (Guardar como PDF) estilo Booking
const generarPDF = (r: Reservation) => {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) { alert('Permite las ventanas emergentes para generar el PDF.'); return; }
  const canal = channelOf(r) || (r.source === 'web' ? 'directa' : r.source);
  const noches = r.nights || nightsBetween(r.check_in, r.check_out).length;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Confirmación ${r.guest_name}</title>
  <style>
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
    body{margin:0;color:#1e293b;background:#fff}
    .wrap{max-width:720px;margin:0 auto;padding:32px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #16a34a;padding-bottom:16px;margin-bottom:24px}
    .head h1{margin:0;font-size:22px;color:#15803d}
    .head p{margin:2px 0;font-size:13px;color:#64748b}
    .badge{display:inline-block;background:#dcfce7;color:#15803d;font-weight:bold;font-size:12px;padding:5px 12px;border-radius:20px}
    h2{font-size:15px;color:#0f172a;border-left:4px solid #16a34a;padding-left:8px;margin:24px 0 12px}
    table{width:100%;border-collapse:collapse;font-size:14px}
    td{padding:9px 4px;border-bottom:1px solid #f1f5f9}
    td.l{color:#64748b;font-weight:bold;width:42%}
    .total{background:#f0fdf4;border-radius:10px;padding:16px;margin-top:16px;display:flex;justify-content:space-between;align-items:center}
    .total .v{font-size:24px;font-weight:bold;color:#15803d}
    .foot{margin-top:32px;font-size:12px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px}
    @media print{.no-print{display:none}}
    .btn{background:#16a34a;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px}
  </style></head><body><div class="wrap">
    <div class="no-print" style="text-align:right;margin-bottom:12px"><button class="btn" onclick="window.print()">⬇️ Descargar / Imprimir PDF</button></div>
    <div class="head">
      <div><h1>🏨 ${HOTEL.name}</h1><p>${HOTEL.address}</p><p>Tel: ${HOTEL.phone}</p></div>
      <div style="text-align:right"><div class="badge">RESERVA ${r.status === 'confirmed' ? 'CONFIRMADA' : 'PENDIENTE'}</div><p style="margin-top:8px">N.º ${(r.note || '').replace(/[^0-9]/g, '') || r.id.slice(0, 8)}</p></div>
    </div>
    <h2>Datos del huésped</h2>
    <table>
      <tr><td class="l">Nombre</td><td>${r.guest_name}</td></tr>
      ${r.guest_phone ? `<tr><td class="l">Teléfono</td><td>${r.guest_phone}</td></tr>` : ''}
      ${r.guest_email ? `<tr><td class="l">Correo</td><td>${r.guest_email}</td></tr>` : ''}
    </table>
    <h2>Detalles de la estadía</h2>
    <table>
      <tr><td class="l">Alojamiento</td><td><b>${r.room_name || r.room_id}</b></td></tr>
      <tr><td class="l">Dirección</td><td>${HOTEL.address}</td></tr>
      <tr><td class="l">Entrada (check-in)</td><td>${fullDate(r.check_in)} · 3:00 PM</td></tr>
      <tr><td class="l">Salida (check-out)</td><td>${fullDate(r.check_out)} · 12:00 PM</td></tr>
      <tr><td class="l">Noches</td><td>${noches} noche${noches === 1 ? '' : 's'}</td></tr>
      <tr><td class="l">Huéspedes</td><td>${r.guests || 1}</td></tr>
      <tr><td class="l">Canal</td><td>${SOURCE_LABELS[canal] || canal || 'Directa'}</td></tr>
    </table>
    ${(r.total || 0) > 0 ? `<div class="total"><span style="font-weight:bold;color:#475569">Valor total</span><span class="v">${money(r.total)}</span></div>` : ''}
    <p style="margin-top:24px;font-size:14px">¡Gracias por reservar con nosotros, <b>${r.guest_name.split(' ')[0]}</b>! Te esperamos en Medellín. 🇨🇴</p>
    <div class="foot">${HOTEL.name} · ${HOTEL.address} · ${HOTEL.phone}<br>Esta es tu confirmación de reserva. Consérvala para tu check-in.</div>
  </div></body></html>`;
  w.document.write(html);
  w.document.close();
};

const GuestRow: React.FC<{ r: Reservation; onClick?: () => void }> = ({ r, onClick }) => {
  const phone = (r.guest_phone || '').replace(/\D/g, '');
  const meta = STATUS_META[r.status];
  return (
    <div onClick={onClick} className={`flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0 ${onClick ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg' : ''}`}>
      <div className="min-w-0">
        <p className="font-bold text-gray-800 truncate">{r.guest_name}</p>
        <p className="text-xs text-gray-500">
          <i className="fa-solid fa-door-open mr-1"></i>{r.room_name || r.room_id}
          <span className="mx-1.5 text-gray-300">·</span>{fmtDate(r.check_in)} → {fmtDate(r.check_out)}
          <span className="mx-1.5 text-gray-300">·</span>{r.nights || ''} noche{(r.nights || 0) === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}>{meta.label}</span>
        {phone && <a onClick={e => e.stopPropagation()} href={waLink(r.guest_phone, confirmacionWA(r))} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm"><i className="fa-brands fa-whatsapp"></i></a>}
      </div>
    </div>
  );
};

// Ficha de detalle de una reserva (solo lectura + acciones rápidas)
const ReservationDetail: React.FC<{ r: Reservation; onEdit?: () => void; onClose: () => void; onChanged: () => void; }> = ({ r, onEdit, onClose, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const phone = (r.guest_phone || '').replace(/\D/g, '');
  const meta = STATUS_META[r.status];
  const setStatus = async (status: ReservationStatus) => { setBusy(true); await supabase.from('reservations').update({ status }).eq('id', r.id); setBusy(false); onChanged(); };
  const remove = async () => { if (!confirm(`¿Borrar la reserva de ${r.guest_name}?`)) return; setBusy(true); await supabase.from('reservations').delete().eq('id', r.id); setBusy(false); onChanged(); };
  const Row: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <i className={`fa-solid ${icon} text-gray-400 w-4 text-center mt-0.5`}></i>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-bold uppercase">{label}</p>
        <p className="text-sm text-gray-800 font-semibold break-words">{value}</p>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">{r.guest_name}</h2>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}>{meta.label}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-1">
            <Row icon="fa-door-open" label="Habitación" value={r.room_name || r.room_id} />
            <Row icon="fa-calendar-day" label="Llegada" value={fullDate(r.check_in)} />
            <Row icon="fa-calendar-xmark" label="Salida" value={fullDate(r.check_out)} />
            <Row icon="fa-moon" label="Noches" value={`${r.nights || ''} noche${(r.nights || 0) === 1 ? '' : 's'} · ${r.guests || 1} huésped${(r.guests || 1) === 1 ? '' : 'es'}`} />
            {r.guest_phone && <Row icon="fa-phone" label="Teléfono" value={r.guest_phone} />}
            {r.guest_email && <Row icon="fa-envelope" label="Correo" value={r.guest_email} />}
            <Row icon="fa-tag" label="Origen" value={SOURCE_LABEL[r.source] || r.source} />
            {(r.total || 0) > 0 && <Row icon="fa-sack-dollar" label="Valor" value={money(r.total)} />}
            {r.note && <Row icon="fa-note-sticky" label="Nota" value={r.note} />}
          </div>

          {r.image_url && (
            <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="block mt-3">
              <img src={r.image_url} alt="Imagen de la reserva" className="w-full max-h-52 object-cover rounded-xl border border-gray-100" />
              <p className="text-[11px] text-gray-400 text-center mt-1">Imagen de la reserva (clic para ampliar)</p>
            </a>
          )}

          <div className="flex flex-wrap gap-2 mt-5">
            {phone && <a href={waLink(r.guest_phone, confirmacionWA(r))} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700"><i className="fa-brands fa-whatsapp mr-1.5"></i>Enviar confirmación</a>}
            <button onClick={() => generarPDF(r)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"><i className="fa-solid fa-file-pdf mr-1.5"></i>PDF</button>
            {phone && <a href={waLink(r.guest_phone, `¡Hola ${r.guest_name.split(' ')[0]}! 😊 Para agilizar tu check-in, por favor completa tu registro de huésped en este enlace (es rápido y obligatorio por ley):\n\nhttps://betotours.com/registro.html?rid=${r.id}&n=${encodeURIComponent(r.guest_name)}\n\n¡Gracias! Aparta Suites Torre de Prado · Beto Tours`)} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"><i className="fa-solid fa-id-card mr-1.5"></i>Registro</a>}
            {(r.source === 'manual' || r.source === 'web') && r.status !== 'confirmed' && <button disabled={busy} onClick={() => setStatus('confirmed')} className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 disabled:opacity-50"><i className="fa-solid fa-check mr-1.5"></i>Confirmar</button>}
            {r.status !== 'cancelled' && <button disabled={busy} onClick={() => setStatus('cancelled')} className="px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 disabled:opacity-50"><i className="fa-solid fa-ban mr-1.5"></i>Cancelar</button>}
            {onEdit && <button onClick={onEdit} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"><i className="fa-solid fa-pen mr-1.5"></i>Editar</button>}
            <button disabled={busy} onClick={remove} className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-sm hover:bg-red-100 disabled:opacity-50"><i className="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ onGoImport: () => void }> = ({ onGoImport }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [detail, setDetail] = useState<Reservation | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reservations').select('*').neq('status', 'cancelled');
    if (error && isMissingTable(error)) { setMissing(true); setReservations([]); }
    else { setMissing(false); setReservations(((data as Reservation[]) || []).filter(r => !isBlock(r))); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const ch = supabase.channel('dash-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;

  const today = todayStr();
  const monthPrefix = today.slice(0, 7);
  const arrivals = reservations.filter(r => r.check_in === today).sort((a, b) => a.room_id.localeCompare(b.room_id));
  const departures = reservations.filter(r => r.check_out === today);
  const inHouse = reservations.filter(r => r.check_in <= today && r.check_out > today);
  const upcoming = reservations.filter(r => r.check_in > today).sort((a, b) => a.check_in.localeCompare(b.check_in)).slice(0, 6);
  const monthRevenue = reservations.filter(r => r.status === 'confirmed' && r.check_in.startsWith(monthPrefix)).reduce((s, r) => s + (r.total || 0), 0);
  const occPct = Math.round((inHouse.length / ROOMS.length) * 100);

  const cards = [
    { icon: 'fa-plane-arrival', color: 'bg-green-100 text-green-700', label: 'Llegadas hoy', value: arrivals.length },
    { icon: 'fa-plane-departure', color: 'bg-blue-100 text-blue-700', label: 'Salidas hoy', value: departures.length },
    { icon: 'fa-bed', color: 'bg-purple-100 text-purple-700', label: 'Alojados hoy', value: inHouse.length },
    { icon: 'fa-sack-dollar', color: 'bg-amber-100 text-amber-700', label: 'Ingresos del mes', value: money(monthRevenue), small: true },
  ];

  return (
    <div className="space-y-6">
      {missing && <SetupBanner />}

      {/* Saludo */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">¡Hola, Beto! 👋</h2>
          <p className="text-gray-500 text-sm capitalize">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <a href="/bienvenida.html" target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-sm hover:bg-green-100">
          <i className="fa-solid fa-book-open"></i>Guía de bienvenida del huésped
        </a>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <p className={`font-black text-gray-900 ${c.small ? 'text-lg' : 'text-3xl'}`}>{c.value}</p>
            <p className="text-xs text-gray-500 font-bold">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Ocupación de hoy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-gray-800">Ocupación de hoy</p>
          <p className="font-black text-green-600">{inHouse.length} / {ROOMS.length} <span className="text-gray-400 font-bold text-sm">({occPct}%)</span></p>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${occPct}%` }}></div>
        </div>
      </div>

      {reservations.length === 0 && !missing && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 text-sm flex items-center justify-between gap-3 flex-wrap">
          <span><i className="fa-solid fa-circle-info mr-1"></i>Todavía no tienes reservas cargadas.</span>
          <button onClick={onGoImport} className="font-bold bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700">Cargar reservas</button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Llegadas de hoy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 mb-3"><i className="fa-solid fa-plane-arrival text-green-600 mr-2"></i>Llegan hoy</h3>
          {arrivals.length === 0 ? <p className="text-gray-400 text-sm py-6 text-center">Sin llegadas para hoy.</p>
            : arrivals.map(r => <GuestRow key={r.id} r={r} onClick={() => setDetail(r)} />)}
        </div>

        {/* Próximas llegadas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 mb-3"><i className="fa-solid fa-calendar-check text-blue-600 mr-2"></i>Próximas llegadas</h3>
          {upcoming.length === 0 ? <p className="text-gray-400 text-sm py-6 text-center">No hay reservas próximas.</p>
            : upcoming.map(r => (
              <div key={r.id} onClick={() => setDetail(r)} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{r.guest_name}</p>
                  <p className="text-xs text-gray-500"><i className="fa-solid fa-door-open mr-1"></i>{r.room_name || r.room_id} <span className="mx-1 text-gray-300">·</span>{r.nights || ''} noche{(r.nights || 0) === 1 ? '' : 's'}</p>
                </div>
                <span className="text-xs font-bold text-gray-600 flex-shrink-0">{fullDate(r.check_in)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Salidas de hoy */}
      {departures.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 mb-3"><i className="fa-solid fa-plane-departure text-blue-600 mr-2"></i>Salen hoy (hacer aseo)</h3>
          {departures.map(r => <GuestRow key={r.id} r={r} onClick={() => setDetail(r)} />)}
        </div>
      )}

      {detail && <ReservationDetail r={detail} onClose={() => setDetail(null)} onChanged={() => { setDetail(null); load(); }} />}
    </div>
  );
};

// ============ IMPORTADOR (pegar Excel/CSV de Ayenda/Booking) ============
// Convierte una fecha DD/MM/AAAA a AAAA-MM-DD
const parseDate = (s: string): string | null => {
  s = (s || '').trim();
  // ISO: 2026-06-04 (con o sin hora después) — formato Booking
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // dd/mm/aaaa o dd-mm-aaaa — formato Ayenda
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const yr = y.length === 2 ? '20' + y : y;
  return `${yr}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
// Extrae fechas (ISO, dd/mm/aaaa, "9 jun 2026") de un texto OCR → AAAA-MM-DD, en orden
const MESES_ES: Record<string, string> = { ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06', jul: '07', ago: '08', sep: '09', set: '09', oct: '10', nov: '11', dic: '12' };
const extraerFechas = (texto: string): string[] => {
  const t = texto || ''; const out: string[] = [];
  (t.match(/\d{4}-\d{2}-\d{2}/g) || []).forEach(d => out.push(d));
  (t.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g) || []).forEach(d => { const p = parseDate(d); if (p) out.push(p); });
  const re = /(\d{1,2})\s*(?:de\s*)?([A-Za-zÁÉÍÓÚáéíóú]{3,})\.?\s*(?:de\s*)?(\d{4})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) { const mes = MESES_ES[m[2].slice(0, 3).toLowerCase()]; if (mes) out.push(`${m[3]}-${mes}-${m[1].padStart(2, '0')}`); }
  return [...new Set(out)];
};
const parseMoney = (s: string): number | null => {
  let str = (s || '').replace(/[^\d.,]/g, '');
  if (!str) return null;
  // Decimal de 2 dígitos al final (Expedia: 390981.82) → tomar parte entera
  const dec = str.match(/^(.*)[.,](\d{2})$/);
  let intpart = dec ? dec[1] : str;
  intpart = intpart.replace(/[.,]/g, ''); // quitar separadores de miles
  const n = Number(intpart);
  return n || null;
};

// ===== RESERVA RÁPIDA: parsea un mensaje pegado (WhatsApp) → campos de la reserva =====
// Detecta nombre, correo, teléfono, documento, fechas y # de personas aunque vengan
// con etiquetas ("Nombre:", "Entrada:") o en texto libre.
const fechasDeTexto = (str: string): string[] => {
  const out = extraerFechas(str); // ISO, dd/mm/aaaa, "9 jun 2026"
  // Respaldo: "15 de junio" / "15 junio" sin año → asume el año más cercano a futuro
  const now = new Date();
  const re = /(\d{1,2})\s*(?:de\s*)?([A-Za-zÁÉÍÓÚáéíóú]{3,})/g; let m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    const mes = MESES_ES[m[2].slice(0, 3).toLowerCase()]; if (!mes) continue;
    let yr = now.getFullYear(); if (Number(mes) < now.getMonth() + 1) yr += 1;
    const f = `${yr}-${mes}-${m[1].padStart(2, '0')}`;
    if (Number(m[1]) >= 1 && Number(m[1]) <= 31) out.push(f);
  }
  return [...new Set(out)];
};

const parseReservaTexto = (texto: string): { campos: string[]; data: Partial<Reservation>; adults: number | null; children: number | null } => {
  const t = (texto || '').trim();
  const flat = t.replace(/\s+/g, ' ');
  const lines = t.split('\n').map(l => l.trim()).filter(Boolean);
  const data: Partial<Reservation> = {};
  const campos: string[] = [];

  const afterLabel = (labels: string[]): string | null => {
    const group = labels.join('|');
    // 1) línea que empieza con la etiqueta ("Nombre: Juan")
    const reLine = new RegExp(`^\\s*(?:${group})\\s*[:=\\-–]?\\s*(.+)$`, 'i');
    for (const ln of lines) { const m = ln.match(reLine); if (m && m[1] && m[1].trim()) return m[1].trim(); }
    // 2) etiqueta en medio de una frase ("mi nombre es Juan, cc 123") → hasta coma/; o fin de línea
    const reIn = new RegExp(`\\b(?:${group})\\b\\s*[:=\\-–]?\\s*(?:es\\s+|son\\s+|:\\s*)?([^,;\\n]+)`, 'i');
    const m2 = t.match(reIn); if (m2 && m2[1] && m2[1].trim()) return m2[1].trim();
    return null;
  };
  const fechaTrasEtiqueta = (labels: string[]): string | null => {
    const low = t.toLowerCase();
    for (const lb of labels) { const i = low.search(new RegExp(lb, 'i')); if (i >= 0) { const fs = fechasDeTexto(t.slice(i)); if (fs[0]) return fs[0]; } }
    return null;
  };

  // Correo
  const email = (flat.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i) || [])[0];
  if (email) { data.guest_email = email.toLowerCase(); campos.push('correo'); }

  // Documento (con etiqueta para no confundirlo con el teléfono)
  const docLine = afterLabel(['n[uú]mero de documento', 'documento', 'c[eé]dula', 'identificaci[oó]n', 'pasaporte', 'c\\.?\\s?c\\.?', 'doc', 'id']) || '';
  const docNum = (docLine.match(/\d[\d.]{4,}\d/) || [])[0]?.replace(/\./g, '');
  if (docNum) {
    data.doc_number = docNum;
    data.doc_type = /pasaporte|passport/i.test(t) ? 'Pasaporte' : /extranjer/i.test(t) ? 'CE' : 'CC';
    campos.push('documento');
  }

  // Teléfono / WhatsApp
  const norm = (s: string) => s.replace(/[^\d+]/g, '');
  const labelTel = afterLabel(['whatsapp', 'wsp', 'tel[eé]fono', 'celular', 'cel', 'm[oó]vil', 'movil', 'contacto', 'n[uú]mero']) || '';
  const candTel = ([labelTel, ...(flat.match(/\+?\d[\d\s().\-]{6,}\d/g) || [])])
    .map(s => s.trim()).filter(Boolean)
    .filter(s => !/[\/]/.test(s) && !parseDate(s) && norm(s).replace(/\D/g, '') !== docNum);
  const tel = candTel.find(s => /^\+/.test(s) && norm(s).length >= 8)
    || candTel.find(s => { const d = norm(s).replace(/\D/g, ''); return d.length === 10 && d[0] === '3'; })
    || candTel.find(s => { const d = norm(s).replace(/\D/g, ''); return d.length >= 7 && d.length <= 13; });
  if (tel) { data.guest_phone = norm(tel); campos.push('teléfono'); }

  // Nombre
  let nombre = afterLabel(['nombre completo', 'nombre', 'name', 'hu[eé]sped', 'cliente', 'a nombre de', 'reserva a nombre de']);
  if (nombre) nombre = nombre.replace(/[._]+$/, '').trim();
  if (!nombre || nombre.includes('@') || !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(nombre) || nombre.length > 60) {
    nombre = lines.map(l => l.trim()).find(l => /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+){1,3}[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(l)) || '';
  }
  if (nombre) { data.guest_name = nombre; campos.push('nombre'); }

  // Adultos / Niños (por separado). Tomamos el número más cercano a la palabra,
  // así funciona "3 adultos", "Adultos: 4" y "Adultos: 4 Niños: 1" en una línea.
  const countNear = (word: string): number | null => {
    const m = flat.match(new RegExp(`(\\d+)?\\s*(?:${word})\\s*([:=])?\\s*(\\d+)?`, 'i'));
    if (!m) return null;
    const before = m[1] != null ? Number(m[1]) : null;
    const after = m[3] != null ? Number(m[3]) : null;
    if (m[2] && after != null) return after; // "Adultos: 4" → número después de los dos puntos
    return before != null ? before : after;   // "3 adultos" → número antes
  };
  let adults = countNear('adultos?|adults');
  let children = countNear('ni[nñ]os?|menores|kids|infantes?');
  if (adults != null) campos.push('adultos');
  if (children != null) campos.push('niños');

  // Total de personas (adultos + niños, o el número que venga suelto)
  if (adults != null || children != null) {
    data.guests = Math.max(1, (adults || 0) + (children || 0));
    if (!campos.includes('adultos') && !campos.includes('niños')) campos.push('personas');
  } else {
    let gStr = afterLabel(['cantidad de personas', 'n[uú]mero de personas', 'no\\.? de personas', '# personas', 'personas', 'hu[eé]spedes', 'pax', 'people', 'guests']);
    let gn = gStr && (gStr.match(/\d+/) || [])[0];
    if (!gn) { const m = flat.match(/(\d+)\s*(?:personas?|hu[eé]spedes?|pax|people|guests)/i); gn = m && m[1]; }
    if (gn) { data.guests = Math.max(1, Number(gn)); campos.push('personas'); }
  }

  // Fechas (entrada / salida)
  let ci = fechaTrasEtiqueta(['entrada', 'llegada', 'check\\s*-?\\s*in', 'ingreso', 'desde', 'in']);
  let co = fechaTrasEtiqueta(['salida', 'check\\s*-?\\s*out', 'egreso', 'regreso', 'hasta', 'out']);
  if (!ci || !co) { const all = fechasDeTexto(t).sort(); if (!ci) ci = all[0]; if (!co) co = all.find(d => d > (ci || '')) || all[1]; }
  if (ci && co && co <= ci) { const tmp = ci; ci = co > tmp ? co : tmp; } // por si vienen invertidas
  if (ci) { data.check_in = ci; campos.push('entrada'); }
  if (co && co > (ci || '')) { data.check_out = co; campos.push('salida'); }

  return { campos, data, adults, children };
};

// Separa una fila en celdas: por tabs, o CSV con comillas
const splitCells = (line: string): string[] => {
  if (line.includes('\t')) return line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
};

// Mapeo de tipo de apartamento (Expedia) → número de apartamento real
const ROOM_TYPE_MAP: Record<string, string> = { familiar: '404', standard: '303', clasico: '403', basico: '301' };
const resolveRoomFromType = (raw: string, typeMap: Record<string, string>): string => {
  const v = (raw || '').toLowerCase();
  if (/familiar|family/.test(v)) return typeMap.familiar;
  if (/est[aá]ndar|standard/.test(v)) return typeMap.standard;
  if (/cl[aá]sic|classic/.test(v)) return typeMap.clasico;
  if (/b[aá]sic|basic/.test(v)) return typeMap.basico;
  return '';
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
const EXPEDIA_ROUTE = '__expedia__';

// Parser robusto: detecta encabezados (Expedia/Booking/Ayenda) o cae a modo por contenido.
const parseAyenda = (text: string, roomId: string, channel: string = 'auto', typeMap: Record<string, string> = ROOM_TYPE_MAP): ParsedRow[] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  const expediaRoute = roomId === EXPEDIA_ROUTE;
  if (expediaRoute && channel === 'auto') channel = 'expedia'; // enrutar por tipo + color naranja
  const isRandom = roomId === RANDOM_ROOM;
  const pickRoom = (roomRaw: string, seed: string): string => {
    const num = (roomRaw || '').match(/\d{3}/);
    if (num && ROOMS.find(r => r.id === num[0])) return num[0];
    const byType = resolveRoomFromType(roomRaw, typeMap);
    if (byType) return byType;
    if (expediaRoute) return typeMap.basico || '301';
    return isRandom ? ROOMS[hashStr(seed) % ROOMS.length].id : roomId;
  };
  const buildRow = (r: any): ParsedRow => ({ ok: true, raw: '', r });

  // ¿Hay fila de encabezado?
  const head = splitCells(lines[0]);
  const hj = head.join(' ').toLowerCase();
  const hasHeader = /(hu[eé]sped|cliente|reservado)/.test(hj) && /(entrada|desde|check)/.test(hj) && /(salida|hasta|check)/.test(hj);

  if (hasHeader) {
    const find = (preds: RegExp[]) => { for (const re of preds) { const i = head.findIndex(h => re.test(h.toLowerCase())); if (i >= 0) return i; } return -1; };
    const idx = {
      name: find([/nombre del cliente/, /hu[eé]sped/, /^cliente/, /reservado/]),
      checkin: find([/de entrada/, /entrada/, /desde/, /check.?in/]),
      checkout: find([/de salida/, /salida/, /hasta/, /check.?out/]),
      room: find([/habitaci/, /tipo de unidad/, /alojamiento/, /tipo de apart/]),
      price: find([/importe de la reserva/, /precio/, /valor de la reserva/, /valor/]),
      status: find([/^estado$/, /estado del pago/, /estado/]),
      id: find([/id de reserva/, /n[uú]mero de reserva/, /^reserva$/, /n.* de confirmaci/, /confirmaci/]),
      phone: find([/tel[eé]fono/]),
      email: find([/email|correo/]),
    };
    return lines.slice(1).map((raw): ParsedRow => {
      const c = splitCells(raw);
      const get = (i: number) => (i >= 0 && c[i] ? c[i].trim() : '');
      const name = get(idx.name);
      const ci = parseDate(get(idx.checkin));
      const co = parseDate(get(idx.checkout));
      if (!name) return { ok: false, reason: 'sin nombre', raw };
      if (!ci || !co) return { ok: false, reason: 'fechas inválidas', raw };
      const idVal = (get(idx.id).match(/[A-Za-z0-9]+/) || [''])[0];
      const emailRaw = get(idx.email);
      const email = /@/.test(emailRaw) ? emailRaw : (c.find(x => /@/.test(x)) || null);
      const phoneRaw = get(idx.phone);
      const phone = /^\+?\d[\d\s-]{6,}$/.test(phoneRaw) ? phoneRaw : null;
      const roomRaw = get(idx.room);
      const effChannel = channel !== 'auto' ? channel : (c.find(x => /booking|airbnb|expedia|despegar|ayenda/i.test(x)) || '');
      const rid = pickRoom(roomRaw, idVal + name);
      const refNote = idVal ? `Ref ${idVal}${effChannel ? ' · ' + effChannel : ''}` : (effChannel || null);
      return buildRow({
        external_ref: idVal ? 'ext-' + idVal : null,
        room_id: rid, room_name: roomById(rid)?.name || rid,
        guest_name: name, guest_email: email, guest_phone: phone,
        check_in: ci, check_out: co, guests: 1,
        status: mapStatus(get(idx.status)),
        source: mapSource(effChannel),
        total: parseMoney(get(idx.price)),
        note: isRandom ? `${refNote ? refNote + ' · ' : ''}⚠️ habitación temporal` : refNote,
      });
    });
  }

  // --- Sin encabezado: modo por contenido (export de Ayenda sin cabecera) ---
  return lines.map((raw): ParsedRow => {
    const cols = splitCells(raw);
    const idCell = cols[0] || '';
    if (/^(reserva|n[uú]mero de reserva)$/i.test(idCell)) return { ok: false, reason: 'encabezado', raw };
    const name = cols[1] || '';
    const dates = cols.map(parseDate).filter(Boolean) as string[];
    if (!name) return { ok: false, reason: 'sin nombre', raw };
    if (dates.length < 2) return { ok: false, reason: 'fechas inválidas', raw };
    const email = cols.find(c => /@/.test(c)) || null;
    const phone = cols.find((c, i) => i > 0 && c !== idCell && !/@/.test(c) && !parseDate(c) && /^\+?\d[\d\s\-]{6,}$/.test(c)) || null;
    const statusCell = cols.find(c => /^(ok|cancel|pend|confirm)/i.test(c)) || '';
    const detectedChannel = cols.find(c => /booking|airbnb|expedia|despegar|ayenda|whats|web|directo|trivago|hotel/i.test(c)) || '';
    const effChannel = channel !== 'auto' ? channel : detectedChannel;
    const moneyCell = cols.find(c => /(\$|cop)/i.test(c) && (parseMoney(c) || 0) > 0) || '';
    const rid = isRandom ? ROOMS[hashStr(idCell + name) % ROOMS.length].id : roomId;
    const refNote = idCell && /^\d+$/.test(idCell) ? `Ref ${idCell}${effChannel ? ' · ' + effChannel : ''}` : (effChannel || null);
    return buildRow({
      external_ref: idCell && /^\d+$/.test(idCell) ? 'ayenda-' + idCell : null,
      room_id: rid, room_name: roomById(rid)?.name || rid,
      guest_name: name, guest_email: email, guest_phone: phone,
      check_in: dates[0], check_out: dates[1], guests: 1,
      status: mapStatus(statusCell), source: mapSource(effChannel),
      total: parseMoney(moneyCell),
      note: isRandom ? `${refNote ? refNote + ' · ' : ''}⚠️ habitación temporal` : refNote,
    });
  });
};

const ImportPanel: React.FC<{ onDone: () => void; onCancel: () => void; }> = ({ onDone, onCancel }) => {
  const [text, setText] = useState('');
  const [roomId, setRoomId] = useState(RANDOM_ROOM);
  const [channel, setChannel] = useState('auto');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [typeMap, setTypeMap] = useState<Record<string, string>>({ ...ROOM_TYPE_MAP });

  const parsed = text.trim() ? parseAyenda(text, roomId, channel, typeMap) : [];
  const valid = parsed.filter(p => p.ok);
  const toImport = valid.filter(p => includeCancelled || p.r.status !== 'cancelled');
  const skipped = parsed.filter(p => !p.ok && p.reason !== 'encabezado');

  const doImport = async () => {
    if (toImport.length === 0) return;
    setSaving(true); setResult('');
    const rows = toImport.map(p => p.r);
    // upsert por external_ref: no duplica si se vuelve a importar (ni choca con el robot)
    const { error } = await supabase.from('reservations').upsert(rows, { onConflict: 'external_ref' });
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
            <option value={EXPEDIA_ROUTE}>🏨 Expedia (enrutar por tipo)</option>
            {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600 flex flex-col gap-1">Canal
          <select value={channel} onChange={e => setChannel(e.target.value)} className={inp + ' font-normal'}>
            <option value="auto">Auto (detectar del texto)</option>
            <option value="booking">Booking</option>
            <option value="airbnb">Airbnb</option>
            <option value="expedia">Expedia</option>
            <option value="directa">Directa</option>
          </select>
        </label>
        <label className="text-sm font-bold text-gray-600 flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={includeCancelled} onChange={e => setIncludeCancelled(e.target.checked)} className="w-5 h-5 accent-green-600" />
          Incluir reservas canceladas
        </label>
      </div>

      {(channel === 'expedia' || roomId === EXPEDIA_ROUTE) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-orange-800 mb-2"><i className="fa-solid fa-shuffle mr-1"></i>Enrutar tipos de Expedia → apartamento:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([['familiar', 'Familiar'], ['standard', 'Estándar'], ['clasico', 'Clásico'], ['basico', 'Básico']] as const).map(([key, label]) => (
              <label key={key} className="text-[11px] font-bold text-gray-600 flex flex-col gap-1">{label}
                <select value={typeMap[key]} onChange={e => setTypeMap(m => ({ ...m, [key]: e.target.value }))} className="p-2 border border-gray-200 rounded-lg text-xs font-normal">
                  {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

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

// ============ RESERVA RÁPIDA (pegar mensaje → revisar → crear con PDF/WhatsApp) ============
const QuickReservation: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState<'paste' | 'review' | 'done'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parseMsg, setParseMsg] = useState('');
  const [apts, setApts] = useState<Apartment[]>([]);
  // Campos extraídos / editables
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ci, setCi] = useState('');
  const [co, setCo] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [docType, setDocType] = useState('');
  const [docNum, setDocNum] = useState('');
  const [aptId, setAptId] = useState('202');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<ReservationStatus>('confirmed');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<Reservation | null>(null);

  // Lista de apartamentos: de Supabase (con foto/precio) o, si falta, de ROOMS.
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('apartments').select('*').order('sort');
      if (!error && data && data.length) { setApts(data as Apartment[]); return; }
      setApts(ROOMS.map(r => ({
        id: r.id, name: r.name, category: 'Aparta Suite', guests: r.guests, bed: r.bed || '—',
        price: r.price || '—', image: '', gallery: [], amenities: [], book_url: '', penthouse: !!(r as any).penthouse, active: true, sort: 0,
      })));
    })();
  }, []);

  const apt = apts.find(a => a.id === aptId);
  // Al elegir apartamento, traer su tarifa
  useEffect(() => { if (apt && step === 'review') setPrice(apt.price && apt.price !== '—' ? apt.price : ''); }, [aptId, apts.length, step]);

  const analizar = () => {
    if (!pasteText.trim()) { setParseMsg('Pega primero el mensaje del cliente.'); return; }
    const { campos, data, adults: a, children: c } = parseReservaTexto(pasteText);
    if (!campos.length) { setParseMsg('No reconocí datos. Revisa el texto o llena los campos a mano en el siguiente paso.'); }
    setName(data.guest_name || ''); setPhone(data.guest_phone || ''); setEmail(data.guest_email || '');
    setCi(data.check_in || ''); setCo(data.check_out || '');
    setDocType(data.doc_type || ''); setDocNum(data.doc_number || '');
    setAdults(a != null ? a : (data.guests || 2));
    setChildren(c != null ? c : 0);
    setStep('review');
  };

  const nights = ci && co && co > ci ? nightsBetween(ci, co).length : 0;
  const ppn = parseMoney(price) || 0;
  const total = nights * ppn;
  const guests = Math.max(1, (adults || 0) + (children || 0));
  const notaPersonas = `${adults || 0} adulto(s)${children ? `, ${children} niño(s)` : ''}`;

  const crear = async () => {
    if (!name.trim()) { setErr('Escribe el nombre del cliente.'); return; }
    if (!ci || !co || co <= ci) { setErr('Las fechas no son válidas (la salida debe ser después de la entrada).'); return; }
    if (!aptId) { setErr('Elige el apartamento.'); return; }
    setSaving(true); setErr('');
    const payload: any = {
      room_id: aptId, room_name: apt?.name || roomById(aptId)?.name || null,
      guest_name: name.trim(), guest_phone: phone || null, guest_email: email || null,
      check_in: ci, check_out: co, guests,
      status, source: 'whatsapp', total: total || null, note: notaPersonas,
      doc_type: docType || null, doc_number: docNum || null,
    };
    const { data: ins, error } = await supabase.from('reservations').insert(payload).select().single();
    setSaving(false);
    if (error) { setErr(isMissingTable(error) ? MISSING_TABLE_MSG : error.message); return; }
    setCreated(ins as Reservation);
    setStep('done');
    onCreated();
  };

  const descargarPDF = () => {
    if (!apt) return;
    generarCotizacionPDF({ apt, guest: name, ci, co, nights, guests, ppn, subtotal: total, disc: 0, total, note: notaPersonas });
  };
  const enviarWA = () => { if (created) { const l = waLink(created.guest_phone || CONFIRM_PHONE, confirmacionWA(created)); if (l) window.open(l, '_blank'); } };

  const inp = 'w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none font-normal';

  // ---- PASO 3: creada ----
  if (step === 'done' && created) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4"><i className="fa-solid fa-check"></i></div>
          <h2 className="text-xl font-black text-gray-800">¡Reserva creada!</h2>
          <p className="text-gray-500 font-bold text-sm mt-1 mb-5">Ya quedó guardada y aparece en el calendario.</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm mb-5">
            <p><b>{created.guest_name}</b> · {apt?.name}</p>
            <p className="text-gray-500">{fullDate(created.check_in)} → {fullDate(created.check_out)} · {notaPersonas}</p>
            {total > 0 && <p className="text-green-700 font-black mt-1">{fmtCOP(total)} <span className="text-gray-400 font-bold text-xs">({nights} noche{nights === 1 ? '' : 's'})</span></p>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={descargarPDF} className="h-11 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold"><i className="fa-solid fa-file-pdf mr-2"></i>Descargar PDF</button>
            <button onClick={enviarWA} className="h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"><i className="fa-brands fa-whatsapp mr-2"></i>Enviar por WhatsApp</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setStep('paste'); setPasteText(''); setParseMsg(''); setCreated(null); setName(''); setPhone(''); setEmail(''); setCi(''); setCo(''); setDocNum(''); setDocType(''); setAdults(2); setChildren(0); }} className="flex-1 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">+ Otra reserva rápida</button>
            <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- PASO 1: pegar ----
  if (step === 'paste') {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-700 mb-3"><i className="fa-solid fa-arrow-left mr-1.5"></i>Volver a reservas</button>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-black text-gray-800 mb-1"><i className="fa-solid fa-bolt text-blue-600 mr-2"></i>Reserva rápida</h2>
          <p className="text-sm text-gray-500 font-bold mb-4">Pega el mensaje que te mandaron por WhatsApp y yo extraigo los datos.</p>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={8} autoFocus
            placeholder={'Nombre: María Gómez\nCelular: 3001234567\nCorreo: maria@gmail.com\nEntrada: 21/06/2026\nSalida: 26/06/2026\n5 adultos y 5 niños'}
            className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-y" />
          {parseMsg && <p className="text-xs text-amber-600 font-bold mt-2">{parseMsg}</p>}
          <button onClick={analizar} className="w-full mt-4 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base">
            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Analizar mensaje
          </button>
        </div>
      </div>
    );
  }

  // ---- PASO 2: revisar ----
  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => setStep('paste')} className="text-sm font-bold text-gray-500 hover:text-gray-700 mb-3"><i className="fa-solid fa-arrow-left mr-1.5"></i>Volver a pegar</button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-black text-gray-800 mb-1">Revisa y elige el apartamento</h2>
        <p className="text-sm text-gray-500 font-bold mb-4">Corrige lo que haga falta. El total se calcula con la tarifa del apartamento.</p>
        {err && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg p-3">{err}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-bold text-gray-600 sm:col-span-2">Cliente
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Celular / WhatsApp
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="3001234567" className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Correo
            <input value={email} onChange={e => setEmail(e.target.value)} className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Entrada
            <input type="date" value={ci} onChange={e => { setCi(e.target.value); if (e.target.value >= co) setCo(addDaysStr(e.target.value, 1)); }} className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Salida
            <input type="date" value={co} min={ci ? addDaysStr(ci, 1) : undefined} onChange={e => setCo(e.target.value)} className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Adultos
            <input type="number" min={1} value={adults} onChange={e => setAdults(Math.max(1, Number(e.target.value) || 1))} className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Niños
            <input type="number" min={0} value={children} onChange={e => setChildren(Math.max(0, Number(e.target.value) || 0))} className={inp + ' mt-1'} />
          </label>
          <label className="text-sm font-bold text-gray-600">Tipo de documento
            <select value={docType} onChange={e => setDocType(e.target.value)} className={inp + ' mt-1'}>
              <option value="">—</option><option value="CC">CC</option><option value="CE">CE</option><option value="Pasaporte">Pasaporte</option><option value="TI">TI</option>
            </select>
          </label>
          <label className="text-sm font-bold text-gray-600">N° de documento
            <input value={docNum} onChange={e => setDocNum(e.target.value)} className={inp + ' mt-1'} />
          </label>
        </div>

        {/* Apartamento + tarifa */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-black text-blue-800">Apartamento
              <select value={aptId} onChange={e => setAptId(e.target.value)} className={inp + ' mt-1'}>
                {apts.map(a => <option key={a.id} value={a.id}>{a.name}{a.price && a.price !== '—' ? ` · $${a.price}` : ''}</option>)}
              </select>
            </label>
            <label className="text-sm font-black text-blue-800">Tarifa / noche (COP)
              <input value={price} onChange={e => setPrice(e.target.value)} placeholder="150.000" className={inp + ' mt-1'} />
            </label>
          </div>
          <div className="flex justify-between items-center mt-3 text-sm">
            <span className="font-bold text-gray-600">{nights} noche{nights === 1 ? '' : 's'} · {guests} huésped(es)</span>
            <span className="font-black text-green-700 text-lg">{total > 0 ? fmtCOP(total) : '—'}</span>
          </div>
        </div>

        <label className="text-sm font-bold text-gray-600 block mt-4">Estado
          <select value={status} onChange={e => setStatus(e.target.value as ReservationStatus)} className={inp + ' mt-1 sm:w-1/2'}>
            <option value="confirmed">Confirmada</option><option value="pending">Pendiente</option>
          </select>
        </label>

        <button onClick={crear} disabled={saving} className="w-full mt-5 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-base disabled:opacity-50">
          <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-circle-check'} mr-2`}></i>{saving ? 'Creando…' : 'Crear reserva'}
        </button>
      </div>
    </div>
  );
};

const ReservationsManager: React.FC = () => {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all');
  const [editing, setEditing] = useState<Partial<Reservation> | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [live, setLive] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });
    if (error && isMissingTable(error)) { setMissing(true); setItems([]); }
    else { setMissing(false); setItems(((data as Reservation[]) || []).filter(r => !isBlock(r))); }
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

  if (quickOpen) return <QuickReservation onClose={() => setQuickOpen(false)} onCreated={() => load()} />;
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
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => generarHistorial(items)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm">
            <i className="fa-solid fa-file-arrow-down mr-2"></i>Historial
          </button>
          <button onClick={() => setImporting(true)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 text-sm">
            <i className="fa-solid fa-file-import mr-2"></i>Importar
          </button>
          <button onClick={() => setQuickOpen(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm">
            <i className="fa-solid fa-bolt mr-2"></i>Reserva rápida
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
                    <a href={waLink(r.guest_phone, confirmacionWA(r))} target="_blank" rel="noopener noreferrer" title="Enviar confirmación por WhatsApp"
                      className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-bold"><i className="fa-brands fa-whatsapp"></i></a>
                  )}
                  {(r.source === 'manual' || r.source === 'web') && r.status !== 'confirmed' && (
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
// Detecta el canal de la reserva (Booking / Airbnb / Expedia) por origen, nota o correo
const channelOf = (r: Reservation): string => {
  const s = ((r.source || '') + ' ' + (r.note || '') + ' ' + (r.guest_email || '')).toLowerCase();
  if (/airbnb/.test(s)) return 'airbnb';
  if (/expedia/.test(s)) return 'expedia';
  if (/booking/.test(s)) return 'booking';
  return '';
};

// Color de la barra: por canal (Booking azul, Airbnb dorado, Expedia naranja) y si no, por estado
// ============ APARTAMENTOS (fotos + precios editables) ============
const APT_CATS = ['Aparta Suite', 'Estudio', 'Penthouse', 'Casa', 'Finca'];

const ApartmentsSetupBanner: React.FC = () => (
  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 mb-6 text-sm">
    <p className="font-black mb-1"><i className="fa-solid fa-database mr-2"></i>Falta activar los apartamentos editables</p>
    <p>Abre <b>Supabase → SQL Editor → New query</b>, pega el contenido de <code className="bg-amber-100 px-1 rounded">supabase/migrations/0002_apartments.sql</code> y dale <b>Run</b>. Después recarga esta página.</p>
  </div>
);

const ApartmentsManager: React.FC = () => {
  const [items, setItems] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState<Apartment | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('apartments').select('*').order('sort');
    if (error && isMissingTable(error)) { setMissing(true); setItems([]); }
    else { setMissing(false); setItems((data as Apartment[]) || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (missing) return <ApartmentsSetupBanner />;
  if (editing) return <ApartmentEditor apt={editing} isNew={!items.some(i => i.id === editing.id)} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;

  const blankApt = (): Apartment => ({
    id: '', name: '', category: 'Aparta Suite', guests: 2, bed: '—', price: '—',
    image: '', gallery: [], amenities: ['Cocina', 'Baño privado', 'Wifi'], book_url: '', penthouse: false, active: true,
    sort: (items.reduce((m, i) => Math.max(m, i.sort), 0) + 10),
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-lg font-black text-gray-800"><i className="fa-solid fa-building text-green-600 mr-2"></i>Apartamentos</h2>
          <p className="text-xs text-gray-500 font-bold">Edita fotos y precios. Los cambios se reflejan solos en la página pública (alojamientos.html).</p>
        </div>
        <button onClick={() => setEditing(blankApt())} className="px-4 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm">
          <i className="fa-solid fa-plus mr-1.5"></i>Nuevo apartamento
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-300"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(a => (
            <button key={a.id} onClick={() => setEditing(a)}
              className={`text-left bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition ${a.active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              <div className="relative h-32 bg-gray-100">
                {a.image
                  ? <img src={a.image} alt={a.name} loading="lazy" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fa-solid fa-image text-3xl"></i></div>}
                {a.penthouse && <span className="absolute top-2 left-2 bg-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full"><i className="fa-solid fa-crown mr-1"></i>PH</span>}
                {!a.active && <span className="absolute top-2 right-2 bg-gray-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">OCULTO</span>}
              </div>
              <div className="p-3">
                <p className="font-black text-gray-800 text-sm truncate">{a.name}</p>
                <p className="text-xs text-gray-500 font-bold">{a.guests} huéspedes · {a.bed}</p>
                <p className="text-green-700 font-black text-sm mt-1">{a.price === '—' ? <span className="text-gray-400">Sin precio</span> : <>${a.price}<span className="text-xs text-gray-400 font-bold"> /noche</span></>}</p>
                <p className="text-[11px] text-green-600 font-bold mt-1"><i className="fa-solid fa-pen mr-1"></i>Editar</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ApartmentEditor: React.FC<{ apt: Apartment; isNew: boolean; onSaved: () => void; onCancel: () => void }> = ({ apt, isNew, onSaved, onCancel }) => {
  const [f, setF] = useState<Apartment>({ ...apt });
  const [busy, setBusy] = useState(false);
  const [upMain, setUpMain] = useState(false);
  const [upGal, setUpGal] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof Apartment, v: any) => setF(p => ({ ...p, [k]: v }));

  const uploadTo = async (file: File): Promise<string | null> => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${(f.id || 'apt')}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('apartamentos').upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setErr('No se pudo subir la foto. ¿Corriste el SQL 0002 (crea el bucket)?'); return null; }
    return supabase.storage.from('apartamentos').getPublicUrl(path).data.publicUrl;
  };

  const onPickMain = async (file?: File) => { if (!file) return; setUpMain(true); setErr(''); const url = await uploadTo(file); if (url) set('image', url); setUpMain(false); };
  const onPickGallery = async (file?: File) => { if (!file) return; setUpGal(true); setErr(''); const url = await uploadTo(file); if (url) set('gallery', [...(f.gallery || []), url]); setUpGal(false); };

  const save = async () => {
    setErr('');
    if (!f.name.trim()) { setErr('Ponle un nombre al apartamento.'); return; }
    if (isNew && !f.id.trim()) { setErr('Ponle un ID (ej: 305, casita). Es el mismo que usan las reservas.'); return; }
    setBusy(true);
    const payload = {
      id: f.id.trim(), name: f.name.trim(), category: f.category, guests: Number(f.guests) || 1,
      bed: f.bed || '—', price: (f.price || '—').trim(), image: f.image || '', gallery: f.gallery || [],
      amenities: f.amenities || [], book_url: f.book_url || '', penthouse: !!f.penthouse, active: !!f.active, sort: Number(f.sort) || 0,
    };
    const { error } = await supabase.from('apartments').upsert(payload, { onConflict: 'id' });
    setBusy(false);
    if (error) { setErr('No se pudo guardar: ' + error.message); return; }
    onSaved();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onCancel} className="text-sm font-bold text-gray-500 hover:text-gray-700 mb-3"><i className="fa-solid fa-arrow-left mr-1.5"></i>Volver</button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-gray-800 mb-4">{isNew ? 'Nuevo apartamento' : `Editar ${apt.name}`}</h2>
        {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-bold">{err}</div>}

        {/* Foto principal */}
        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Foto principal</label>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-40 h-28 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {f.image ? <img src={f.image} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-image text-3xl text-gray-300"></i>}
          </div>
          <div className="flex-1 space-y-2">
            <label className={`inline-flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-bold cursor-pointer ${upMain ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
              <i className={`fa-solid ${upMain ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>{upMain ? 'Subiendo…' : 'Subir foto'}
              <input type="file" accept="image/*" className="hidden" disabled={upMain} onChange={e => onPickMain(e.target.files?.[0])} />
            </label>
            <input value={f.image} onChange={e => set('image', e.target.value)} placeholder="…o pega el link de la foto (URL)"
              className="w-full p-2 border border-gray-200 rounded-lg text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Nombre
            <input value={f.name} onChange={e => set('name', e.target.value)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal normal-case text-gray-800" />
          </label>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide">ID {isNew ? '(ej: 305, casita)' : ''}
            <input value={f.id} disabled={!isNew} onChange={e => set('id', e.target.value)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800 disabled:bg-gray-50 disabled:text-gray-400" />
          </label>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Precio / noche (COP)
            <input value={f.price} onChange={e => set('price', e.target.value)} placeholder="150.000" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800" />
          </label>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Categoría
            <select value={f.category} onChange={e => set('category', e.target.value)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800">
              {APT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Huéspedes
            <input type="number" min={1} value={f.guests} onChange={e => set('guests', e.target.value)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800" />
          </label>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Cama
            <input value={f.bed} onChange={e => set('bed', e.target.value)} placeholder="Cama 1.40" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800" />
          </label>
        </div>

        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">Comodidades (separadas por coma)
          <input value={(f.amenities || []).join(', ')} onChange={e => set('amenities', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Cocina, Baño privado, Smart TV, Wifi" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800" />
        </label>

        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1 mt-4">Link de reserva online (Ayenda)
          <input value={f.book_url} onChange={e => set('book_url', e.target.value)} placeholder="https://engine.ayenda.co/…" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-xs font-normal text-gray-800" />
        </label>

        {/* Galería */}
        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5 mt-4">Fotos adicionales (galería para el cotizador)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(f.gallery || []).map((g, i) => (
            <div key={i} className="relative w-20 h-16 rounded-lg overflow-hidden bg-gray-100 group">
              <img src={g} alt="" className="w-full h-full object-cover" />
              <button onClick={() => set('gallery', f.gallery.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
            </div>
          ))}
          <label className={`w-20 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer ${upGal ? 'border-gray-200 text-gray-300' : 'border-green-300 text-green-500 hover:bg-green-50'}`}>
            <i className={`fa-solid ${upGal ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
            <input type="file" accept="image/*" className="hidden" disabled={upGal} onChange={e => onPickGallery(e.target.files?.[0])} />
          </label>
        </div>

        <div className="flex items-center gap-5 mt-4 mb-5">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-green-600" />Mostrar en la web
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.penthouse} onChange={e => set('penthouse', e.target.checked)} className="w-4 h-4 accent-green-600" />Penthouse
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">Orden
            <input type="number" value={f.sort} onChange={e => set('sort', e.target.value)} className="w-20 p-1.5 border border-gray-200 rounded-lg text-sm font-normal" />
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black disabled:opacity-50">
            <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-floppy-disk'} mr-2`}></i>{busy ? 'Guardando…' : 'Guardar'}
          </button>
          <button onClick={onCancel} className="px-5 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ============ COTIZADOR (PDF con foto del apartamento) ============
const fmtCOP = (n: number) => '$' + new Intl.NumberFormat('es-CO').format(Math.round(n || 0));

interface QuoteData { apt: Apartment; guest: string; ci: string; co: string; nights: number; guests: number; ppn: number; subtotal: number; disc: number; total: number; note: string; }

const generarCotizacionPDF = (q: QuoteData) => {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) { alert('Permite las ventanas emergentes para generar el PDF.'); return; }
  const folio = Date.now().toString().slice(-6);
  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const amen = (q.apt.amenities || []).map(a => `<span style="display:inline-block;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:bold;padding:4px 9px;border-radius:20px;margin:0 4px 4px 0">${a}</span>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Cotización ${q.apt.name}</title>
  <style>
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
    body{margin:0;color:#1e293b;background:#fff}
    .wrap{max-width:720px;margin:0 auto;padding:32px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #16a34a;padding-bottom:16px;margin-bottom:24px}
    .head h1{margin:0;font-size:22px;color:#15803d}
    .head p{margin:2px 0;font-size:13px;color:#64748b}
    .badge{display:inline-block;background:#dcfce7;color:#15803d;font-weight:bold;font-size:12px;padding:5px 12px;border-radius:20px}
    .hero{position:relative;border-radius:14px;overflow:hidden;margin-bottom:8px;background:#f1f5f9;height:280px}
    .hero img{width:100%;height:100%;object-fit:cover}
    .hero .name{position:absolute;left:0;bottom:0;right:0;padding:18px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff}
    .hero .name h2{margin:0;font-size:22px;border:none;padding:0;color:#fff}
    .hero .name p{margin:3px 0 0;font-size:13px;opacity:.92}
    h2{font-size:15px;color:#0f172a;border-left:4px solid #16a34a;padding-left:8px;margin:24px 0 12px}
    table{width:100%;border-collapse:collapse;font-size:14px}
    td{padding:9px 4px;border-bottom:1px solid #f1f5f9}
    td.l{color:#64748b;font-weight:bold;width:50%}
    td.r{text-align:right}
    .total{background:#f0fdf4;border-radius:10px;padding:16px 18px;margin-top:14px;display:flex;justify-content:space-between;align-items:center}
    .total .v{font-size:26px;font-weight:bold;color:#15803d}
    .foot{margin-top:28px;font-size:12px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px}
    @media print{.no-print{display:none}}
    .btn{background:#16a34a;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px}
  </style></head><body><div class="wrap">
    <div class="no-print" style="text-align:right;margin-bottom:12px"><button class="btn" onclick="window.print()">⬇️ Descargar / Imprimir PDF</button></div>
    <div class="head">
      <div><h1>🏨 ${HOTEL.name}</h1><p>${HOTEL.address}</p><p>Tel: ${HOTEL.phone}</p></div>
      <div style="text-align:right"><div class="badge">COTIZACIÓN</div><p style="margin-top:8px">N.º ${folio}</p><p>${hoy}</p></div>
    </div>
    ${q.guest ? `<p style="font-size:14px">Estimado/a <b>${q.guest}</b>, le compartimos su cotización:</p>` : ''}
    <div class="hero">
      ${q.apt.image ? `<img src="${q.apt.image}" alt="${q.apt.name}">` : ''}
      <div class="name"><h2>${q.apt.name}</h2><p>👥 Hasta ${q.apt.guests} huéspedes · 🛏️ ${q.apt.bed}</p></div>
    </div>
    <div style="margin:12px 0">${amen}</div>
    <h2>Detalle de la estadía</h2>
    <table>
      <tr><td class="l">Entrada (check-in)</td><td class="r">${fullDate(q.ci)} · 3:00 PM</td></tr>
      <tr><td class="l">Salida (check-out)</td><td class="r">${fullDate(q.co)} · 11:00 AM</td></tr>
      <tr><td class="l">Noches</td><td class="r">${q.nights} noche${q.nights === 1 ? '' : 's'}</td></tr>
      <tr><td class="l">Huéspedes</td><td class="r">${q.guests}</td></tr>
      <tr><td class="l">Tarifa por noche</td><td class="r">${fmtCOP(q.ppn)}</td></tr>
      <tr><td class="l">Subtotal (${q.nights} × ${fmtCOP(q.ppn)})</td><td class="r">${fmtCOP(q.subtotal)}</td></tr>
      ${q.disc > 0 ? `<tr><td class="l">Descuento</td><td class="r" style="color:#dc2626">– ${fmtCOP(q.disc)}</td></tr>` : ''}
    </table>
    <div class="total"><span style="font-weight:bold;font-size:15px">TOTAL</span><span class="v">${fmtCOP(q.total)}</span></div>
    ${q.note ? `<h2>Notas</h2><p style="font-size:13px;color:#475569;white-space:pre-wrap">${q.note}</p>` : ''}
    <div class="foot">
      <p><b>Cotización válida por 3 días.</b> Sujeta a disponibilidad al momento de confirmar.</p>
      <p>Reserva directa: betotours.com/alojamientos.html · WhatsApp ${HOTEL.phone}</p>
      <p>¡Gracias por elegir ${HOTEL.name} by Beto Tours! 🌿</p>
    </div>
  </div></body></html>`;
  w.document.write(html); w.document.close();
};

const Cotizador: React.FC = () => {
  const [apts, setApts] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [aptId, setAptId] = useState('');
  const [guest, setGuest] = useState('');
  const [phone, setPhone] = useState('');
  const [ci, setCi] = useState(todayStr());
  const [co, setCo] = useState(addDaysStr(todayStr(), 1));
  const [guests, setGuests] = useState(2);
  const [priceStr, setPriceStr] = useState('');
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('apartments').select('*').order('sort');
      if (error && isMissingTable(error)) { setMissing(true); }
      else { setMissing(false); const list = (data as Apartment[]) || []; setApts(list); if (list[0]) setAptId(list[0].id); }
      setLoading(false);
    })();
  }, []);

  const apt = apts.find(a => a.id === aptId);
  // Al cambiar de apartamento, autollenar la tarifa con su precio
  useEffect(() => { if (apt) { setPriceStr(apt.price && apt.price !== '—' ? apt.price : ''); setGuests(apt.guests || 2); } }, [aptId]);

  if (missing) return <ApartmentsSetupBanner />;
  if (loading) return <div className="text-center py-12 text-gray-300"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;
  if (!apts.length) return <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 text-sm">No hay apartamentos. Ve a la pestaña <b>Apartamentos</b> y agrega al menos uno.</div>;

  const nights = Math.max(0, daysDiff(ci, co));
  const ppn = parseMoney(priceStr) || 0;
  const subtotal = nights * ppn;
  const disc = parseMoney(discount) || 0;
  const total = Math.max(0, subtotal - disc);
  const ready = !!apt && nights > 0 && ppn > 0;

  const quote = (): QuoteData => ({ apt: apt!, guest: guest.trim(), ci, co, nights, guests, ppn, subtotal, disc, total, note: note.trim() });

  const mensajeWA = () => {
    const q = quote();
    const lineas = [
      `¡Hola${q.guest ? ' ' + q.guest.split(' ')[0] : ''}! 😊`,
      ``,
      `Cotización *${HOTEL.name}* by Beto Tours`,
      ``,
      `🏠 *${q.apt.name}*`,
      `👥 Hasta ${q.apt.guests} huéspedes · 🛏️ ${q.apt.bed}`,
      `📅 ${fullDate(q.ci)} → ${fullDate(q.co)} (${q.nights} noche${q.nights === 1 ? '' : 's'})`,
      ``,
      `💵 ${fmtCOP(q.ppn)} x ${q.nights} = ${fmtCOP(q.subtotal)}`,
      ...(q.disc > 0 ? [`🎁 Descuento: – ${fmtCOP(q.disc)}`] : []),
      `*TOTAL: ${fmtCOP(q.total)}*`,
      ...(q.apt.image ? [``, `📸 ${q.apt.image}`] : []),
      ...(q.note ? [``, q.note] : []),
      ``,
      `🏨 Reserva directa: betotours.com/alojamientos.html`,
      `_Cotización válida por 3 días, sujeta a disponibilidad._`,
    ];
    return lineas.join('\n');
  };

  const enviarWA = () => {
    const link = waLink(phone || CONFIRM_PHONE, mensajeWA());
    if (link) window.open(link, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-black text-gray-800"><i className="fa-solid fa-file-invoice-dollar text-green-600 mr-2"></i>Cotizador</h2>
        <p className="text-xs text-gray-500 font-bold">Arma una cotización con la foto del apartamento y genérala en PDF o envíala por WhatsApp.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Apartamento
            <select value={aptId} onChange={e => setAptId(e.target.value)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal text-gray-800">
              {apts.map(a => <option key={a.id} value={a.id}>{a.name}{a.price !== '—' ? ` · $${a.price}` : ''}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Cliente (opcional)
              <input value={guest} onChange={e => setGuest(e.target.value)} placeholder="Nombre" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">WhatsApp
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="3001234567" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Entrada
              <input type="date" value={ci} onChange={e => { setCi(e.target.value); if (e.target.value >= co) setCo(addDaysStr(e.target.value, 1)); }} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Salida
              <input type="date" value={co} min={addDaysStr(ci, 1)} onChange={e => setCo(e.target.value)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Huéspedes
              <input type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value) || 1)} className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Tarifa/noche
              <input value={priceStr} onChange={e => setPriceStr(e.target.value)} placeholder="150.000" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Descuento
              <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
            </label>
          </div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">Notas (opcional)
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Incluye parqueadero, late check-out, etc." className="mt-1 w-full p-2.5 border border-gray-200 rounded-lg text-sm font-normal" />
          </label>
        </div>

        {/* Vista previa */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative h-40 bg-gray-100">
              {apt?.image ? <img src={apt.image} alt={apt.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fa-solid fa-image text-3xl"></i></div>}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                <p className="font-black">{apt?.name}</p>
                <p className="text-xs opacity-90">👥 {apt?.guests} · 🛏️ {apt?.bed}</p>
              </div>
            </div>
            <div className="p-4 text-sm">
              <div className="flex justify-between py-1"><span className="text-gray-500 font-bold">{fmtCOP(ppn)} × {nights} noche{nights === 1 ? '' : 's'}</span><span className="font-bold">{fmtCOP(subtotal)}</span></div>
              {disc > 0 && <div className="flex justify-between py-1"><span className="text-gray-500 font-bold">Descuento</span><span className="font-bold text-red-500">– {fmtCOP(disc)}</span></div>}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100"><span className="font-black text-gray-700">TOTAL</span><span className="text-2xl font-black text-green-700">{fmtCOP(total)}</span></div>
              {!ready && <p className="text-xs text-amber-600 font-bold mt-2"><i className="fa-solid fa-circle-info mr-1"></i>Elige fechas válidas y una tarifa para generar la cotización.</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button disabled={!ready} onClick={() => generarCotizacionPDF(quote())} className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold disabled:opacity-40">
              <i className="fa-solid fa-file-pdf mr-2"></i>Generar PDF
            </button>
            <button disabled={!ready} onClick={enviarWA} className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-40">
              <i className="fa-brands fa-whatsapp mr-2"></i>Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const barColor = (r: Reservation): { cls: string; label: string } => {
  if (isBlock(r)) return { cls: 'bg-gray-400 text-white', label: 'Bloqueado' };
  const ch = channelOf(r);
  if (ch === 'booking') return { cls: 'bg-blue-600 text-white shadow-sm', label: 'Booking' };
  if (ch === 'airbnb')  return { cls: 'bg-yellow-400 text-gray-900 shadow-sm', label: 'Airbnb' };
  if (ch === 'expedia') return { cls: 'bg-orange-500 text-white shadow-sm', label: 'Expedia' };
  if (r.status === 'pending') return { cls: 'bg-amber-500 text-white shadow-sm', label: 'Pendiente' };
  if (r.status === 'confirmed') return { cls: 'bg-emerald-600 text-white shadow-sm', label: 'Reservado' };
  return { cls: 'bg-gray-300 text-gray-700', label: '' };
};

const TimelineBoard: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [start, setStart] = useState(todayStr());
  const [days, setDays] = useState(30);
  const [editing, setEditing] = useState<Partial<Reservation> | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);
  // Arrastre para alargar reservas manuales
  const [drag, setDrag] = useState<{ id: string; roomId: string; overDay: string } | null>(null);
  const draggedRef = useRef(false);
  // Buscador de disponibilidad por fecha
  const [findIn, setFindIn] = useState('');
  const [findOut, setFindOut] = useState('');

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

  // Al soltar, guarda la nueva fecha de salida (alargar/acortar reserva manual)
  const commitDrag = async () => {
    const d = drag;
    setDrag(null);
    if (!d) return;
    const res = reservations.find(x => x.id === d.id);
    if (!res || d.overDay < res.check_in) return;
    const newCheckout = addDaysStr(d.overDay, 1); // overDay = última noche
    if (newCheckout === res.check_out) return;
    await supabase.from('reservations').update({ check_out: newCheckout }).eq('id', res.id);
    load();
  };

  const dragRes = drag ? reservations.find(x => x.id === drag.id) : null;

  // Arrastre con Pointer Events: funciona igual con mouse, dedo (celular/tablet) o lápiz.
  // Usamos elementFromPoint para saber sobre qué día está el puntero, porque en táctil
  // los eventos onMouseEnter no se disparan al arrastrar el dedo.
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const cell = el?.closest('[data-day]') as HTMLElement | null;
      if (!cell || cell.dataset.room !== drag.roomId) return;
      const ds = cell.dataset.day!;
      const ci = dragRes?.check_in || ds;
      if (ds >= ci && ds !== drag.overDay) {
        draggedRef.current = true;
        setDrag(d => (d ? { ...d, overDay: ds } : d));
      }
    };
    const up = () => commitDrag();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, dragRes]);

  if (editing) return <ReservationForm initial={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;

  // Lista de días de la ventana
  const dayList = Array.from({ length: days }, (_, i) => addDaysStr(start, i));

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
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => shift(-days)} title="Atrás" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><i className="fa-solid fa-chevron-left"></i></button>
          <button onClick={() => setStart(todayStr())} className="px-3 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold">Hoy</button>
          <button onClick={() => shift(days)} title="Adelante" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><i className="fa-solid fa-chevron-right"></i></button>

          {/* Saltar a un mes/año */}
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 ml-1">
            <i className="fa-solid fa-calendar-days text-green-600"></i>Mes:
            <input type="month" value={start.slice(0, 7)}
              onChange={e => { if (e.target.value) { setStart(e.target.value + '-01'); setDays(30); } }}
              className="h-9 px-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </label>

          {/* Saltar a un día exacto */}
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <i className="fa-solid fa-calendar-day text-green-600"></i>Día:
            <input type="date" value={start}
              onChange={e => { if (e.target.value) setStart(e.target.value); }}
              className="h-9 px-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none" />
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold">Ver:</span>
          {[7, 14, 30].map(n => (
            <button key={n} onClick={() => setDays(n)} className={`px-2.5 py-1 rounded-lg font-bold ${days === n ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{n}d</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 font-bold mb-3 capitalize">
        {new Date(start + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} → {new Date(addDaysStr(start, days - 1) + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-3 text-xs flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-blue-600"></span>Booking</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-yellow-400"></span>Airbnb</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-orange-500"></span>Expedia</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>Directa</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-400"></span>Pendiente</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-400"></span>Bloqueado</span>
      </div>

      {/* Buscador de disponibilidad por fecha */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-black text-green-800"><i className="fa-solid fa-magnifying-glass mr-1"></i>¿Qué hay libre?</span>
          <label className="text-xs font-bold text-gray-600">Entrada
            <input type="date" value={findIn} onChange={e => setFindIn(e.target.value)} className="ml-1 p-1.5 border border-gray-200 rounded-lg text-xs font-normal" />
          </label>
          <label className="text-xs font-bold text-gray-600">Salida
            <input type="date" value={findOut} onChange={e => setFindOut(e.target.value)} className="ml-1 p-1.5 border border-gray-200 rounded-lg text-xs font-normal" />
          </label>
          {(findIn || findOut) && <button onClick={() => { setFindIn(''); setFindOut(''); }} className="text-xs font-bold text-gray-400 hover:text-gray-600">Limpiar</button>}
        </div>
        {findIn && findOut && findOut > findIn && (() => {
          const libres = freeRoomsInRange(reservations, findIn, findOut);
          return (
            <div className="mt-2 text-sm">
              <p className="font-bold text-gray-700 mb-1">{libres.length} libre(s) del {fmtDate(findIn)} al {fmtDate(findOut)}:</p>
              {libres.length === 0 ? <p className="text-red-500 text-xs font-bold">No hay apartamentos libres en esas fechas.</p> : (
                <div className="flex flex-wrap gap-1.5">
                  {libres.map(r => (
                    <button key={r.id} onClick={() => setEditing(blankReservation({ room_id: r.id, check_in: findIn, check_out: findOut }))}
                      title="Crear reserva en este apartamento"
                      className="text-xs font-bold bg-white border border-green-300 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100">
                      <i className="fa-solid fa-door-open mr-1"></i>{r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
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
            const winEnd = addDaysStr(start, days);
            // Reservas de esta habitación que tocan la ventana visible
            const roomRes = reservations.filter(r => r.room_id === room.id && r.check_in < winEnd && r.check_out > start);
            return (
              <div key={room.id} className="flex border-b border-gray-50 hover:bg-gray-50/50">
                <div className="w-44 flex-shrink-0 px-3 py-3 text-sm font-bold text-gray-700 border-r border-gray-100 flex items-center gap-2">
                  <i className={`fa-solid ${room.penthouse ? 'fa-crown' : 'fa-door-closed'} text-[10px] text-gray-400`}></i>
                  <span className="truncate">{room.name}</span>
                </div>
                {/* Fila: celdas de fondo (clic para crear) + barras continuas encima */}
                <div className="relative flex-shrink-0" style={{ width: COL * days, height: 48 }}>
                  {/* Celdas de fondo: sombreado de hoy/fin de semana y clic para crear reserva */}
                  {dayList.map(ds => (
                    <button key={ds}
                      data-day={ds} data-room={room.id}
                      onClick={() => { if (!draggedRef.current) setEditing(blankReservation({ room_id: room.id, check_in: ds, check_out: addDaysStr(ds, 1) })); draggedRef.current = false; }}
                      title={`${room.name} · ${fmtDate(ds)} — libre`}
                      style={{ left: daysDiff(start, ds) * COL, width: COL, touchAction: drag ? 'none' : undefined }}
                      className={`absolute inset-y-0 border-r border-gray-50 ${isToday(ds) ? 'bg-green-50/40' : isWeekend(ds) ? 'bg-gray-50/60' : ''}`} />
                  ))}

                  {/* Capa de barras: cada reserva es UNA barra horizontal continua */}
                  <div className="absolute inset-0 pointer-events-none">
                    {roomRes.map(r => {
                      const isManual = r.source === 'manual';
                      // Durante el arrastre, previsualiza la nueva salida
                      const effOut = drag && drag.id === r.id ? addDaysStr(drag.overDay, 1) : r.check_out;
                      const lastNight = addDaysStr(effOut, -1);
                      const startIdx = daysDiff(start, r.check_in);   // puede ser <0 si empezó antes
                      const endIdx = daysDiff(start, lastNight);       // puede ser >days-1 si sigue después
                      const leftIdx = Math.max(0, startIdx);
                      const rightIdx = Math.min(days - 1, endIdx);
                      if (rightIdx < leftIdx) return null;
                      const left = leftIdx * COL;
                      const width = (rightIdx - leftIdx + 1) * COL;
                      const clipL = startIdx < 0, clipR = endIdx > days - 1;
                      const meta = barColor(r);
                      return (
                        <div key={r.id}
                          onClick={() => { if (!draggedRef.current) setDetail(r); draggedRef.current = false; }}
                          title={`${r.guest_name} · ${fmtDate(r.check_in)}→${fmtDate(r.check_out)}${isManual ? ' (manual — arrastra el borde derecho para alargar)' : ` (${meta.label})`}`}
                          style={{ left: left + 2, width: width - 4, pointerEvents: drag ? 'none' : 'auto' }}
                          className={`absolute top-1.5 bottom-1.5 ${meta.cls} flex items-center px-2 text-[11px] font-bold whitespace-nowrap overflow-hidden cursor-pointer shadow-sm
                            ${clipL ? 'rounded-l-none' : 'rounded-l-md'} ${clipR ? 'rounded-r-none' : 'rounded-r-md'}`}>
                          {clipL && <i className="fa-solid fa-caret-left mr-1 opacity-70"></i>}
                          <span className="truncate flex-1">{r.guest_name.split(' ')[0]}</span>
                          {clipR && <i className="fa-solid fa-caret-right ml-1 opacity-70"></i>}
                          {/* Borde derecho arrastrable para alargar reservas manuales */}
                          {isManual && !clipR && (
                            <span
                              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); draggedRef.current = false; setDrag({ id: r.id, roomId: room.id, overDay: lastNight }); }}
                              title="Arrastra para alargar"
                              style={{ touchAction: 'none' }}
                              className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize bg-white/30 hover:bg-white/60 flex items-center justify-center">
                              <i className="fa-solid fa-grip-lines-vertical text-[8px] text-white/80"></i>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-3 text-center">
        <i className="fa-solid fa-circle-info mr-1"></i>
        Cada reserva es una <b>barra continua</b>. Clic en un espacio libre para crear una reserva; clic en una barra para abrir la reserva.
        <br />En reservas <b>manuales</b> (verdes), arrastra el <b>borde derecho</b> (la manija ⋮) para alargar los días si el huésped se queda más.
      </p>

      {detail && <ReservationDetail r={detail} onEdit={() => { setEditing(detail); setDetail(null); }} onClose={() => setDetail(null)} onChanged={() => { setDetail(null); load(); }} />}
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
  const [detail, setDetail] = useState<Reservation | null>(null);

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

  // Reservas de esta habitación y la más temprana (para saltar al mes correcto)
  const roomRes = reservations.filter(r => r.room_id === roomId);
  const earliestRoom = roomRes.length ? roomRes.reduce((a, b) => (a.check_in < b.check_in ? a : b)) : null;
  const jumpToDate = (ds: string) => { const d = new Date(ds + 'T00:00:00'); setYear(d.getFullYear()); setMonth(d.getMonth()); };

  if (editing) return <ReservationForm initial={editing} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;

  const onDayClick = (d: number) => {
    const dateStr = ymd(year, month, d);
    const res = dayMap[dateStr];
    if (res) { setDetail(res); return; }
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

          {busyThisMonth === 0 && earliestRoom && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 mb-3 text-xs flex items-center justify-between gap-2 flex-wrap">
              <span><i className="fa-solid fa-circle-info mr-1"></i>Esta habitación tiene reservas en otro mes.</span>
              <button onClick={() => jumpToDate(earliestRoom.check_in)} className="font-bold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded">
                Ir a {MONTHS_ES[new Date(earliestRoom.check_in + 'T00:00:00').getMonth()]} <i className="fa-solid fa-arrow-right-long ml-1"></i>
              </button>
            </div>
          )}

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
                const meta = res ? barColor(res) : null;
                const cellCls = meta ? meta.cls : 'bg-green-50 text-green-700 hover:bg-green-100';
                return (
                  <button key={i} onClick={() => onDayClick(d)} title={res ? `${res.guest_name} (${meta!.label})` : 'Libre — clic para reservar'}
                    className={`aspect-square rounded-lg text-sm font-bold transition flex items-center justify-center ${cellCls} ${isToday(d) ? 'ring-2 ring-green-600' : ''}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200"></span>Libre</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600"></span>Booking</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400"></span>Airbnb</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500"></span>Expedia</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600"></span>Directa</span>
            </div>
            <span className="text-gray-500"><b className="text-red-500">{busyThisMonth}</b> noches ocupadas este mes</span>
          </div>

          <p className="text-[11px] text-gray-400 mt-4 text-center">
            <i className="fa-solid fa-circle-info mr-1"></i>
            Clic en un día libre para crear una reserva; clic en uno ocupado para ver/editar la reserva.
          </p>
        </div>
      </div>

      {detail && <ReservationDetail r={detail} onEdit={() => { setEditing(detail); setDetail(null); }} onClose={() => setDetail(null)} onChanged={() => { setDetail(null); load(); }} />}
    </div>
  );
};

// ============ CONTABILIDAD ============
// Comisión por canal (lo que cobra cada plataforma)
const COMMISSION: Record<string, number> = { booking: 0.155, airbnb: 0.155, expedia: 0.262, directa: 0 };
const canalDe = (r: Reservation): string => channelOf(r) || (r.source === 'web' || r.source === 'manual' ? 'directa' : 'directa');
const comisionDe = (r: Reservation): number => Math.round((r.total || 0) * (COMMISSION[canalDe(r)] || 0));

const Contabilidad: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [ym, setYm] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [platDetail, setPlatDetail] = useState<{ label: string; color: string; res: Reservation[] } | null>(null);
  const [gastos, setGastos] = useState<{ nombre: string; monto: number }[]>(() => {
    try { const s = localStorage.getItem('beto_gastos_fijos'); if (s) return JSON.parse(s); } catch {}
    return [{ nombre: 'Nómina', monto: 6000000 }, { nombre: 'Servicios públicos', monto: 3000000 }, { nombre: 'Mantenimiento', monto: 1000000 }];
  });
  const saveGastos = (g: { nombre: string; monto: number }[]) => { setGastos(g); try { localStorage.setItem('beto_gastos_fijos', JSON.stringify(g)); } catch {} };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('reservations').select('*').neq('status', 'cancelled');
    setReservations(((data as Reservation[]) || []).filter(r => !isBlock(r)));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center py-16 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;

  const [yy, mm] = ym.split('-').map(Number);
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const monthStart = `${ym}-01`;
  const monthEnd = `${ym}-${String(daysInMonth).padStart(2, '0')}`;
  // Reservas cuyo check-in cae en el mes
  const delMes = reservations.filter(r => r.check_in.startsWith(ym));
  // Noches ocupadas de una habitación dentro del mes (por solape)
  const nochesOcupadasMes = (roomId: string) => {
    let n = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${ym}-${String(d).padStart(2, '0')}`;
      if (reservations.some(r => r.room_id === roomId && r.check_in <= ds && ds < r.check_out)) n++;
    }
    return n;
  };

  // Por apartamento
  const porApto = ROOMS.map(room => {
    const res = delMes.filter(r => r.room_id === room.id);
    const ingresos = res.reduce((s, r) => s + (r.total || 0), 0);
    const comision = res.reduce((s, r) => s + comisionDe(r), 0);
    const nochesVendidas = res.reduce((s, r) => s + (r.nights || nightsBetween(r.check_in, r.check_out).length), 0);
    const ocupadas = nochesOcupadasMes(room.id);
    return {
      room, reservas: res.length, ingresos, comision, neto: ingresos - comision, nochesVendidas,
      tarifa: nochesVendidas ? Math.round(ingresos / nochesVendidas) : 0,
      diasVacios: daysInMonth - ocupadas, ocupadas,
    };
  });

  const totalIngresos = porApto.reduce((s, a) => s + a.ingresos, 0);
  const totalComision = porApto.reduce((s, a) => s + a.comision, 0);
  const totalNeto = totalIngresos - totalComision;
  const totalGastos = gastos.reduce((s, g) => s + (Number(g.monto) || 0), 0);
  const gananciaNeta = totalNeto - totalGastos;
  const totalReservas = porApto.reduce((s, a) => s + a.reservas, 0);
  const totalOcupadas = porApto.reduce((s, a) => s + a.ocupadas, 0);
  const ocupacionPct = Math.round((totalOcupadas / (ROOMS.length * daysInMonth)) * 100);

  // Por plataforma
  const plataformas = [
    { key: 'booking', label: 'Booking', color: 'text-blue-600' },
    { key: 'airbnb', label: 'Airbnb', color: 'text-yellow-600' },
    { key: 'expedia', label: 'Expedia', color: 'text-orange-600' },
    { key: 'directa', label: 'Directas', color: 'text-emerald-600' },
  ].map(p => {
    const res = delMes.filter(r => canalDe(r) === p.key);
    const ingresos = res.reduce((s, r) => s + (r.total || 0), 0);
    const comision = res.reduce((s, r) => s + comisionDe(r), 0);
    return { ...p, count: res.length, ingresos, comision, neto: ingresos - comision, rate: COMMISSION[p.key] || 0, res };
  });

  const mesNombre = new Date(monthStart + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900"><i className="fa-solid fa-chart-line text-green-600 mr-2"></i>Contabilidad</h2>
          <p className="text-gray-500 text-sm capitalize">{mesNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => generarReporteHuespedes(delMes, mesNombre)} className="h-10 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
            <i className="fa-solid fa-file-lines mr-1.5"></i>Reporte huéspedes
          </button>
          <input type="month" value={ym} onChange={e => setYm(e.target.value)} className="h-10 px-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700" />
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'fa-money-bill-wave', color: 'bg-gray-100 text-gray-700', label: 'Valor real (bruto)', value: money(totalIngresos) },
          { icon: 'fa-scissors', color: 'bg-red-100 text-red-600', label: 'Comisiones del mes', value: money(totalComision) },
          { icon: 'fa-sack-dollar', color: 'bg-green-100 text-green-700', label: 'Ingreso a Beto (neto)', value: money(totalNeto) },
          { icon: 'fa-percent', color: 'bg-purple-100 text-purple-700', label: 'Ocupación del mes', value: ocupacionPct + '%' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <p className="text-lg font-black text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 font-bold">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Gastos fijos + ganancia neta */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-gray-800"><i className="fa-solid fa-receipt text-red-500 mr-2"></i>Gastos fijos del mes</h3>
            <button onClick={() => saveGastos([...gastos, { nombre: 'Nuevo gasto', monto: 0 }])} className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg"><i className="fa-solid fa-plus mr-1"></i>Agregar</button>
          </div>
          <div className="space-y-2">
            {gastos.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={g.nombre} onChange={e => { const n = [...gastos]; n[i] = { ...n[i], nombre: e.target.value }; saveGastos(n); }}
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700" />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" value={g.monto} onChange={e => { const n = [...gastos]; n[i] = { ...n[i], monto: Number(e.target.value) }; saveGastos(n); }}
                    className="w-36 p-2 pl-5 border border-gray-200 rounded-lg text-sm text-right" />
                </div>
                <button onClick={() => saveGastos(gastos.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-1"><i className="fa-solid fa-trash text-xs"></i></button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 font-black text-gray-800">
            <span>Total gastos fijos</span><span className="text-red-500">-{money(totalGastos)}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Edita los montos; se guardan automáticamente. Son fijos cada mes.</p>
        </div>

        {/* Ganancia neta */}
        <div className={`rounded-2xl shadow-sm p-5 flex flex-col justify-center text-white ${gananciaNeta >= 0 ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
          <p className="text-sm font-bold opacity-90"><i className="fa-solid fa-wallet mr-1.5"></i>Ganancia neta del mes</p>
          <p className="text-4xl font-black my-2">{money(gananciaNeta)}</p>
          <div className="text-xs opacity-90 space-y-0.5 border-t border-white/20 pt-2">
            <p className="flex justify-between"><span>Ingreso (neto comisiones)</span><span>{money(totalNeto)}</span></p>
            <p className="flex justify-between"><span>Gastos fijos</span><span>-{money(totalGastos)}</span></p>
          </div>
        </div>
      </div>

      {/* Por plataforma */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-gray-800 mb-3">Ingresos por plataforma</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {plataformas.map(p => (
            <button key={p.key} onClick={() => p.count && setPlatDetail({ label: p.label, color: p.color, res: p.res })}
              className={`text-left border border-gray-100 rounded-xl p-3 transition ${p.count ? 'hover:border-green-300 hover:shadow-sm cursor-pointer' : 'opacity-60 cursor-default'}`}>
              <p className={`font-black ${p.color}`}>{p.label} <span className="text-[10px] text-gray-400">{p.rate ? `(${(p.rate * 100).toFixed(1)}%)` : '(0%)'}</span></p>
              <p className="text-lg font-black text-gray-900">{money(p.neto)}</p>
              <p className="text-[11px] text-gray-400 font-bold">Bruto {money(p.ingresos)}{p.comision ? ` · comisión ${money(p.comision)}` : ''}</p>
              <p className="text-[11px] text-gray-400 font-bold">{p.count} reserva{p.count === 1 ? '' : 's'}{p.count ? ' · ver' : ''}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla por apartamento */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <h3 className="font-black text-gray-800 p-5 pb-3">Reporte por apartamento</h3>
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="text-left text-xs text-gray-400 font-black uppercase border-b border-gray-100">
              <th className="px-5 py-2">Apartamento</th>
              <th className="px-3 py-2 text-center">Reservas</th>
              <th className="px-3 py-2 text-center">Noches</th>
              <th className="px-3 py-2 text-right">Valor real</th>
              <th className="px-3 py-2 text-right">Comisión</th>
              <th className="px-3 py-2 text-right">Neto (Beto)</th>
              <th className="px-3 py-2 text-center">Días vacíos</th>
            </tr>
          </thead>
          <tbody>
            {porApto.map(a => (
              <tr key={a.room.id} className={`border-b border-gray-50 ${a.ingresos > 0 ? '' : 'text-gray-400'}`}>
                <td className="px-5 py-2.5 font-bold text-gray-700">{a.room.name}</td>
                <td className="px-3 py-2.5 text-center">{a.reservas}</td>
                <td className="px-3 py-2.5 text-center">{a.ocupadas}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{money(a.ingresos)}</td>
                <td className="px-3 py-2.5 text-right text-red-500">{a.comision ? '-' + money(a.comision) : '—'}</td>
                <td className="px-3 py-2.5 text-right font-bold text-green-700">{money(a.neto)}</td>
                <td className="px-3 py-2.5 text-center">{a.diasVacios}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 font-black text-gray-900">
              <td className="px-5 py-3">TOTAL</td>
              <td className="px-3 py-3 text-center">{totalReservas}</td>
              <td className="px-3 py-3 text-center">{totalOcupadas}</td>
              <td className="px-3 py-3 text-right text-gray-700">{money(totalIngresos)}</td>
              <td className="px-3 py-3 text-right text-red-500">-{money(totalComision)}</td>
              <td className="px-3 py-3 text-right text-green-700">{money(totalNeto)}</td>
              <td className="px-3 py-3 text-center">{ROOMS.length * daysInMonth - totalOcupadas}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">Comisiones: Booking 15,5% · Airbnb 15,5% · Expedia 26,2% · Directas 0%. El <b>neto</b> es lo que le queda a Beto después de la comisión. Ingresos por fecha de entrada del mes.</p>

      {/* Detalle de reservas por plataforma */}
      {platDetail && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setPlatDetail(null); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className={`text-xl font-black ${platDetail.color}`}>{platDetail.label}</h2>
                <p className="text-xs text-gray-500 capitalize">{mesNombre} · {platDetail.res.length} reserva{platDetail.res.length === 1 ? '' : 's'} · {money(platDetail.res.reduce((s, r) => s + (r.total || 0), 0))}</p>
              </div>
              <button onClick={() => setPlatDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-3">
              {platDetail.res.slice().sort((a, b) => a.check_in.localeCompare(b.check_in)).map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">{r.guest_name}</p>
                    <p className="text-xs text-gray-500"><i className="fa-solid fa-door-open mr-1"></i>{r.room_name || r.room_id} <span className="mx-1 text-gray-300">·</span>{fmtDate(r.check_in)} → {fmtDate(r.check_out)}</p>
                  </div>
                  <span className="font-bold text-green-700 text-sm flex-shrink-0">{money(r.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ CHECK-INS (registros de huéspedes) ============
const CONTRATO = [
  ['1. Registro', 'Solo deben hospedarse la cantidad exacta de personas declaradas en la reserva. Personas adicionales pueden generar tarifa extra. La estadía es únicamente por los días reservados; el alojamiento no puede convertirse en residencia.'],
  ['2. Llegada y Salida', 'El huésped debe desalojar antes de la hora de salida establecida. Pasado ese tiempo, el anfitrión podrá cobrar un cargo extra según tarifas.'],
  ['3. Ruido', 'El huésped debe mantener un comportamiento respetuoso hacia los demás huéspedes y vecinos.'],
  ['4. Niños', 'Los huéspedes con menores deben velar por ellos en todo momento y son responsables de cualquier accidente dentro del alojamiento.'],
  ['5. No fumar / sustancias / armas', 'Prohibido fumar (aplica tarifa de recuperación), usar sustancias ilegales o ingresar armas de cualquier tipo.'],
  ['6. Inspecciones', 'El administrador puede ingresar, con previo aviso, para inspeccionar o realizar reparaciones y mantenimiento.'],
  ['7. Daños', 'El huésped deja el alojamiento en buenas condiciones y es responsable de artículos faltantes o rotos y de las acciones de sus acompañantes. Pérdida de llaves genera tarifa de reposición.'],
  ['8. Mascotas', 'El anfitrión se reserva el derecho de aceptar o no mascotas; puede aplicar tarifa adicional.'],
  ['9. Liberación de responsabilidad', 'El anfitrión no se responsabiliza por pérdida de valores ni por inconvenientes por circunstancias fortuitas (agua, gas, luz, internet). El huésped debe cerrar ventanas y puertas al salir.'],
  ['10. Abuso sexual', 'Se prohíbe totalmente la explotación sexual de menores; se denunciará ante las autoridades cualquier sospecha.'],
  ['11. Check-in y Check-out', 'Check-in 3:00 p.m. · Check-out 11:00 a.m. Salidas tardías sujetas a disponibilidad y costo adicional.'],
  ['12. Visitantes', 'No se permite el ingreso de visitantes no registrados sin autorización previa.'],
  ['13. Parqueadero', 'Sujeto a disponibilidad. Carro $17.000/noche · Moto $8.000/noche. Parqueadero alterno a ~3 cuadras.'],
  ['14. Cámaras de seguridad', 'El edificio cuenta con cámaras de seguridad en zonas comunes.'],
  ['15. Aceptación electrónica', 'La firma digital tiene la misma validez que una firma manuscrita para efectos de este contrato.'],
];

const contratoPDF = (reg: any) => {
  const w = window.open('', '_blank', 'width=900,height=900');
  if (!w) { alert('Permite las ventanas emergentes.'); return; }
  const clausulas = CONTRATO.map(([t, d]) => `<p style="margin:7px 0"><b>${t}.</b> ${d}</p>`).join('');
  const firmado = reg.signed_at ? new Date(reg.signed_at).toLocaleString('es-CO') : '';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato ${reg.nombre}</title>
  <style>*{font-family:Arial,sans-serif}body{margin:0;padding:28px;color:#1e293b;font-size:12px;line-height:1.45}
  .h{text-align:center;border-bottom:3px solid #16a34a;padding-bottom:10px;margin-bottom:14px}
  .h h1{margin:0;font-size:17px;color:#15803d}.h p{margin:3px 0;font-size:11px;color:#475569}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}td{border:1px solid #e2e8f0;padding:6px}.l{background:#f8fafc;font-weight:bold;width:30%}
  .firma{display:flex;gap:24px;margin-top:20px;align-items:flex-end}
  .firma img{border:1px solid #e2e8f0;border-radius:8px;max-height:90px}
  .btn{background:#16a34a;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:bold;cursor:pointer}
  @media print{.no-print{display:none}}</style></head><body>
  <div class="no-print" style="text-align:right;margin-bottom:10px"><button class="btn" onclick="window.print()">⬇️ Descargar / Imprimir PDF</button></div>
  <div class="h"><h1>CONTRATO HOTELERO — ${HOTEL.name}</h1><p>${HOTEL.address} · ${HOTEL.phone}</p></div>
  <table>
    <tr><td class="l">Huésped</td><td>${reg.nombre || ''}</td></tr>
    <tr><td class="l">Documento</td><td>${reg.doc_type || ''} ${reg.doc_number || ''}</td></tr>
    <tr><td class="l">Nacionalidad</td><td>${reg.nationality || ''}</td></tr>
    <tr><td class="l">Teléfono / Correo</td><td>${reg.phone || ''} ${reg.email ? '· ' + reg.email : ''}</td></tr>
    <tr><td class="l">Acompañantes</td><td>${reg.acompanantes ?? ''}</td></tr>
    <tr><td class="l">Procedencia / Motivo</td><td>${reg.procedencia || ''} ${reg.motivo ? '· ' + reg.motivo : ''}</td></tr>
    ${Array.isArray(reg.companions) && reg.companions.length ? `<tr><td class="l">Acompañantes</td><td>${reg.companions.map((c: any) => `${c.nombre} (${c.doc_type || ''} ${c.doc_number || ''}${c.nationality ? ' · ' + c.nationality : ''})`).join('<br>')}</td></tr>` : ''}
  </table>
  <div style="margin-top:8px">${clausulas}</div>
  <div class="firma">
    <div>${reg.signature ? `<img src="${reg.signature}">` : ''}<div style="border-top:1px solid #1e293b;margin-top:4px;padding-top:3px;font-size:11px">Firma del huésped</div></div>
    <div style="font-size:10px;color:#64748b">Aceptado electrónicamente${firmado ? ' el ' + firmado : ''}${reg.ip ? ' · IP ' + reg.ip : ''}.<br>La firma digital tiene la misma validez que una manuscrita (cláusula 15).</div>
  </div>
  </body></html>`;
  w.document.write(html); w.document.close();
};

const Checkins: React.FC = () => {
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('guest_registrations').select('*').order('created_at', { ascending: false });
    if (error && isMissingTable(error)) { setMissing(true); setRegs([]); }
    else { setMissing(false); setRegs((data as any[]) || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center py-16 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;

  return (
    <div>
      {missing ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 text-sm">
          <p className="font-black mb-1"><i className="fa-solid fa-database mr-2"></i>Falta crear la tabla de check-ins</p>
          <p>Corre en Supabase el SQL de <code className="bg-amber-100 px-1 rounded">guest_registrations</code> (tabla + bucket de documentos) que te pasé en el chat.</p>
        </div>
      ) : regs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-id-card text-4xl mb-3"></i>
          <p className="font-bold">Aún no hay check-ins recibidos.</p>
          <p className="text-xs mt-1">Envía el link de registro a tus huéspedes desde la ficha de la reserva (botón "Registro").</p>
        </div>
      ) : (
        <div className="space-y-3">
          {regs.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-black text-gray-900 truncate">{r.nombre}</p>
                <p className="text-sm text-gray-500">{r.doc_type} {r.doc_number} · {r.nationality} · <i className="fa-solid fa-phone mr-1"></i>{r.phone}</p>
                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('es-CO')}{r.acompanantes ? ` · ${r.acompanantes} acomp.` : ''}{r.hora_llegada ? ` · llega ${r.hora_llegada}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {r.signature && <span title="Firmado" className="px-2 py-2 text-green-600"><i className="fa-solid fa-signature"></i></span>}
                <button onClick={() => setDetail(r)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold"><i className="fa-solid fa-eye"></i></button>
                <button onClick={() => contratoPDF(r)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold"><i className="fa-solid fa-file-pdf mr-1"></i>Contrato</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-black text-gray-900">{detail.nombre}</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
              <p><b className="text-gray-400">Documento:</b> {detail.doc_type} {detail.doc_number}</p>
              <p><b className="text-gray-400">Nacionalidad:</b> {detail.nationality}</p>
              <p><b className="text-gray-400">Teléfono:</b> {detail.phone}{detail.email ? ` · ${detail.email}` : ''}</p>
              <p><b className="text-gray-400">Acompañantes:</b> {detail.acompanantes ?? '—'} · <b className="text-gray-400">Llegada:</b> {detail.hora_llegada || '—'}</p>
              <p><b className="text-gray-400">Procedencia:</b> {detail.procedencia || '—'} · <b className="text-gray-400">Motivo:</b> {detail.motivo || '—'}</p>
              {Array.isArray(detail.companions) && detail.companions.length > 0 && (
                <div><b className="text-gray-400">Acompañantes:</b>
                  <ul className="ml-1 mt-1 space-y-1">{detail.companions.map((c: any, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      {c.doc_front ? <a href={c.doc_front} target="_blank" rel="noopener noreferrer"><img src={c.doc_front} className="w-9 h-9 object-cover rounded border border-gray-100" /></a> : <span className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-gray-300"><i className="fa-solid fa-image"></i></span>}
                      <span>{c.nombre} — {c.doc_type} {c.doc_number}{c.nationality ? ` · ${c.nationality}` : ''}</span>
                    </li>
                  ))}</ul>
                </div>
              )}
              {detail.signed_at && <p className="text-xs text-gray-400">Firmado {new Date(detail.signed_at).toLocaleString('es-CO')}{detail.ip ? ` · IP ${detail.ip}` : ''}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {detail.doc_front && <a href={detail.doc_front} target="_blank" rel="noopener noreferrer"><img src={detail.doc_front} className="w-full h-28 object-cover rounded-lg border border-gray-100" /><p className="text-[10px] text-center text-gray-400 mt-1">Documento (frente)</p></a>}
              {detail.doc_back && <a href={detail.doc_back} target="_blank" rel="noopener noreferrer"><img src={detail.doc_back} className="w-full h-28 object-cover rounded-lg border border-gray-100" /><p className="text-[10px] text-center text-gray-400 mt-1">Documento (reverso)</p></a>}
            </div>
            {detail.signature && <div className="mt-3"><p className="text-[11px] text-gray-400 font-bold mb-1">Firma:</p><img src={detail.signature} className="border border-gray-100 rounded-lg max-h-24" /></div>}
            <button onClick={() => contratoPDF(detail)} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"><i className="fa-solid fa-file-pdf mr-1.5"></i>Descargar contrato firmado (PDF)</button>
          </div>
        </div>
      )}
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
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('blog').upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      alert('No se pudo subir la imagen: ' + error.message + '\n(¿Ya creaste el bucket "blog" en Supabase Storage?)');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('blog').getPublicUrl(path);
    setEditing((prev: any) => ({ ...prev, cover_image: data.publicUrl }));
    setUploading(false);
  };

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
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Imagen de portada</label>
            <div className="flex items-center gap-3 mb-2">
              <label className={`px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer inline-flex items-center gap-2 ${uploading ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                {uploading ? 'Subiendo…' : 'Subir imagen'}
                <input type="file" accept="image/*" disabled={uploading} className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.currentTarget.value = ''; }} />
              </label>
              <span className="text-xs text-gray-400">Elige una foto de tu equipo y se sube sola.</span>
            </div>
            <input placeholder="…o pega un enlace directo de imagen (.jpg, .png)" value={editing.cover_image}
              onChange={e => setEditing({ ...editing, cover_image: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
            {editing.cover_image && (
              <img src={editing.cover_image} alt="Vista previa"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                className="mt-3 h-40 w-full object-cover rounded-xl border border-gray-100" />
            )}
          </div>
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
