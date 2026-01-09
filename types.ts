
export interface Tour {
  id: string;
  title: string;
  titleEn: string;
  price: string;
  image: string;
  description: string;
  descriptionEn: string;
  highlights: string[];
  highlightsEn: string[];
  includes: string[];
  includesEn: string[];
  duration: string;
  durationEn: string;
  category: 'History' | 'Nature' | 'Culture' | 'Adventure';
  gallery?: string[];
}

export interface Booking {
  tourId: string;
  name: string;
  email: string;
  date: string;
  passengers: number;
}
