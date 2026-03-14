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
  // --- Additional destinations ---
  {
    country: 'South Korea',
    flag: '\uD83C\uDDF0\uD83C\uDDF7',
    destinations: ['Seoul'],
    police: '112',
    ambulance: '119',
    fire: '119',
    usEmbassy: { city: 'Seoul', phone: '+82-2-397-4114', address: '188 Sejong-daero, Jongno-gu' },
    hospitals: [
      { name: 'Samsung Medical Center', area: 'Gangnam', note: 'International clinic, English-speaking' },
      { name: 'Severance Hospital (Yonsei)', area: 'Sinchon', note: '24hr emergency, top-tier' },
    ],
    tips: ['Korea has excellent emergency response — ambulances arrive fast', 'Download Papago for Korean translation', 'T-money card works on all public transport and some taxis'],
  },
  {
    country: 'Argentina',
    flag: '\uD83C\uDDE6\uD83C\uDDF7',
    destinations: ['Buenos Aires'],
    police: '911',
    ambulance: '107',
    fire: '100',
    usEmbassy: { city: 'Buenos Aires', phone: '+54-11-5777-4533', address: 'Av. Colombia 4300, Palermo' },
    hospitals: [
      { name: 'Hospital Alemán', area: 'Recoleta', note: 'Private, English-speaking doctors' },
      { name: 'Hospital Británico', area: 'Barracas', note: 'Well-regarded, some English' },
    ],
    tips: ['Use Uber or Cabify (safer than street taxis)', 'Keep phone out of sight on the street', 'Carry small bills — change is hard to get'],
  },
  {
    country: 'Turkey',
    flag: '\uD83C\uDDF9\uD83C\uDDF7',
    destinations: ['Istanbul'],
    police: '155',
    ambulance: '112',
    fire: '110',
    usEmbassy: { city: 'Istanbul (Consulate)', phone: '+90-212-335-9000', address: 'Istinye Mahallesi, 34460 Sarıyer' },
    hospitals: [
      { name: 'American Hospital', area: 'Nişantaşı', note: 'English-speaking, expat-friendly' },
      { name: 'Florence Nightingale Hospital', area: 'Şişli', note: 'International patient center' },
    ],
    tips: ['112 is the universal EU-style emergency number', 'Tourist police speak English', 'Avoid unofficial currency exchange — use banks or Wise'],
  },
  {
    country: 'Australia',
    flag: '\uD83C\uDDE6\uD83C\uDDFA',
    destinations: ['Sydney'],
    police: '000',
    ambulance: '000',
    fire: '000',
    usEmbassy: { city: 'Sydney (Consulate)', phone: '+61-2-9373-9200', address: 'Level 10, MLC Centre, 19-29 Martin Place' },
    hospitals: [
      { name: 'Royal Prince Alfred Hospital', area: 'Camperdown', note: 'Top teaching hospital, 24hr ER' },
      { name: 'St Vincent\'s Hospital', area: 'Darlinghurst', note: 'Near CBD, excellent trauma' },
    ],
    tips: ['Triple zero (000) for all emergencies', 'Public healthcare is excellent — Medicare reciprocal agreements', 'Be aware of rip currents — always swim between red and yellow flags'],
  },
  {
    country: 'Mexico',
    flag: '\uD83C\uDDF2\uD83C\uDDFD',
    destinations: ['Mexico City', 'Oaxaca'],
    police: '911',
    ambulance: '911',
    fire: '911',
    usEmbassy: { city: 'Mexico City', phone: '+52-55-5080-2000', address: 'Paseo de la Reforma 305, Cuauhtémoc' },
    hospitals: [
      { name: 'Hospital ABC', area: 'Santa Fe & Observatorio', note: 'Best private hospital, English-speaking' },
      { name: 'Hospital Ángeles', area: 'Pedregal', note: 'Private, international patient services' },
    ],
    tips: ['911 works nationwide — relatively new (since 2016)', 'Drink only bottled or filtered water', 'Use Uber or DiDi instead of street taxis'],
  },
  {
    country: 'UAE',
    flag: '\uD83C\uDDE6\uD83C\uDDEA',
    destinations: ['Dubai'],
    police: '999',
    ambulance: '998',
    fire: '997',
    usEmbassy: { city: 'Dubai (Consulate)', phone: '+971-4-309-4000', address: 'Corner of Al Seef Rd & Sheikh Khalifa bin Zayed Rd' },
    hospitals: [
      { name: 'Mediclinic City Hospital', area: 'Dubai Healthcare City', note: 'International standard, English' },
      { name: 'American Hospital Dubai', area: 'Oud Metha', note: 'Expat-friendly, JCI accredited' },
    ],
    tips: ['Zero tolerance for drugs — even trace amounts in blood', 'Respect local customs: modest dress in public areas', 'Medical care is excellent but expensive — ensure travel insurance'],
  },
  {
    country: 'Netherlands',
    flag: '\uD83C\uDDF3\uD83C\uDDF1',
    destinations: ['Amsterdam'],
    police: '112',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Amsterdam (Consulate)', phone: '+31-20-575-5309', address: 'Museumplein 19' },
    hospitals: [
      { name: 'OLVG Hospital', area: 'Oost', note: 'Closest to city center' },
      { name: 'Amsterdam UMC', area: 'Buitenveldert', note: 'University hospital, specialized care' },
    ],
    tips: ['112 for all emergencies across EU', 'Watch out for bikes — they have right of way everywhere', 'GGD (public health) handles non-emergency medical queries'],
  },
  {
    country: 'Colombia',
    flag: '\uD83C\uDDE8\uD83C\uDDF4',
    destinations: ['Medellín', 'Cartagena'],
    police: '123',
    ambulance: '123',
    fire: '119',
    usEmbassy: { city: 'Bogotá', phone: '+57-1-275-2000', address: 'Calle 24 Bis No. 48-50' },
    hospitals: [
      { name: 'Hospital Pablo Tobón Uribe', area: 'Medellín', note: 'Top-rated, some English' },
      { name: 'Clínica del Caribe', area: 'Cartagena', note: 'Private, tourist-friendly' },
    ],
    tips: ['123 is the national emergency line', 'Don\'t accept drinks from strangers — scopolamine drugging is real', 'Use apps (InDriver, Uber) instead of hailing taxis'],
  },
  {
    country: 'Georgia',
    flag: '\uD83C\uDDEC\uD83C\uDDEA',
    destinations: ['Tbilisi'],
    police: '112',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Tbilisi', phone: '+995-32-227-7000', address: '11 George Balanchine Street' },
    hospitals: [
      { name: 'Todua Clinic', area: 'Saburtalo', note: 'Modern private hospital' },
      { name: 'New Hospitals (Evex)', area: 'Multiple locations', note: 'Chain of private hospitals' },
    ],
    tips: ['Georgia is very safe for tourists — one of the lowest crime rates in Europe', '112 is the universal emergency number', 'Georgians are incredibly hospitable — ask anyone for help'],
  },
  {
    country: 'Vietnam',
    flag: '\uD83C\uDDFB\uD83C\uDDF3',
    destinations: ['Hoi An'],
    police: '113',
    ambulance: '115',
    fire: '114',
    usEmbassy: { city: 'Hanoi', phone: '+84-24-3850-5000', address: '7 Lang Ha, Ba Dinh District' },
    hospitals: [
      { name: 'Hoi An Hospital', area: 'Hoi An', note: 'Basic — for serious issues go to Da Nang' },
      { name: 'Vinmec Da Nang', area: 'Da Nang (30 min away)', note: 'International standard, English' },
    ],
    tips: ['For serious medical issues, get to Da Nang (30 min from Hoi An)', 'Traffic is the #1 danger — look both ways constantly', 'Download offline Vietnamese on Google Translate'],
  },
  {
    country: 'India',
    flag: '\uD83C\uDDEE\uD83C\uDDF3',
    destinations: ['Jaipur'],
    police: '100',
    ambulance: '102',
    fire: '101',
    usEmbassy: { city: 'New Delhi', phone: '+91-11-2419-8000', address: 'Shantipath, Chanakyapuri' },
    hospitals: [
      { name: 'Fortis Escorts Hospital', area: 'Malviya Nagar', note: 'International patient wing' },
      { name: 'Narayana Multispeciality Hospital', area: 'Sector 28, Kumbha Marg', note: 'Modern facilities' },
    ],
    tips: ['Tourist helpline: 1363 (English)', 'Only drink bottled water — check the seal is intact', 'Pre-negotiate rickshaw fares or use Ola/Uber'],
  },
  {
    country: 'New Zealand',
    flag: '\uD83C\uDDF3\uD83C\uDDFF',
    destinations: ['Queenstown'],
    police: '111',
    ambulance: '111',
    fire: '111',
    usEmbassy: { city: 'Wellington', phone: '+64-4-462-6000', address: '29 Fitzherbert Terrace, Thorndon' },
    hospitals: [
      { name: 'Lakes District Hospital', area: 'Queenstown', note: 'Small but competent — helicopters for serious cases' },
      { name: 'Dunedin Hospital', area: 'Dunedin (2hrs)', note: 'Nearest major hospital' },
    ],
    tips: ['111 for all emergencies', 'ACC covers accident-related medical costs for all visitors', 'Weather changes fast in the mountains — always tell someone your plans'],
  },
  {
    country: 'Croatia',
    flag: '\uD83C\uDDED\uD83C\uDDF7',
    destinations: ['Dubrovnik'],
    police: '112',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Zagreb', phone: '+385-1-661-2200', address: 'Ulica Thomasa Jeffersona 2' },
    hospitals: [
      { name: 'Dubrovnik General Hospital', area: 'Lapad', note: 'Main hospital, some English' },
    ],
    tips: ['112 works across the EU', 'Stay hydrated in summer — temperatures regularly exceed 35°C', 'Pharmacies (ljekarna) carry most common medications'],
  },
  {
    country: 'Hungary',
    flag: '\uD83C\uDDED\uD83C\uDDFA',
    destinations: ['Budapest'],
    police: '107',
    ambulance: '104',
    fire: '105',
    usEmbassy: { city: 'Budapest', phone: '+36-1-475-4400', address: 'Szabadság tér 12' },
    hospitals: [
      { name: 'FirstMed Centers', area: 'District I', note: 'Private, English-speaking, expat-focused' },
      { name: 'Szent János Hospital', area: 'Buda side', note: '24hr public ER' },
    ],
    tips: ['112 for all emergencies', 'Night doctors available for non-emergency hotel visits', 'Beware of "pretty woman" bar scams in District V — you get a huge bill'],
  },
  {
    country: 'United Kingdom',
    flag: '\uD83C\uDDEC\uD83C\uDDE7',
    destinations: ['London'],
    police: '999',
    ambulance: '999',
    fire: '999',
    usEmbassy: { city: 'London', phone: '+44-20-7499-9000', address: '33 Nine Elms Lane, Vauxhall' },
    hospitals: [
      { name: 'University College Hospital', area: 'Bloomsbury', note: 'Central London, 24hr A&E' },
      { name: 'St Thomas\' Hospital', area: 'Lambeth', note: 'Near Westminster, excellent ER' },
    ],
    tips: ['999 or 112 for emergencies', 'NHS emergency treatment is free for visitors', 'For non-emergencies call 111 (NHS helpline)'],
  },
  {
    country: 'Cambodia',
    flag: '\uD83C\uDDF0\uD83C\uDDED',
    destinations: ['Siem Reap'],
    police: '117',
    ambulance: '119',
    fire: '118',
    usEmbassy: { city: 'Phnom Penh', phone: '+855-23-728-000', address: '#1, Street 96, Wat Phnom' },
    hospitals: [
      { name: 'Royal Angkor International Hospital', area: 'Siem Reap', note: 'Best option, some English' },
      { name: 'Siem Reap Referral Hospital', area: 'Central', note: 'Basic public facility' },
    ],
    tips: ['For serious medical emergencies, evacuation to Bangkok is standard', 'Carry cash (USD accepted everywhere)', 'Stick to well-lit areas at night — avoid dark side roads'],
  },
  {
    country: 'United States',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    destinations: ['New York'],
    police: '911',
    ambulance: '911',
    fire: '911',
    usEmbassy: { city: 'N/A (domestic)', phone: '', address: '' },
    hospitals: [
      { name: 'NewYork-Presbyterian', area: 'Upper East Side', note: 'Top-ranked, 24hr ER' },
      { name: 'NYU Langone', area: 'Midtown East', note: 'Major academic medical center' },
    ],
    tips: ['911 for all emergencies', 'NYC has one of the fastest EMS response times in the US', 'Walk-in urgent care clinics (CityMD, etc.) handle non-emergency issues quickly'],
  },
  {
    country: 'Greece',
    flag: '\uD83C\uDDEC\uD83C\uDDF7',
    destinations: ['Santorini'],
    police: '100',
    ambulance: '166',
    fire: '199',
    usEmbassy: { city: 'Athens', phone: '+30-210-721-2951', address: '91 Vasilissis Sophias Avenue' },
    hospitals: [
      { name: 'Santorini Health Center', area: 'Fira', note: 'Basic care; serious cases airlifted to Athens' },
    ],
    tips: ['112 also works as EU emergency number', 'Medical evacuation to Athens may be needed for serious issues', 'Pharmacies (marked with green cross) can dispense many medications without prescription'],
  },
  {
    country: 'Slovenia',
    flag: '\uD83C\uDDF8\uD83C\uDDEE',
    destinations: ['Ljubljana'],
    police: '113',
    ambulance: '112',
    fire: '112',
    usEmbassy: { city: 'Ljubljana', phone: '+386-1-200-5500', address: 'Pre\u0161ernova 31' },
    hospitals: [
      { name: 'University Medical Centre', area: 'Ljubljana', note: 'Main hospital, English spoken' },
    ],
    tips: ['112 works for all emergencies', 'Slovenia is extremely safe', 'EU Health Insurance Card (EHIC) accepted'],
  },
];

/** Find emergency data for a destination */
export function getEmergencyForDestination(destination: string): EmergencyData | null {
  return EMERGENCY_DATA.find((data) =>
    data.destinations.some((d) => destination.toLowerCase().includes(d.toLowerCase()))
  ) ?? null;
}
