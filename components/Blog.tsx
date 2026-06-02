import React, { useEffect, useState } from 'react';
import { supabase, BlogPost } from '../lib/supabase';

interface BlogProps {
  language: 'es' | 'en';
}

const Blog: React.FC<BlogProps> = ({ language }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [active, setActive] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = {
    title: language === 'es' ? 'El Blog de Beto' : "Beto's Blog",
    sub: language === 'es' ? 'Historias, consejos y la mejor info de Medellín.' : 'Stories, tips and the best of Medellín.',
    empty: language === 'es' ? 'Aún no hay artículos publicados. ¡Vuelve pronto!' : 'No articles published yet. Come back soon!',
    loadErr: language === 'es' ? 'No pudimos cargar el blog. Intenta de nuevo.' : 'Could not load the blog. Try again.',
    read: language === 'es' ? 'Leer más' : 'Read more',
    back: language === 'es' ? 'Volver al blog' : 'Back to blog',
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) setError(true);
      else setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  if (active) {
    return (
      <article className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => setActive(null)} className="text-green-600 font-bold mb-6 inline-flex items-center gap-2 hover:gap-3 transition-all">
          <i className="fa-solid fa-arrow-left"></i> {t.back}
        </button>
        {active.cover_image && (
          <img src={active.cover_image} alt={active.title}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.ibb.co/2Y8Ndq5Q/5.jpg'; }}
            className="w-full h-72 object-cover rounded-2xl mb-6 shadow-lg" />
        )}
        <p className="text-sm text-gray-400 font-semibold mb-2">{fmtDate(active.created_at)} · {active.author}</p>
        <h1 className="text-4xl font-black mb-6 text-gray-900">{active.title}</h1>
        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
          {active.content}
        </div>
      </article>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-3 font-paisa text-green-800">{t.title}</h1>
        <p className="text-gray-500 text-lg">{t.sub}</p>
      </div>

      {loading && (
        <div className="text-center py-20 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-3xl"></i>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20 text-red-500 font-semibold">{t.loadErr}</div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-20 text-gray-400 text-lg">{t.empty}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <button
            key={post.id}
            onClick={() => setActive(post)}
            className="text-left bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 flex flex-col border border-gray-100"
          >
            <div className="h-52 overflow-hidden bg-gray-100">
              <img
                src={post.cover_image || 'https://i.ibb.co/2Y8Ndq5Q/5.jpg'}
                alt={post.title}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.ibb.co/2Y8Ndq5Q/5.jpg'; }}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <p className="text-xs text-gray-400 font-semibold mb-2">{fmtDate(post.created_at)}</p>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition line-clamp-2">{post.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{post.excerpt}</p>
              <span className="text-green-600 font-bold text-sm inline-flex items-center gap-2">
                {t.read} <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Blog;
