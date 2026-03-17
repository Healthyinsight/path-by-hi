export interface Race {
  name: string;
  date: string; // ISO: YYYY-MM-DD
  distance: string;
  type: 'triathlon' | 'running' | 'swimming' | 'cycling' | 'other';
  location: string;
}

export const RACES_2026: Race[] = [
  // RUNNING
  { name: 'adidas Premiärmilen', date: '2026-03-28', distance: '10 km', type: 'running', location: 'Stockholm' },
  { name: 'Göteborgsvarvet', date: '2026-05-23', distance: '21.1 km', type: 'running', location: 'Göteborg' },
  { name: 'adidas Stockholm Marathon', date: '2026-05-30', distance: '42.2 km', type: 'running', location: 'Stockholm' },
  { name: 'Midnight Run Stockholm', date: '2026-06-12', distance: '10 km', type: 'running', location: 'Stockholm' },
  { name: 'adidas Stockholm Halvmarathon', date: '2026-08-29', distance: '21.1 km', type: 'running', location: 'Stockholm' },
  { name: 'Lidingöloppet 30', date: '2026-09-26', distance: '30 km', type: 'running', location: 'Lidingö' },
  { name: 'Lidingöloppet 15', date: '2026-09-26', distance: '15 km', type: 'running', location: 'Lidingö' },
  { name: 'Tjurruset', date: '2026-05-30', distance: '15 km trail', type: 'running', location: 'Nacka' },
  { name: 'Ultravasan 90', date: '2026-08-22', distance: '90 km', type: 'running', location: 'Dalarna' },
  { name: 'Ultravasan 45', date: '2026-08-22', distance: '45 km', type: 'running', location: 'Dalarna' },

  // TRIATHLON
  { name: 'IRONMAN 70.3 Jönköping', date: '2026-07-05', distance: '70.3 mi', type: 'triathlon', location: 'Jönköping' },
  { name: 'IRONMAN Kalmar', date: '2026-08-15', distance: '140.6 mi', type: 'triathlon', location: 'Kalmar' },
  { name: 'Stockholmstriatlon', date: '2026-08-01', distance: 'Olympic', type: 'triathlon', location: 'Stockholm' },
  { name: 'Tjörn Triathlon', date: '2026-07-18', distance: 'Olympic', type: 'triathlon', location: 'Tjörn' },

  // SWIMMING
  { name: 'Vansbrosimningen', date: '2026-07-04', distance: '3 km', type: 'swimming', location: 'Vansbro' },
  { name: 'Vansbro Triathlon Olympisk', date: '2026-06-27', distance: 'Olympic', type: 'triathlon', location: 'Vansbro' },

  // CYCLING
  { name: 'MTB-Vättern 25/50 km', date: '2026-06-05', distance: '25/50 km', type: 'cycling', location: 'Motala' },
  { name: 'Vätternrundan 100 km', date: '2026-06-06', distance: '100 km', type: 'cycling', location: 'Motala' },
  { name: 'Vätternrundan 315 km', date: '2026-06-12', distance: '315 km', type: 'cycling', location: 'Motala' },
  { name: 'Cykelvasan Öppet Spår', date: '2026-08-07', distance: '95 km MTB', type: 'cycling', location: 'Dalarna' },
  { name: 'Cykelvasan 90', date: '2026-08-08', distance: '95 km MTB', type: 'cycling', location: 'Dalarna' },

  // OCR & OTHER
  { name: 'Tough Viking Stockholm', date: '2026-09-05', distance: '~15 km OCR', type: 'other', location: 'Stockholm' },
  { name: 'Tough Viking Göteborg', date: '2026-05-23', distance: '~15 km OCR', type: 'other', location: 'Göteborg' },
  { name: 'Spartan Race Stockholm', date: '2026-06-20', distance: '5–21 km', type: 'other', location: 'Stockholm' },
];

// Structure prepared to be replaced with API-backed calendar in the future.

