
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TourCard from './components/TourCard';
import ChatWidget from './components/ChatWidget';
import { TOURS } from './data/tours';
import { Tour } from './types';

type View = 'home' | 'tours' | 'about' | 'contact';

interface Participant {
  fullName: string;
  docType: string;
  docNumber: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  
  // Estado para la reserva
  const [numPeople, setNumPeople] = useState<number>(1);
  const [participants, setParticipants] = useState<Participant[]>([{ fullName: '', docType: 'CC', docNumber: '' }]);

  // Resetear formulario e imagen cuando se cierra o abre un tour
  useEffect(() => {
    setNumPeople(1);
    setParticipants([{ fullName: '', docType: 'CC', docNumber: '' }]);
    setCurrentImageIndex(0);
  }, [selectedTour]);

  // Sincronizar participantes cuando cambia el número de personas
  const handleNumPeopleChange = (val: number) => {
    const n = Math.max(1, Math.min(20, val));
    setNumPeople(n);
    const newParticipants = [...participants];
    if (n > participants.length) {
      for (let i = participants.length; i < n; i++) {
        newParticipants.push({ fullName: '', docType: 'CC', docNumber: '' });
      }
    } else {
      newParticipants.splice(n);
    }
    setParticipants(newParticipants);
  };

  const handleParticipantChange = (index: number, field: keyof Participant, value: string) => {
    const newParticipants = [...participants];
    (newParticipants[index] as any)[field] = value;
    setParticipants(newParticipants);
  };

  const handleBooking = (tour: Tour) => {
    const incomplete = participants.some(p => !p.fullName.trim() || !p.docNumber.trim());
    if (incomplete) {
      alert(language === 'es' ? "¡Eh ave maría! Por favor llene los nombres y números de documento de todos los parceros para la reserva." : "Oh boy! Please fill in the names and ID numbers of all travel buddies for the booking.");
      return;
    }

    let passengersText = participants.map((p, i) => 
      `Persona ${i + 1}: ${p.fullName} - ${p.docType}: ${p.docNumber}`
    ).join('\n');

    const tourTitle = language === 'es' ? tour.title : tour.titleEn;
    const message = language === 'es' 
      ? `¡Hola Beto! 👋\n\nMe interesa el tour: *${tourTitle}*.\n\nSomos *${numPeople}* persona(s):\n${passengersText}\n\n¿Tienen disponibilidad para estos cupos?`
      : `Hi Beto! 👋\n\nI'm interested in the tour: *${tourTitle}*.\n\nWe are *${numPeople}* person(s):\n${passengersText}\n\nDo you have availability for these spots?`;
    
    window.open(`https://wa.me/573332482626?text=${encodeURIComponent(message)}`, '_blank');
  };

  const translations = {
    heroTitle: language === 'es' ? '¡MEDELLÍN TE ESPERA, PARCE!' : 'MEDELLÍN IS WAITING FOR YOU, BUDDY!',
    heroSub: language === 'es' ? 'La experiencia más auténtica de Antioquia con guías locales de verdad.' : 'The most authentic experience in Antioquia with real local guides.',
    heroBtn: language === 'es' ? 'Ver Todos los Planes' : 'See All Plans',
    featuredTitle: language === 'es' ? 'Planes Destacados' : 'Featured Plans',
    featuredSub: language === 'es' ? 'Lo que todo el mundo quiere conocer.' : 'What everyone wants to explore.',
    viewAll: language === 'es' ? 'Ver todos' : 'View all',
    safeTitle: language === 'es' ? '100% Seguro' : '100% Safe',
    safeDesc: language === 'es' ? 'Contamos con todos los seguros de ley y RNT al día para tu tranquilidad.' : 'We have all legal insurance and updated RNT for your peace of mind.',
    friendlyTitle: language === 'es' ? 'Atención de Amigos' : 'Friendly Service',
    friendlyDesc: language === 'es' ? 'No somos una agencia fría, somos Beto y su equipo dándote la bienvenida.' : 'We are not a cold agency; it is Beto and his team welcoming you.',
    localTitle: language === 'es' ? 'Guías Locales' : 'Local Guides',
    localDesc: language === 'es' ? 'Nacidos y criados en Medellín, te contamos la historia real de nuestra tierra.' : 'Born and raised in Medellín, we tell you the real history of our land.',
    catalogTitle: language === 'es' ? 'Nuestro Catálogo de Aventuras' : 'Our Adventure Catalog',
    catalogSub: language === 'es' ? '"Pura sabrosura antioqueña en cada recorrido"' : '"Pure Antioquian flavor in every tour"',
    aboutTitle: language === 'es' ? 'La Historia de Beto Tours' : 'The History of Beto Tours',
    aboutP1: language === 'es' ? 'Mi nombre es Beto, y más que una agencia, esto es mi pasión. Llevo años recorriendo cada rincón de Medellín y sus alrededores para asegurarme de que cuando tú vengas, veas lo que nosotros amamos.' : 'My name is Beto, and more than an agency, this is my passion. I have spent years touring every corner of Medellín and its surroundings to ensure that when you come, you see what we love.',
    aboutP2: language === 'es' ? 'Nuestros tours no son solo transporte; son historias, son risas, es comida típica en los mejores lugares y es la calidez humana que solo los paisas sabemos dar.' : 'Our tours are not just transportation; they are stories, laughter, typical food in the best places, and the human warmth that only we Paisas know how to give.',
    stats1: language === 'es' ? 'Turistas Felices' : 'Happy Tourists',
    stats2: language === 'es' ? 'Paisa Orgulloso' : 'Proud Paisa',
    contactTitle: language === 'es' ? '¿Listo para la aventura?' : 'Ready for the adventure?',
    contactSub: language === 'es' ? 'No te compliques con formularios largos. Háblame directamente y cuadramos todo de una.' : 'Do not bother with long forms. Talk to me directly and we will set everything up at once.',
    contactBtn: language === 'es' ? 'WhatsApp Directo con Beto' : 'Direct WhatsApp with Beto',
    footerDesc: language === 'es' ? 'Tu puerta de entrada a la cultura Paisa. Experiencias diseñadas por locales para viajeros que buscan lo real.' : 'Your gateway to Paisa culture. Experiences designed by locals for travelers seeking the real thing.',
    footerNav: language === 'es' ? 'Navegación' : 'Navigation',
    footerSocial: language === 'es' ? 'Siguenos' : 'Follow us',
    modalReserveTitle: language === 'es' ? '¡Reserve sus cupos de una!' : 'Book your spots now!',
    howMany: language === 'es' ? '¿Cuántos parceros van? (incluyéndote)' : 'How many travel buddies are coming? (including you)',
    traveler: language === 'es' ? 'Viajero' : 'Traveler',
    fullName: language === 'es' ? 'Nombre y Apellido' : 'Full Name',
    docNum: language === 'es' ? 'Número de documento' : 'ID Number',
    reserveBtn: language === 'es' ? 'Reservar con Beto ahora' : 'Book with Beto now',
    directNotice: language === 'es' ? 'Todas las reservas son directas con Beto Tours para garantizarte el mejor precio.' : 'All bookings are direct with Beto Tours to guarantee the best price.',
    perPerson: language === 'es' ? 'por persona' : 'per person',
    includesLabel: language === 'es' ? '¿Qué incluye el parche?' : 'What\'s included in the plan?',
    highlightsLabel: language === 'es' ? '¡Lo que te espera, mijo!' : 'What awaits you, buddy!'
  };

  const renderHome = () => (
    <div className="animate-in fade-in duration-500">
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://i.ibb.co/cSPNgmLN/grok-video-3ef9328c-3171-4ff7-9c9c-095328da2d6e.gif" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Medellín Experiencia Beto Tours" 
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-black mb-4 font-paisa drop-shadow-2xl uppercase">{translations.heroTitle}</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-semibold drop-shadow-lg">{translations.heroSub}</p>
          <button onClick={() => setCurrentView('tours')} className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full font-bold transition-all shadow-2xl hover:scale-105 transform active:scale-95">
            {translations.heroBtn}
          </button>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900">{translations.featuredTitle}</h2>
            <p className="text-gray-600">{translations.featuredSub}</p>
          </div>
          <button onClick={() => setCurrentView('tours')} className="text-green-600 font-bold hover:underline">{translations.viewAll} <i className="fa-solid fa-arrow-right ml-1"></i></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOURS.slice(0, 3).map(tour => (
            <TourCard key={tour.id} tour={tour} onSelect={setSelectedTour} language={language} />
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="text-xl font-bold">{translations.safeTitle}</h3>
            <p className="text-gray-500 text-sm">{translations.safeDesc}</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-face-smile"></i>
            </div>
            <h3 className="text-xl font-bold">{translations.friendlyTitle}</h3>
            <p className="text-gray-500 text-sm">{translations.friendlyDesc}</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <h3 className="text-xl font-bold">{translations.localTitle}</h3>
            <p className="text-gray-500 text-sm">{translations.localDesc}</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderTours = () => (
    <div className="py-12 max-w-7xl mx-auto px-4 animate-in slide-in-from-right-10 duration-500">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">{translations.catalogTitle}</h1>
        <p className="text-gray-600 italic">{translations.catalogSub}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {TOURS.map(tour => (
          <TourCard key={tour.id} tour={tour} onSelect={setSelectedTour} language={language} />
        ))}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="py-12 max-w-7xl mx-auto px-4 animate-in slide-in-from-right-10 duration-500">
      <div className="flex flex-col lg:flex-row gap-16 items-center">
        <div className="lg:w-1/2">
          <img 
            src="https://i.ibb.co/JW8xbm4k/Whats-App-Image-2026-01-09-at-1-19-04-PM-4.jpg" 
            className="rounded-3xl shadow-2xl border-4 border-white" 
            alt="Beto Tours Team" 
          />
        </div>
        <div className="lg:w-1/2 space-y-6">
          <h1 className="text-4xl font-black text-gray-900 font-paisa text-green-700">{translations.aboutTitle}</h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            {translations.aboutP1}
          </p>
          <p className="text-gray-600">
            {translations.aboutP2}
          </p>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="bg-green-50 p-6 rounded-2xl">
              <span className="block text-3xl font-black text-green-600">5k+</span>
              <span className="text-sm text-gray-500">{translations.stats1}</span>
            </div>
            <div className="bg-yellow-50 p-6 rounded-2xl">
              <span className="block text-3xl font-black text-yellow-600">100%</span>
              <span className="text-sm text-gray-500">{translations.stats2}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="py-12 max-w-4xl mx-auto px-4 animate-in zoom-in duration-500 text-center">
      <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
        <h1 className="text-4xl font-black mb-4">{translations.contactTitle}</h1>
        <p className="text-gray-600 mb-10 text-lg">{translations.contactSub}</p>
        
        <div className="space-y-6">
          <a href="https://wa.me/573332482626" className="flex items-center justify-center space-x-4 bg-green-500 text-white py-4 px-8 rounded-2xl font-bold text-xl hover:bg-green-600 transition shadow-lg">
            <i className="fa-brands fa-whatsapp text-3xl"></i>
            <span>{translations.contactBtn}</span>
          </a>
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
            <div className="flex items-center space-x-3 text-gray-700">
              <i className="fa-solid fa-envelope text-green-600 text-xl"></i>
              <span>info@betotoursmedellin.com</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <i className="fa-solid fa-phone text-green-600 text-xl"></i>
              <span>+57 333 248 2626</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onNavigate={setCurrentView} currentView={currentView} language={language} onLanguageChange={setLanguage} />

      <main className="flex-grow pt-20">
        {currentView === 'home' && renderHome()}
        {currentView === 'tours' && renderTours()}
        {currentView === 'about' && renderAbout()}
        {currentView === 'contact' && renderContact()}
      </main>

      <footer className="bg-gray-900 text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img src="https://i.ibb.co/wNvw8VZp/Gemini-Generated-Image-12fj6q12fj6q12fj.jpg" className="h-12 w-12 rounded-lg" alt="Logo" />
              <span className="text-2xl font-paisa text-green-400 tracking-wider">Beto Tours</span>
            </div>
            <p className="text-gray-400 max-w-sm">{translations.footerDesc}</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-green-500">{translations.footerNav}</h4>
            <ul className="space-y-4 text-gray-400">
              <li><button onClick={() => setCurrentView('home')} className="hover:text-white transition">{language === 'es' ? 'Inicio' : 'Home'}</button></li>
              <li><button onClick={() => setCurrentView('tours')} className="hover:text-white transition">{language === 'es' ? 'Tours' : 'Tours'}</button></li>
              <li><button onClick={() => setCurrentView('about')} className="hover:text-white transition">{language === 'es' ? 'Nosotros' : 'About'}</button></li>
              <li><button onClick={() => setCurrentView('contact')} className="hover:text-white transition">{language === 'es' ? 'Contacto' : 'Contact'}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-green-500">{translations.footerSocial}</h4>
            <div className="flex space-x-4 text-2xl">
              <a href="#" className="hover:text-pink-500 transition"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="hover:text-blue-500 transition"><i className="fa-brands fa-facebook"></i></a>
              <a href="#" className="hover:text-white transition"><i className="fa-brands fa-tiktok"></i></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Detalles y Reserva con Visualización Completa */}
      {selectedTour && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setSelectedTour(null)}></div>
          
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-6xl h-auto min-h-screen sm:min-h-0 sm:max-h-[95vh] shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex flex-col lg:flex-row overflow-hidden my-auto">
            
            {/* Botón de Cerrar */}
            <button 
              onClick={() => setSelectedTour(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 text-gray-900 rounded-full flex items-center justify-center shadow-2xl border border-gray-100 z-[110] hover:bg-white active:scale-90 transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            
            {/* Panel Izquierdo: IMAGEN COMPLETA (object-contain) */}
            <div className="lg:w-1/2 h-[45vh] sm:h-[50vh] lg:h-auto overflow-hidden relative group bg-neutral-900 flex items-center justify-center">
              {selectedTour.gallery && selectedTour.gallery.length > 0 ? (
                <div className="h-full w-full relative">
                  <img 
                    src={selectedTour.gallery[currentImageIndex]} 
                    alt={`${selectedTour.title} - ${currentImageIndex + 1}`} 
                    className="w-full h-full object-contain transition-all duration-300" 
                  />
                  
                  {/* Navegación Galería */}
                  <button 
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? selectedTour.gallery!.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition"
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex((prev) => (prev === selectedTour.gallery!.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                    {selectedTour.gallery.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-green-500 w-8' : 'bg-white/40'}`}
                      ></button>
                    ))}
                  </div>
                </div>
              ) : (
                <img src={selectedTour.image} alt={selectedTour.title} className="w-full h-full object-contain" />
              )}
            </div>
            
            {/* Panel Derecho: INFO Y RESERVA */}
            <div className="lg:w-1/2 p-6 sm:p-10 overflow-y-auto bg-white flex flex-col custom-scrollbar">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b border-gray-100 pb-6">
                <div>
                  <span className="text-green-600 font-bold text-xs tracking-[0.2em] uppercase mb-1 block">
                    {language === 'es' ? selectedTour.category : selectedTour.category}
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                    {language === 'es' ? selectedTour.title : selectedTour.titleEn}
                  </h3>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col items-end">
                  <div className="text-3xl font-black text-green-700">{selectedTour.price}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase">{translations.perPerson}</div>
                </div>
              </div>

              {/* DESCRIPCIÓN EN MODO LISTA (Highlights) */}
              <div className="mb-8">
                <h4 className="font-black text-gray-900 mb-6 flex items-center text-xl">
                   <i className="fa-solid fa-star mr-2 text-yellow-500"></i>
                   {translations.highlightsLabel}
                </h4>
                <div className="space-y-4">
                  {(language === 'es' ? selectedTour.highlights : selectedTour.highlightsEn).map((h, i) => (
                    <div key={i} className="flex items-start bg-gray-50 p-4 rounded-2xl border-l-4 border-green-500 shadow-sm">
                      <i className="fa-solid fa-bolt text-yellow-500 mt-1 mr-3 flex-shrink-0"></i>
                      <p className="text-gray-700 font-medium leading-relaxed">{h}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* INCLUSIONES */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                  <i className="fa-solid fa-circle-check mr-2 text-green-600"></i>
                  {translations.includesLabel}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(language === 'es' ? selectedTour.includes : selectedTour.includesEn).map((item, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <i className="fa-solid fa-check text-green-500 mr-2 flex-shrink-0"></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE DE RESERVA */}
              <div className="mt-auto p-6 bg-green-50 rounded-[2rem] border-2 border-green-100 shadow-inner">
                <h4 className="font-black text-gray-900 mb-6 text-center text-lg uppercase tracking-wider">
                  {translations.modalReserveTitle}
                </h4>
                
                <div className="flex items-center justify-between mb-8">
                  <label className="text-sm font-bold text-gray-700 max-w-[150px]">{translations.howMany}</label>
                  <div className="flex items-center space-x-6 bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                    <button 
                      onClick={() => handleNumPeopleChange(numPeople - 1)}
                      className="w-10 h-10 text-gray-600 hover:text-green-600 transition flex items-center justify-center"
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <span className="text-2xl font-black text-gray-800">{numPeople}</span>
                    <button 
                      onClick={() => handleNumPeopleChange(numPeople + 1)}
                      className="w-10 h-10 text-gray-600 hover:text-green-600 transition flex items-center justify-center"
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {participants.map((p, idx) => (
                    <div key={idx} className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-[10px] font-black text-green-600 mb-3 uppercase tracking-widest">{translations.traveler} #{idx + 1}</p>
                      <div className="grid grid-cols-1 gap-4">
                        <input 
                          type="text" 
                          placeholder={translations.fullName}
                          value={p.fullName}
                          onChange={(e) => handleParticipantChange(idx, 'fullName', e.target.value)}
                          className="w-full px-5 py-3 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select 
                            value={p.docType}
                            onChange={(e) => handleParticipantChange(idx, 'docType', e.target.value)}
                            className="w-full px-5 py-3 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition appearance-none"
                          >
                            <option value="CC">Cédula</option>
                            <option value="TI">Tarjeta Identidad</option>
                            <option value="CE">Cédula Extranjería</option>
                            <option value="PS">Pasaporte</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder={translations.docNum}
                            value={p.docNumber}
                            onChange={(e) => handleParticipantChange(idx, 'docNumber', e.target.value)}
                            className="w-full px-5 py-3 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleBooking(selectedTour)}
                  className="w-full py-5 bg-green-600 text-white text-xl font-black rounded-3xl hover:bg-green-700 active:scale-[0.98] transition shadow-xl flex items-center justify-center gap-3"
                >
                  <i className="fa-brands fa-whatsapp text-3xl"></i>
                  {translations.reserveBtn}
                </button>
                <p className="mt-4 text-gray-400 text-[10px] text-center font-medium italic">
                  {translations.directNotice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatWidget language={language} />
    </div>
  );
};

export default App;
