import React, { useState } from 'react';

interface NavbarProps {
  onNavigate: (view: 'home' | 'tours' | 'about' | 'contact') => void;
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
        { label: 'Nosotros', view: 'about' },
        { label: 'Contacto', view: 'contact' },
      ]
    : [
        { label: 'Home', view: 'home' },
        { label: 'Tours', view: 'tours' },
        { label: 'About', view: 'about' },
        { label: 'Contact', view: 'contact' },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
        <button onClick={() => onNavigate('home')} className="flex items-center space-x-2">
          <img src="https://i.ibb.co/wNvw8VZp/Gemini-Generated-Image-12fj6q12fj6q12fj.jpg" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-paisa text-green-800">Beto Tours</span>
        </button>
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map(item => (
            <button key={item.view} onClick={() => onNavigate(item.view as any)} className={`font-bold ${currentView === item.view ? 'text-green-600' : 'text-gray-600'}`}>
              {item.label}
            </button>
          ))}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button onClick={() => onLanguageChange('es')} className={`px-2 py-1 text-xs font-bold rounded-full ${language === 'es' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>ES</button>
            <button onClick={() => onLanguageChange('en')} className={`px-2 py-1 text-xs font-bold rounded-full ${language === 'en' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>EN</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;