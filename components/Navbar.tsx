import React, { useState } from 'react';

interface NavbarProps {
  onNavigate: (view: 'home' | 'tours' | 'about' | 'contact' | 'blog' | 'admin') => void;
  currentView: string;
  language: 'es' | 'en';
  onLanguageChange: (lang: 'es' | 'en') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, language, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = language === 'es'
    ? [
        { label: 'Inicio', view: 'home' },
        { label: 'Planes', view: 'tours' },
        { label: 'Blog', view: 'blog' },
        { label: 'Nosotros', view: 'about' },
        { label: 'Contacto', view: 'contact' },
      ]
    : [
        { label: 'Home', view: 'home' },
        { label: 'Tours', view: 'tours' },
        { label: 'Blog', view: 'blog' },
        { label: 'About', view: 'about' },
        { label: 'Contact', view: 'contact' },
      ];

  const go = (view: string) => { onNavigate(view as any); setIsOpen(false); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
        <button onClick={() => go('home')} className="flex items-center space-x-2">
          <img src="https://i.ibb.co/wNvw8VZp/Gemini-Generated-Image-12fj6q12fj6q12fj.jpg" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-paisa text-green-800">Beto Tours</span>
        </button>

        {/* Menú escritorio */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map(item => (
            <button key={item.view} onClick={() => go(item.view)} className={`font-bold ${currentView === item.view ? 'text-green-600' : 'text-gray-600'}`}>
              {item.label}
            </button>
          ))}
          <a href="/alojamientos.html" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-600 hover:text-green-600 inline-flex items-center gap-1">
            <i className="fa-solid fa-bed text-sm"></i>
            {language === 'es' ? 'Alojamientos' : 'Stays'}
          </a>
          <a href="/bienvenida.html" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-600 hover:text-green-600 inline-flex items-center gap-1">
            <i className="fa-solid fa-map-location-dot text-sm"></i>
            {language === 'es' ? 'Guía' : 'Guide'}
          </a>
          <button onClick={() => go('admin')} className={`font-bold inline-flex items-center gap-1 ${currentView === 'admin' ? 'text-green-600' : 'text-gray-600'} hover:text-green-600`}>
            <i className="fa-solid fa-lock text-xs"></i>
            Admin
          </button>
          <div className="flex bg-gray-100 rounded-full p-1">
            <button onClick={() => onLanguageChange('es')} className={`px-2 py-1 text-xs font-bold rounded-full ${language === 'es' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>ES</button>
            <button onClick={() => onLanguageChange('en')} className={`px-2 py-1 text-xs font-bold rounded-full ${language === 'en' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>EN</button>
          </div>
        </div>

        {/* Botón hamburguesa (móvil) */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden w-11 h-11 flex items-center justify-center text-gray-700 text-2xl" aria-label="Menú">
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-3 flex flex-col">
          {navItems.map(item => (
            <button key={item.view} onClick={() => go(item.view)} className={`text-left font-bold py-3 border-b border-gray-50 ${currentView === item.view ? 'text-green-600' : 'text-gray-700'}`}>
              {item.label}
            </button>
          ))}
          <a href="/alojamientos.html" target="_blank" rel="noopener noreferrer" className="text-left font-bold py-3 border-b border-gray-50 text-gray-700 inline-flex items-center gap-2">
            <i className="fa-solid fa-bed text-sm"></i>
            {language === 'es' ? 'Alojamientos' : 'Stays'}
          </a>
          <a href="/bienvenida.html" target="_blank" rel="noopener noreferrer" className="text-left font-bold py-3 border-b border-gray-50 text-gray-700 inline-flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot text-sm"></i>
            {language === 'es' ? 'Guía' : 'Guide'}
          </a>
          <button onClick={() => go('admin')} className={`text-left font-bold py-3 border-b border-gray-50 inline-flex items-center gap-2 ${currentView === 'admin' ? 'text-green-600' : 'text-gray-700'}`}>
            <i className="fa-solid fa-lock text-xs"></i>
            Admin
          </button>
          <div className="flex bg-gray-100 rounded-full p-1 mt-3 w-fit">
            <button onClick={() => onLanguageChange('es')} className={`px-3 py-1 text-xs font-bold rounded-full ${language === 'es' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>ES</button>
            <button onClick={() => onLanguageChange('en')} className={`px-3 py-1 text-xs font-bold rounded-full ${language === 'en' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>EN</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;