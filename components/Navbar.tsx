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
        { label: 'Quién es Beto', view: 'about' },
        { label: 'Contacto', view: 'contact' },
      ]
    : [
        { label: 'Home', view: 'home' },
        { label: 'Tours', view: 'tours' },
        { label: 'Who is Beto', view: 'about' },
        { label: 'Contact', view: 'contact' },
      ];

  const bookingLabel = language === 'es' ? 'Reservar Ya' : 'Book Now';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img 
                src="https://i.ibb.co/wNvw8VZp/Gemini-Generated-Image-12fj6q12fj6q12fj.jpg" 
                alt="Beto Tours Logo" 
                className="h-12 w-auto object-contain mr-3 rounded-lg group-hover:scale-105 transition"
              />
              <span className="text-xl font-paisa text-green-800 hidden sm:block">
                Beto Tours
              </span>
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  currentView === item.view 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="flex items-center ml-4 mr-2 bg-gray-100 rounded-full p-1">
              <button 
                onClick={() => onLanguageChange('es')}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${language === 'es' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
              >
                ES
              </button>
              <button 
                onClick={() => onLanguageChange('en')}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${language === 'en' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
              >
                EN
              </button>
            </div>

            <a 
              href="https://wa.me/573332482626" 
              target="_blank" 
              className="ml-2 bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition shadow-md flex items-center text-sm"
            >
              <i className="fa-brands fa-whatsapp mr-2 text-lg"></i>
              {bookingLabel}
            </a>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={() => onLanguageChange(language === 'es' ? 'en' : 'es')}
              className="text-gray-600 font-bold text-sm bg-gray-100 px-3 py-1 rounded-full"
            >
              {language.toUpperCase()}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 focus:outline-none p-2">
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view as any);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-xl font-bold ${
                  currentView === item.view 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <a 
              href="https://wa.me/573332482626" 
              target="_blank"
              className="block w-full bg-green-600 text-white text-center py-4 rounded-xl font-bold mt-4 shadow-lg"
            >
               WhatsApp de Beto
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;