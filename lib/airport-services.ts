// =============================================================================
// ROAM — Airport Amenity Services Data
// Curated amenities for top international airports.
// Complements layover-data.ts (which covers city-side activities).
// =============================================================================

export type AirportServiceType =
  | 'lounge'
  | 'food'
  | 'shower'
  | 'sleep'
  | 'wifi'
  | 'pharmacy'
  | 'atm';

export interface AirportService {
  name: string;
  terminal: string;
  type: AirportServiceType;
  location: string;
  hours: string;
  priceRange: string;
  tip: string;
}

const AIRPORT_SERVICES: Record<string, readonly AirportService[]> = {
  NRT: [
    { name: 'IASS Executive Lounge', terminal: 'T1', type: 'lounge', location: 'Terminal 1, 4F, Central', hours: '7:00–21:00', priceRange: '$$', tip: 'Priority Pass accepted. Less crowded than ANA lounge during peak hours.' },
    { name: 'Narita Sky Lounge Wa', terminal: 'T1', type: 'lounge', location: 'Terminal 1, Satellite 3F', hours: '7:30–20:30', priceRange: '$$', tip: 'Japanese-style lounge with tatami seating and green tea service.' },
    { name: 'Ichiran Ramen', terminal: 'T1', type: 'food', location: 'Terminal 1, 4F, South Wing', hours: '8:00–20:00', priceRange: '$', tip: 'Same quality as the city locations. Get the extra-firm noodles.' },
    { name: 'Nine Hours Capsule Hotel', terminal: 'T2', type: 'sleep', location: 'Terminal 2, 2F, Transit Area', hours: '24 hours', priceRange: '$$', tip: 'Book by the hour. Showers included. Perfect for red-eye recovery.' },
    { name: 'Shower Rooms (JAL)', terminal: 'T2', type: 'shower', location: 'Terminal 2, 3F, Sakura Lounge', hours: '7:30–20:00', priceRange: '$$', tip: 'Available to JAL business class or lounge members only.' },
    { name: 'Tsuruha Drug', terminal: 'T1', type: 'pharmacy', location: 'Terminal 1, 1F, Arrivals', hours: '7:00–21:00', priceRange: '$', tip: 'Stock up on Japanese skincare and cold medicine before your flight.' },
    { name: 'Seven Bank ATM', terminal: 'T1', type: 'atm', location: 'Terminal 1, 1F, Central', hours: '24 hours', priceRange: 'Free', tip: 'Best foreign card acceptance. Withdraw yen here, not at exchange counters.' },
    { name: 'Free Wi-Fi (NRT)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: 'Connect to "FreeWiFi-NARITA". No registration needed, unlimited time.' },
  ],
  HND: [
    { name: 'TIAT Lounge', terminal: 'International', type: 'lounge', location: 'International Terminal, 4F, Gate 114', hours: '24 hours', priceRange: '$$', tip: 'Walk-in available. Shower rooms on-site. Good tarmac views.' },
    { name: 'Rokurinsha Tsukemen', terminal: 'International', type: 'food', location: 'International Terminal, 4F, Edo Koji', hours: '8:00–22:00', priceRange: '$', tip: 'Famous Tokyo tsukemen. Line moves fast. Worth the wait.' },
    { name: 'Royal Park Hotel Transit', terminal: 'International', type: 'sleep', location: 'International Terminal, 3F, Arrivals', hours: '24 hours', priceRange: '$$', tip: 'Day-use rooms by the hour. Cleanest airport hotel in Asia.' },
    { name: 'Shower Lounge', terminal: 'T1', type: 'shower', location: 'Terminal 1, 1F, South Wing', hours: '5:30–22:00', priceRange: '$', tip: 'Public showers with towel rental. Bring your own toiletries to save.' },
    { name: 'Free Wi-Fi (HND)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: 'Connect to "HANEDA-FREE-WIFI". Faster speeds in the international terminal.' },
    { name: 'Lawson Convenience Store', terminal: 'T2', type: 'food', location: 'Terminal 2, B1F', hours: '5:00–23:00', priceRange: '$', tip: 'Egg sandwiches and onigiri here rival many sit-down restaurants.' },
  ],
  CDG: [
    { name: 'iClub Lounge', terminal: 'T2E', type: 'lounge', location: 'Terminal 2E, Gate L, Mezzanine', hours: '6:00–23:00', priceRange: '$$', tip: 'Priority Pass accepted. Showers available. French wine selection is solid.' },
    { name: 'Air France Salon', terminal: 'T2F', type: 'lounge', location: 'Terminal 2F, Hall L, Level 3', hours: '5:30–22:00', priceRange: '$$', tip: 'Exceptional if your ticket qualifies. Champagne and charcuterie spread.' },
    { name: 'Ladur\u00e9e', terminal: 'T2E', type: 'food', location: 'Terminal 2E, Duty Free Area', hours: '6:30–21:30', priceRange: '$$', tip: 'Grab a box of macarons as gifts. Rose and pistachio are the classics.' },
    { name: 'Instant Paris Nap Room', terminal: 'T2E', type: 'sleep', location: 'Terminal 2E, Gate M, Level 1', hours: '24 hours', priceRange: '$$', tip: 'Soundproofed pods. Book ahead during summer rush. 2-hour minimum.' },
    { name: 'Pharmacie CDG', terminal: 'T2', type: 'pharmacy', location: 'Terminal 2E, Arrivals Level', hours: '7:00–21:00', priceRange: '$$', tip: 'French pharmacy brands at airport markup. Buy basics before security.' },
    { name: 'Free Wi-Fi (CDG)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: 'Select "WIFI-AIRPORT". Unlimited duration. Speeds drop in the afternoons.' },
    { name: 'Shower Point', terminal: 'T1', type: 'shower', location: 'Terminal 1, Satellite 5, Gate 46', hours: '6:00–22:00', priceRange: '$$', tip: 'Independent of lounges. Bring your own towel to save the rental fee.' },
  ],
  BKK: [
    { name: 'Miracle Lounge', terminal: 'Main', type: 'lounge', location: 'Concourse D, Level 3, Gate D1', hours: '24 hours', priceRange: '$$', tip: 'Multiple locations. Priority Pass accepted everywhere. D1 is quietest.' },
    { name: 'Thai Street Food Court', terminal: 'Main', type: 'food', location: 'Level 4, Magic Food Point', hours: '24 hours', priceRange: '$', tip: 'Real Thai food at real Thai prices. Pad krapao and mango sticky rice.' },
    { name: 'Boxtel Sleep Lounge', terminal: 'Main', type: 'sleep', location: 'Level 4, Zone A, near Gate A1', hours: '24 hours', priceRange: '$$', tip: 'Clean capsule pods. Book 3+ hours for real rest. Showers included.' },
    { name: 'King Power Duty Free Spa', terminal: 'Main', type: 'shower', location: 'Level 3, Concourse G', hours: '6:00–24:00', priceRange: '$', tip: 'Thai massage + shower combo. Best value spa in any airport.' },
    { name: 'Free Wi-Fi (BKK)', terminal: 'All', type: 'wifi', location: 'All concourses', hours: '24 hours', priceRange: 'Free', tip: 'Select "AIS SUPER WIFI". Register with passport number for unlimited.' },
    { name: 'Boots Pharmacy', terminal: 'Main', type: 'pharmacy', location: 'Level 3, Concourse C', hours: '6:00–24:00', priceRange: '$', tip: 'Tiger Balm and electrolyte packets are much cheaper here than at home.' },
    { name: 'Bangkok Bank ATM', terminal: 'Main', type: 'atm', location: 'Level 2, Arrivals Hall', hours: '24 hours', priceRange: 'Free', tip: 'Decline the ATM conversion rate. Let your bank do the exchange.' },
  ],
  FCO: [
    { name: 'Casa Alitalia Lounge', terminal: 'T1', type: 'lounge', location: 'Terminal 1, Gate B, Level 2', hours: '5:30–22:00', priceRange: '$$', tip: 'Now ITA Airways lounge. Espresso bar is excellent. Priority Pass at Plaza Premium.' },
    { name: 'Eataly', terminal: 'T1', type: 'food', location: 'Terminal 1, Departures Area E', hours: '6:00–21:30', priceRange: '$$', tip: 'Proper Italian food in an airport. The pasta fresca is made on-site.' },
    { name: 'HelloSky Sleep Pods', terminal: 'T3', type: 'sleep', location: 'Terminal 3, Area G', hours: '24 hours', priceRange: '$$', tip: 'Curved privacy pods. Good for 2-4 hour naps between connections.' },
    { name: 'Free Wi-Fi (FCO)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: 'Connect to "Airport Free Wi-Fi". Register once, valid for 4 hours.' },
    { name: 'Farmacia Terminal', terminal: 'T1', type: 'pharmacy', location: 'Terminal 1, Arrivals, Ground Floor', hours: '7:00–21:00', priceRange: '$$', tip: 'Stock up on Italian sunscreen and digestive aids before heading south.' },
    { name: 'Shower Service', terminal: 'T3', type: 'shower', location: 'Terminal 3, Transit Area, Level 2', hours: '6:00–22:00', priceRange: '$', tip: 'Basic but clean. Towel and soap kit included in the fee.' },
  ],
  LHR: [
    { name: 'Plaza Premium Lounge', terminal: 'T2', type: 'lounge', location: 'Terminal 2, Departures, Level 5', hours: '5:00–22:00', priceRange: '$$', tip: 'Priority Pass accepted. Arrive early — T2 lounges fill up on morning transatlantic.' },
    { name: 'Gordon Ramsay Plane Food', terminal: 'T5', type: 'food', location: 'Terminal 5, Departures', hours: '5:00–22:00', priceRange: '$$', tip: 'The full English breakfast is worth it before a long flight.' },
    { name: 'Harrods', terminal: 'T5', type: 'food', location: 'Terminal 5, Departures', hours: '5:30–21:30', priceRange: '$$$', tip: 'Pick up tea and biscuit tins. Better prices than the Knightsbridge store.' },
    { name: 'Yotel Air', terminal: 'T4', type: 'sleep', location: 'Terminal 4, Departures, After Security', hours: '24 hours', priceRange: '$$', tip: 'Cabins bookable by the hour. Monsoon shower included. Great for layovers.' },
    { name: 'Shower Facilities', terminal: 'T5', type: 'shower', location: 'Terminal 5, Galleries Lounge B', hours: '5:00–22:00', priceRange: '$$', tip: 'BA lounge access needed, or pay at Plaza Premium in T2 for showers.' },
    { name: 'Boots Pharmacy', terminal: 'T5', type: 'pharmacy', location: 'Terminal 5, Departures', hours: '5:30–21:00', priceRange: '$', tip: 'Meal deal here is the best value food in Heathrow. Seriously.' },
    { name: 'Free Wi-Fi (LHR)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: 'Select "_Heathrow Wi-Fi". Register with email. Unlimited and decent speed.' },
  ],
  ICN: [
    { name: 'SkyHub Lounge', terminal: 'T1', type: 'lounge', location: 'Terminal 1, 4F, East Wing, Gate 11', hours: '7:00–22:00', priceRange: '$$', tip: 'Priority Pass accepted. Korean buffet with bibimbap and kimchi jjigae.' },
    { name: 'Korean Air Prestige Lounge', terminal: 'T2', type: 'lounge', location: 'Terminal 2, 4F, Concourse A', hours: '6:00–22:00', priceRange: '$$', tip: 'Full Korean buffet. Worth arriving early for the japchae and galbi.' },
    { name: 'Spa on Air', terminal: 'T1', type: 'shower', location: 'Terminal 1, B1F, East Wing', hours: '24 hours', priceRange: '$', tip: 'Full jjimjilbang experience. Saunas, showers, sleeping mats. Open 24/7.' },
    { name: 'Nap Zone', terminal: 'T1', type: 'sleep', location: 'Terminal 1, 4F, Gate 42 area', hours: '24 hours', priceRange: 'Free', tip: 'Free reclining chairs in quiet zones. Bring an eye mask and earplugs.' },
    { name: 'Korean Food Court', terminal: 'T1', type: 'food', location: 'Terminal 1, 4F, Center', hours: '6:00–21:30', priceRange: '$', tip: 'Airport bibimbap that rivals the city. Tteokbokki stall is the move.' },
    { name: 'Free Wi-Fi (ICN)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: '"AirportWiFi" is fast and unlimited. Phone charging stations at every gate.' },
    { name: 'Pharmacy Olive Young', terminal: 'T1', type: 'pharmacy', location: 'Terminal 1, 3F, Departures', hours: '7:00–21:00', priceRange: '$', tip: 'Korean beauty products at airport prices. Sheet masks for the flight.' },
    { name: 'Hana Bank ATM', terminal: 'T1', type: 'atm', location: 'Terminal 1, 1F, Arrivals', hours: '24 hours', priceRange: 'Free', tip: 'Withdraw KRW here. Skip the exchange booths — ATM rate is always better.' },
  ],
  JFK: [
    { name: 'Centurion Lounge', terminal: 'T4', type: 'lounge', location: 'Terminal 4, Level 2, near Gate B22', hours: '6:00–23:00', priceRange: '$$', tip: 'The gold standard. Amex Platinum required. Arrive 30 min early to avoid waitlist.' },
    { name: 'TWA Hotel Sunken Lounge', terminal: 'T5', type: 'food', location: 'Terminal 5, TWA Hotel Lobby', hours: '7:00–24:00', priceRange: '$$', tip: 'No hotel reservation needed. The retro cocktail bar is worth the walk from any terminal.' },
    { name: 'Shake Shack', terminal: 'T4', type: 'food', location: 'Terminal 4, Retail Hall, Level 3', hours: '6:00–22:00', priceRange: '$', tip: 'The ShackBurger here hits different after an international flight.' },
    { name: 'TWA Hotel Rooftop Pool', terminal: 'T5', type: 'shower', location: 'Terminal 5, TWA Hotel, Rooftop', hours: '10:00–20:00 (seasonal)', priceRange: '$$', tip: 'Day pass gets pool + locker room access. Watch planes land while you swim.' },
    { name: 'Minute Suites', terminal: 'T4', type: 'sleep', location: 'Terminal 4, near Gate B37', hours: '24 hours', priceRange: '$$', tip: 'Private suites with daybed. Book by the hour. Noise machine included.' },
    { name: 'Free Wi-Fi (JFK)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: '"_Free JFK WiFi". Speeds vary by terminal. T4 is fastest.' },
    { name: 'Hudson News Pharmacy', terminal: 'T4', type: 'pharmacy', location: 'Terminal 4, Arrivals Level', hours: '5:00–23:00', priceRange: '$$', tip: 'Limited selection. If you need prescriptions, fill them before arriving.' },
  ],
  LAX: [
    { name: 'Star Alliance Lounge', terminal: 'TBIT', type: 'lounge', location: 'Tom Bradley International, Level 6', hours: '6:00–24:00', priceRange: '$$', tip: 'One of the best in LAX. Priority Pass does NOT work here — airline ticket required.' },
    { name: 'In-N-Out Burger (nearby)', terminal: 'Off-site', type: 'food', location: 'Sepulveda Blvd, 5 min drive from terminals', hours: '10:30–1:00', priceRange: '$', tip: 'Not in the airport but worth the Uber. Watch planes land while eating animal style.' },
    { name: 'Urth Caff\u00e9', terminal: 'T7', type: 'food', location: 'Terminal 7, past security', hours: '5:30–21:00', priceRange: '$$', tip: 'Best coffee in LAX. The Spanish latte is the move.' },
    { name: 'Minute Suites', terminal: 'TBIT', type: 'sleep', location: 'Tom Bradley International, Upper Level', hours: '24 hours', priceRange: '$$', tip: 'Private rooms with daybed and workstation. Book ahead for redeye prep.' },
    { name: 'Be Relax Spa', terminal: 'T2', type: 'shower', location: 'Terminal 2, past security', hours: '6:00–22:00', priceRange: '$$', tip: 'Shower + massage combo available. Book at the counter, no app needed.' },
    { name: 'Free Wi-Fi (LAX)', terminal: 'All', type: 'wifi', location: 'All terminals', hours: '24 hours', priceRange: 'Free', tip: '"_Free LAX WiFi". Expect slow speeds in TBIT during afternoon rushes.' },
    { name: 'CVS Pharmacy', terminal: 'T4', type: 'pharmacy', location: 'Terminal 4, pre-security', hours: '6:00–22:00', priceRange: '$', tip: 'Full pharmacy before security. Last chance for meds and toiletries.' },
  ],
  SIN: [
    { name: 'SATS Premier Lounge', terminal: 'T2', type: 'lounge', location: 'Terminal 2, Level 3, Gate F51', hours: '24 hours', priceRange: '$$', tip: 'Priority Pass accepted. Rarely crowded. Good laksa and kaya toast.' },
    { name: 'Jewel Changi Food Hall', terminal: 'Jewel', type: 'food', location: 'Jewel Changi, Basement 2', hours: '10:00–22:00', priceRange: '$', tip: 'Accessible from T1 without clearing immigration. A&W and Shake Shack are here.' },
    { name: 'Butterfly Garden', terminal: 'T3', type: 'food', location: 'Terminal 3, Level 2, Departure Hall', hours: '24 hours', priceRange: 'Free', tip: 'Free tropical butterfly enclosure. Over 1,000 butterflies. Best after dawn.' },
    { name: 'Aerotel Transit Hotel', terminal: 'T1', type: 'sleep', location: 'Terminal 1, Level 3, Transit Area', hours: '24 hours', priceRange: '$$', tip: 'Rooftop pool + rooms. Book by the 6-hour block. Pool is free for guests.' },
    { name: 'Swimming Pool & Jacuzzi', terminal: 'T1', type: 'shower', location: 'Terminal 1, Rooftop, Level 3', hours: '6:00–24:00', priceRange: '$', tip: 'Open to all passengers for a small fee. Towels provided. Bring swimwear.' },
    { name: 'Free Wi-Fi (SIN)', terminal: 'All', type: 'wifi', location: 'All terminals + Jewel', hours: '24 hours', priceRange: 'Free', tip: '"#WiFi@Changi". Unlimited, fast, no registration. Best airport Wi-Fi globally.' },
    { name: 'Guardian Pharmacy', terminal: 'T2', type: 'pharmacy', location: 'Terminal 2, Level 2, Transit Area', hours: '24 hours', priceRange: '$', tip: 'Tiger Balm, hydration salts, and local remedies at reasonable prices.' },
    { name: 'DBS ATM', terminal: 'T3', type: 'atm', location: 'Terminal 3, Arrivals Hall', hours: '24 hours', priceRange: 'Free', tip: 'Withdraw SGD here. DBS and OCBC ATMs have the best foreign card rates.' },
  ],
} as const;

/**
 * Get all airport services for a given airport code.
 */
export function getAirportServices(airportCode: string): readonly AirportService[] {
  return AIRPORT_SERVICES[airportCode.toUpperCase()] ?? [];
}

/**
 * Get airport services filtered by type.
 */
export function getAirportServicesByType(
  airportCode: string,
  type: AirportServiceType,
): readonly AirportService[] {
  const services = getAirportServices(airportCode);
  return services.filter((s) => s.type === type);
}

/**
 * Get airport services filtered by terminal.
 */
export function getAirportServicesByTerminal(
  airportCode: string,
  terminal: string,
): readonly AirportService[] {
  const services = getAirportServices(airportCode);
  return services.filter((s) => s.terminal === terminal);
}

/**
 * Get all airport codes that have service data.
 */
export function getSupportedServiceAirports(): string[] {
  return Object.keys(AIRPORT_SERVICES);
}

/**
 * Check if an airport has service data.
 */
export function hasAirportServices(airportCode: string): boolean {
  return airportCode.toUpperCase() in AIRPORT_SERVICES;
}
