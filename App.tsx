import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.tsx';
import TourCard from './components/TourCard.tsx';
import ChatWidget from './components/ChatWidget.tsx';
import { TOURS } from './data/tours.ts';
import { Tour } from './types.ts';

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

  useEffect(() => {
    setNumPeople(1);
    setParticipants([{ fullName: '', docType: 'CC', docNumber: '' }]);
    setCurrentImageIndex(0);
  }, [selectedTour]);

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
      alert(language === 'es' ? "¡Eh ave maría! Por favor llene los datos de todos los parceros." : "Oh boy! Please fill in the details for everyone.");
      return;
    }

    let passengersText = participants.map((p, i) => 
      `Persona ${i + 1}: ${p.fullName} - ${p.docType}: ${p.docNumber}`
    ).join('\n');

    const tourTitle = language === 'es' ? tour.title : tour.titleEn;
    const message = language === 'es' 
      ? `¡Hola Beto! 👋\n\nMe interesa el tour: *${tourTitle}*.\n\nSomos *${numPeople}* persona(s):\n${passengersText}\n\n¿Tienen disponibilidad?`
      : `Hi Beto! 👋\n\nI'm interested in: *${tourTitle}*.\n\nWe are *${numPeople}* person(s):\n${passengersText}\n\nAvailability?`;
    
    window.open(`https://wa.me/573332482626?text=${encodeURIComponent(message)}`, '_blank');
  };

  const translations = {
    heroTitle: language === 'es' ? '¡MEDELLÍN TE ESPERA, PARCE!' : 'MEDELLÍN IS WAITING FOR YOU, BUDDY!',
    heroSub: language === 'es' ? 'La experiencia más auténtica con guías locales de verdad.' : 'The most authentic experience with real local guides.',
    heroBtn: language === 'es' ? 'Ver Todos los Planes' : 'See All Plans',
    featuredTitle: language === 'es' ? 'Planes Destacados' : 'Featured Plans',
    featuredSub: language === 'es' ? 'Lo que todo el mundo quiere conocer.' : 'What everyone wants to explore.',
    viewAll: language === 'es' ? 'Ver todos' : 'View all',
    safeTitle: language === 'es' ? '100% Seguro' : '100% Safe',
    safeDesc: language === 'es' ? 'Seguros de ley y RNT al día.' : 'Full legal insurance and RNT.',
    friendlyTitle: language === 'es' ? 'Atención Paisa' : 'Paisa Friendly',
    friendlyDesc: language === 'es' ? 'Beto y su equipo te dan la bienvenida.' : 'Beto and his team welcome you.',
    localTitle: language === 'es' ? 'Guías Locales' : 'Local Guides',
    localDesc: language === 'es' ? 'La historia real de nuestra tierra.' : 'The real history of our land.',
    catalogTitle: language === 'es' ? 'Nuestras Aventuras' : 'Our Adventures',
    catalogSub: language === 'es' ? '"Pura sabrosura antioqueña"' : '"Pure Antioquian flavor"',
    aboutTitle: language === 'es' ? 'Quién es Beto' : 'Who is Beto',
    aboutP1: language === 'es' ? 'Beto es más que un guía, es un parcero enamorado de Medellín.' : 'Beto is more than a guide, he is a buddy in love with Medellin.',
    contactTitle: language === 'es' ? '¡Escríbenos pues!' : 'Message us then!',
    contactSub: language === 'es' ? 'Estamos listos para planear tu viaje.' : 'Ready to help you plan your trip.',
    contactBtn: language === 'es' ? 'WhatsApp Directo' : 'Direct WhatsApp',
    reserveBtn: language === 'es' ? 'Reservar ahora' : 'Book now',
    howMany: language === 'es' ? '¿Cuántos vienen?' : 'How many are coming?',
    fullName: language === 'es' ? 'Nombre completo' : 'Full Name',
    docNum: language === 'es' ? 'Documento' : 'ID Number',
    perPerson: language === 'es' ? 'por persona' : 'per person',
    highlightsLabel: language === 'es' ? '¡Lo que te espera!' : 'What awaits you!',
    includesLabel: language === 'es' ? '¿Qué incluye?' : 'Includes',
    traveler: language === 'es' ? 'Viajero' : 'Traveler',
    modalReserveTitle: language === 'es' ? '¡Reserve ya!' : 'Book now!'
  };

  const renderHome = () => (
    <div className="animate-in fade-in duration-500">
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://i.ibb.co/cSPNgmLN/grok-video-3ef9328c-3171-4ff7-9c9c-095328da2d6e.gif" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Beto Tours" 
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-black mb-4 font-paisa drop-shadow-2xl">{translations.heroTitle}</h1>
          <p className="text-xl md:text-2xl mb-8 font-semibold drop-shadow-lg">{translations.heroSub}</p>
          <button onClick={() => setCurrentView('tours')} className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full font-bold transition shadow-2xl hover:scale-105">
            {translations.heroBtn}
          </button>
        </div>
      </section>
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-black mb-10">{translations.featuredTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOURS.slice(0, 3).map(tour => (
            <TourCard key={tour.id} tour={tour} onSelect={setSelectedTour} language={language} />
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={setCurrentView} currentView={currentView} language={language} onLanguageChange={setLanguage} />
      <main className="pt-20">
        {currentView === 'home' && renderHome()}
        {currentView === 'tours' && (
          <div className="py-12 max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-black mb-10">{translations.catalogTitle}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TOURS.map(tour => (
                <TourCard key={tour.id} tour={tour} onSelect={setSelectedTour} language={language} />
              ))}
            </div>
          </div>
        )}
        {currentView === 'about' && <div className="py-20 text-center"><h1>{translations.aboutTitle}</h1><p>{translations.aboutP1}</p></div>}
        {currentView === 'contact' && <div className="py-20 text-center"><h1>{translations.contactTitle}</h1><a href="https://wa.me/573332482626" className="bg-green-500 text-white p-4 rounded-xl mt-4 inline-block">{translations.contactBtn}</a></div>}
      </main>

      {selectedTour && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedTour(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row shadow-2xl">
            <button onClick={() => setSelectedTour(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">X</button>
            <div className="lg:w-1/2 h-64 lg:h-auto"><img src={selectedTour.image} className="w-full h-full object-cover" /></div>
            <div className="lg:w-1/2 p-8 overflow-y-auto custom-scrollbar">
              <h3 className="text-3xl font-black mb-2">{language === 'es' ? selectedTour.title : selectedTour.titleEn}</h3>
              <p className="text-2xl font-black text-green-600 mb-6">{selectedTour.price}</p>
              
              <div className="mb-6">
                <h4 className="font-bold mb-4">{translations.highlightsLabel}</h4>
                <div className="space-y-2">
                  {(language === 'es' ? selectedTour.highlights : selectedTour.highlightsEn).map((h, i) => (
                    <p key={i} className="text-gray-600 flex items-start"><i className="fa-solid fa-check text-green-500 mr-2 mt-1"></i>{h}</p>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <h4 className="font-bold mb-4 text-center">{translations.modalReserveTitle}</h4>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold">{translations.howMany}</span>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => handleNumPeopleChange(numPeople - 1)} className="w-8 h-8 border rounded-full">-</button>
                    <span className="font-bold">{numPeople}</span>
                    <button onClick={() => handleNumPeopleChange(numPeople + 1)} className="w-8 h-8 border rounded-full">+</button>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {participants.map((p, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border">
                      <input type="text" placeholder={translations.fullName} value={p.fullName} onChange={(e) => handleParticipantChange(idx, 'fullName', e.target.value)} className="w-full text-sm p-2 mb-2 border rounded" />
                      <input type="text" placeholder={translations.docNum} value={p.docNumber} onChange={(e) => handleParticipantChange(idx, 'docNumber', e.target.value)} className="w-full text-sm p-2 border rounded" />
                    </div>
                  ))}
                </div>
                <button onClick={() => handleBooking(selectedTour)} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                  <i className="fa-brands fa-whatsapp mr-2"></i>{translations.reserveBtn}
                </button>
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