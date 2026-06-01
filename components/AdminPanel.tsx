import React, { useEffect, useState } from 'react';
import { supabase, BlogPost, AvailabilityItem } from '../lib/supabase';
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
  const [tab, setTab] = useState<'avail' | 'rooms' | 'blog'>('rooms');

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
        <button onClick={() => setTab('rooms')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'rooms' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-calendar-days mr-2"></i>Habitaciones
        </button>
        <button onClick={() => setTab('avail')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'avail' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-toggle-on mr-2"></i>Disponibilidad
        </button>
        <button onClick={() => setTab('blog')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'blog' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-newspaper mr-2"></i>Blog
        </button>
      </div>

      {tab === 'rooms' ? <RoomsCalendar /> : tab === 'avail' ? <AvailabilityManager /> : <BlogManager />}
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
  { id: '301', name: 'Aparta Suite 301', guests: 4, bed: 'Cama 1.40', price: '150.000' },
  { id: '302', name: 'Aparta Suite 302', guests: 4, bed: 'Cama 1.40', price: '130.000' },
  { id: '303', name: 'Aparta Suite 303', guests: 3, bed: 'Cama 1.40', price: '110.000' },
  { id: '401', name: 'Aparta Suite 401', guests: 6, bed: 'Cama 1.60', price: '160.000' },
  { id: '402', name: 'Aparta Suite 402', guests: 6, bed: 'Cama 1.40', price: '160.000' },
  { id: '403', name: 'Aparta Suite 403', guests: 3, bed: 'Cama Doble', price: '110.000' },
  { id: '501', name: 'Aparta Suite 501', guests: 7, bed: 'Cama 1.60', price: '170.000' },
  { id: '502', name: 'Aparta Suite 502', guests: 5, bed: 'Cama 1.40', price: '150.000' },
  { id: '504', name: 'Aparta Suite 504', guests: 6, bed: 'Cama 1.40', price: '160.000' },
  { id: '601', name: 'Penthouse 601', guests: 9, bed: 'Cama 1.40', price: '170.000', penthouse: true },
];

const AYENDA_BASE = 'https://engine.ayenda.co/aparta-suites-torre-de-prado-';
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

type CalendarData = Record<string, string[]>; // { roomId: ['2026-06-15', ...] }

const loadCalendar = (): CalendarData => {
  try { return JSON.parse(localStorage.getItem('beto_room_calendar') || '{}'); } catch { return {}; }
};

const RoomsCalendar: React.FC = () => {
  const [roomId, setRoomId] = useState<string>(ROOMS[0].id);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [cal, setCal] = useState<CalendarData>(loadCalendar);

  const room = ROOMS.find(r => r.id === roomId)!;
  const busyDays = cal[roomId] || [];

  const persist = (next: CalendarData) => {
    setCal(next);
    try { localStorage.setItem('beto_room_calendar', JSON.stringify(next)); } catch {}
  };

  const toggleDay = (dateStr: string) => {
    const current = cal[roomId] || [];
    const next = current.includes(dateStr)
      ? current.filter(d => d !== dateStr)
      : [...current, dateStr];
    persist({ ...cal, [roomId]: next });
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  // Construir la grilla del mes (semana empieza lunes)
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isPast = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const busyThisMonth = busyDays.filter(d => d.startsWith(ymd(year, month, 1).slice(0, 7))).length;

  const clearMonth = () => {
    const prefix = ymd(year, month, 1).slice(0, 7);
    persist({ ...cal, [roomId]: busyDays.filter(d => !d.startsWith(prefix)) });
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {/* Selector de habitaciones */}
      <div>
        <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3">Habitaciones</h2>
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {ROOMS.map(r => {
            const occupied = (cal[r.id] || []).length;
            const active = r.id === roomId;
            return (
              <button key={r.id} onClick={() => setRoomId(r.id)}
                className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-100 hover:border-green-300'}`}>
                <span className="flex items-center gap-2">
                  <i className={`fa-solid ${r.penthouse ? 'fa-crown' : 'fa-door-closed'} text-xs`}></i>
                  {r.name}
                </span>
                {occupied > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-red-100 text-red-600'}`}>{occupied}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {/* Info de la habitación */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-5 border-b border-gray-100">
          <div>
            <p className="text-lg font-black text-gray-900">{room.name}</p>
            <p className="text-xs text-gray-500">
              <i className="fa-solid fa-user mr-1"></i>{room.guests} huéspedes · {room.bed} · <b className="text-green-700">${room.price}</b>/noche
            </p>
          </div>
          <a href={AYENDA_BASE + room.id} target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg inline-flex items-center gap-1">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>Reserva Ayenda
          </a>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <p className="font-black text-gray-800">{MONTHS_ES[month]} {year}</p>
          <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        {/* Encabezado días */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS_ES.map(d => <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>)}
        </div>

        {/* Grilla */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateStr = ymd(year, month, d);
            const busy = busyDays.includes(dateStr);
            return (
              <button key={i} onClick={() => toggleDay(dateStr)}
                className={`aspect-square rounded-lg text-sm font-bold transition relative flex items-center justify-center
                  ${busy ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-50 text-green-700 hover:bg-green-100'}
                  ${isToday(d) ? 'ring-2 ring-green-600' : ''}
                  ${isPast(d) && !busy ? 'opacity-50' : ''}`}>
                {d}
              </button>
            );
          })}
        </div>

        {/* Leyenda + resumen */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200"></span>Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500"></span>Ocupado</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500"><b className="text-red-500">{busyThisMonth}</b> días ocupados este mes</span>
            {busyThisMonth > 0 && (
              <button onClick={clearMonth} className="text-gray-400 hover:text-red-500 font-bold">
                <i className="fa-solid fa-eraser mr-1"></i>Limpiar mes
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-4 text-center">
          <i className="fa-solid fa-circle-info mr-1"></i>
          Toca un día para marcarlo ocupado o libre. Se guarda en este navegador (modo demo).
        </p>
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
