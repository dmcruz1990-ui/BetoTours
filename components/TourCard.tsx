import React from 'react';
import { Tour } from '../types';

interface TourCardProps {
  tour: Tour;
  onSelect: (tour: Tour) => void;
  language: 'es' | 'en';
}

const TourCard: React.FC<TourCardProps> = ({ tour, onSelect, language }) => {
  const displayTitle = language === 'es' ? tour.title : tour.titleEn;
  const displayDesc = language === 'es' ? tour.description : tour.descriptionEn;
  const displayIncludes = language === 'es' ? tour.includes : tour.includesEn;
  
  const getCategoryLabel = () => {
    if (language === 'es') {
      return tour.category === 'Adventure' ? '¡Mucha Adrenalina!' : tour.category === 'Culture' ? 'Pura Cultura' : 'Historia Patria';
    } else {
      return tour.category === 'Adventure' ? 'High Adrenaline!' : tour.category === 'Culture' ? 'Pure Culture' : 'National History';
    }
  };

  const moreLabel = language === 'es' ? '...y mucho más' : '...and much more';
  const detailsBtnLabel = language === 'es' ? 'Ver detalles' : 'See details';

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 flex flex-col h-full border border-gray-100">
      <div className="relative h-80 overflow-hidden">
        <img 
          src={tour.image} 
          alt={displayTitle} 
          className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full shadow-lg">
          {tour.price}
        </div>
        <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
          {getCategoryLabel()}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition">{displayTitle}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{displayDesc}</p>
        
        <div className="space-y-2 mb-6 flex-grow">
          {displayIncludes.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center text-xs text-gray-500">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              {item}
            </div>
          ))}
          {displayIncludes.length > 3 && (
            <span className="text-xs text-green-600 font-semibold italic">{moreLabel}</span>
          )}
        </div>
        
        <button 
          onClick={() => onSelect(tour)}
          className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center group"
        >
          {detailsBtnLabel}
          <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  );
};

export default TourCard;