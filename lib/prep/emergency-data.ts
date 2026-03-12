// =============================================================================
// ROAM — Emergency Toolkit Data
// Real emergency numbers, embassy info, and safety data for top destinations
// =============================================================================

export interface EmergencyData {
  country: string;
  flag: string;
  destinations: string[];
  police: string;
  ambulance: string;
  fire: string;
  usEmbassy: { city: string; phone: string; address: string };
  hospitals: Array<{ name: string; area: string; note: string }>;
  tips: string[];
}

export const EMERGENCY_DATA: EmergencyData[] = [
  {
    country: 'Japan',
    flag: '\uD83C\uDDEF\uD83C\uDDF5',
    destinations: ['Tokyo', 'Kyoto', 'Osaka'],
    police: '110',
    ambulance: '119',
    fire: '119',
    usEmbassy: { city: 'Tokyo', phone: '+81-3-3224-5000', address: '1-10-5 Akasaka, Minato-ku' },
    hospitals: [
      { name: 'St. Luke\'s International', area: 'Tsukiji', note: 'English-speaking staff' },
      { name: 'Tokyo Medical University', area: 'Shinjuku', note: '24hr emergency' },
    ],
    tips: ['Japan is extremely safe — lowest crime rate in the world', 'Pharmacies (drugstores) have OTC medicine; look for the green cross', 'Download Google Translate offline Japanese before you go'],
  },
  {
    country: 'Thailand',
    flag: '\uD83C\uDDF9\uD83C\uDDED',
    destinations: ['Bangkok', 'Chiang Mai'],
    police: '191',
    ambulance: '1669',
    fire: '199',
    usEmbassy: { city: 'Bangkok', phone: '+66-2-205-4000', address: '95 Wireless Road, Pathum Wan' },
    hospitals: [
      { name: 'Bumrungrad International', area: 'Sukhumvit', note: 'World-class, English-speaking' },
      { name: 'Bangkok Hospital', area: 'Soi Soonvijai', note: '24hr emergency, accepts intl insurance' },
    ],
    tips: ['Tourist police: 1155 (English-speaking)', 'Medical care is excellent and affordable', 'Beware of tuk-tuk gem store scams — politely decline'],
  },
  {
    country: 'Spain',
    flag: '\uD83C\uDDEA\uD83C\uDDF8',
    destinations: ['Barcelona'],
    police: '112',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Madrid', phone: '+34-91-587-2200', address: 'Calle de Serrano, 75' },
    hospitals: [
      { name: 'Hospital Clínic', area: 'Eixample', note: 'Top public hospital' },
      { name: 'Centro Médico Teknon', area: 'Sarrià', note: 'Private, English-speaking' },
    ],
    tips: ['112 works for all emergencies across Europe', 'Pickpocketing on Las Ramblas — keep valuables in front pockets', 'EU Health Insurance Card (EHIC) works for EU citizens'],
  },
  {
    country: 'Italy',
    flag: '\uD83C\uDDEE\uD83C\uDDF9',
    destinations: ['Rome', 'Florence', 'Amalfi Coast'],
    police: '112',
    ambulance: '118',
    fire: '115',
    usEmbassy: { city: 'Rome', phone: '+39-06-4674-1', address: 'Via Vittorio Veneto, 121' },
    hospitals: [
      { name: 'Policlinico Gemelli', area: 'Near Vatican', note: 'Major teaching hospital' },
      { name: 'Rome American Hospital', area: 'Via Longoni', note: 'English-speaking staff' },
    ],
    tips: ['112 is the universal EU emergency number', 'Pharmacies (green cross sign) can help with minor issues', 'Keep photocopies of your passport separate from the original'],
  },
  {
    country: 'France',
    flag: '\uD83C\uDDEB\uD83C\uDDF7',
    destinations: ['Paris'],
    police: '17',
    ambulance: '15',
    fire: '18',
    usEmbassy: { city: 'Paris', phone: '+33-1-43-12-22-22', address: '2 Avenue Gabriel, 75008' },
    hospitals: [
      { name: 'Hôpital Américain', area: 'Neuilly-sur-Seine', note: 'English-speaking, private' },
      { name: 'Hôtel-Dieu', area: 'Île de la Cité', note: 'Central Paris, public ER' },
    ],
    tips: ['112 also works as universal EU emergency', 'SOS Médecins (house calls): 01 47 07 77 77', 'Metro is safe but watch for pickpockets at tourist stations'],
  },
  {
    country: 'Indonesia',
    flag: '\uD83C\uDDEE\uD83C\uDDE9',
    destinations: ['Bali'],
    police: '110',
    ambulance: '118',
    fire: '113',
    usEmbassy: { city: 'Jakarta (Consulate: Bali)', phone: '+62-361-233-605', address: 'Jl. Hayam Wuruk 310, Denpasar' },
    hospitals: [
      { name: 'BIMC Hospital', area: 'Kuta', note: '24hr, international standard' },
      { name: 'Siloam Hospital', area: 'Kuta', note: 'Modern facility, English staff' },
    ],
    tips: ['Get travel insurance — medical evacuation to Singapore/Australia can cost $50K+', 'Drink only bottled water, avoid ice at street stalls', 'Monkeys at temples WILL grab your stuff — remove sunglasses and jewelry'],
  },
  {
    country: 'Morocco',
    flag: '\uD83C\uDDF2\uD83C\uDDE6',
    destinations: ['Marrakech'],
    police: '19',
    ambulance: '15',
    fire: '15',
    usEmbassy: { city: 'Rabat (Consulate: Casablanca)', phone: '+212-522-264-550', address: '8 Boulevard Moulay Youssef, Casablanca' },
    hospitals: [
      { name: 'Clinique Internationale', area: 'Guéliz', note: 'Private, French/English speaking' },
    ],
    tips: ['Tourist police in Jemaa el-Fnaa can help with scams', 'Negotiate taxi fares before getting in — no meters in Marrakech', 'Avoid "helpful" strangers who offer to guide you to your riad'],
  },
  {
    country: 'Portugal',
    flag: '\uD83C\uDDF5\uD83C\uDDF9',
    destinations: ['Lisbon'],
    police: '112',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Lisbon', phone: '+351-21-727-3300', address: 'Avenida das Forças Armadas, 1600-081' },
    hospitals: [
      { name: 'Hospital de Santa Maria', area: 'Campo Grande', note: 'Largest public hospital' },
      { name: 'CUF Descobertas', area: 'Parque das Nações', note: 'Private, English-speaking' },
    ],
    tips: ['Lisbon is very safe but watch for pickpockets on Tram 28', '112 works for all emergencies (EU standard)', 'Pharmacies are marked with a green cross — many staff speak English'],
  },
  {
    country: 'Iceland',
    flag: '\uD83C\uDDEE\uD83C\uDDF8',
    destinations: ['Reykjavik'],
    police: '112',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Reykjavik', phone: '+354-595-2200', address: 'Engjateigur 7, 105 Reykjavik' },
    hospitals: [
      { name: 'Landspítali University Hospital', area: 'Reykjavik', note: 'Main hospital, English widely spoken' },
    ],
    tips: ['Iceland is one of the safest countries in the world', 'Weather is the main danger — check vedur.is before any outdoor activity', 'Never cross roped-off areas at geysers or waterfalls — burns and falls are real'],
  },
  {
    country: 'South Africa',
    flag: '\uD83C\uDDFF\uD83C\uDDE6',
    destinations: ['Cape Town'],
    police: '10111',
    ambulance: '10177',
    fire: '10177',
    usEmbassy: { city: 'Cape Town (Consulate)', phone: '+27-21-702-7300', address: '2 Reddam Ave, Tokai' },
    hospitals: [
      { name: 'Netcare Christiaan Barnard', area: 'City Centre', note: 'Top private hospital' },
      { name: 'Groote Schuur Hospital', area: 'Observatory', note: 'Public, historic teaching hospital' },
    ],
    tips: ['Use Uber instead of random taxis', 'Don\'t flash expensive electronics in public', 'Avoid walking alone in the CBD after dark — stick to V&A Waterfront area'],
  },
];

/** Find emergency data for a destination */
export function getEmergencyForDestination(destination: string): EmergencyData | null {
  return EMERGENCY_DATA.find((data) =>
    data.destinations.some((d) => destination.toLowerCase().includes(d.toLowerCase()))
  ) ?? null;
}
