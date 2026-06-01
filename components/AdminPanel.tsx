import React, { useEffect, useState } from 'react';
import { supabase, BlogPost, AvailabilityItem } from '../lib/supabase';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<'avail' | 'blog'>('avail');

  // Login form — pre-llenado para acceso demo (cambiar la clave en producción)
  const [email, setEmail] = useState('dmcruz1990@gmail.com');
  const [password, setPassword] = useState('1234');
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
    setAuthLoading(true);
    setAuthMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMsg(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (checking) {
    return <div className="text-center py-32 text-gray-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  // ---------- LOGIN ----------
  if (!session) {
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
            <i className="fa-solid fa-circle-info mr-1"></i> Acceso demo precargado. Solo presiona <b>Entrar</b>.
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
  if (!isAdmin) {
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
          <p className="text-gray-500 text-sm">{session.user.email}</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 text-sm">
          <i className="fa-solid fa-right-from-bracket mr-2"></i>Salir
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        <button onClick={() => setTab('avail')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'avail' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-toggle-on mr-2"></i>Disponibilidad
        </button>
        <button onClick={() => setTab('blog')} className={`px-5 py-2.5 rounded-full font-bold text-sm transition ${tab === 'blog' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <i className="fa-solid fa-newspaper mr-2"></i>Blog
        </button>
      </div>

      {tab === 'avail' ? <AvailabilityManager /> : <BlogManager />}
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
