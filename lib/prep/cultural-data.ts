// =============================================================================
// ROAM — Cultural Guide Data
// Etiquette, tipping, scams, SIM cards, and local intel for top destinations
// =============================================================================

export interface CulturalGuide {
  country: string;
  destinations: string[];
  flag: string;
  etiquette: Array<{ do: string; dont: string }>;
  tipping: string;
  commonScams: string[];
  simCard: { provider: string; cost: string; where: string };
  currency: { code: string; symbol: string; tip: string };
  plugType: string;
  waterSafety: 'tap_safe' | 'bottled_only' | 'mostly_safe';
  dressCodes: string[];
}

export const CULTURAL_GUIDES: CulturalGuide[] = [
  {
    country: 'Japan',
    destinations: ['Tokyo', 'Kyoto', 'Osaka'],
    flag: '\uD83C\uDDEF\uD83C\uDDF5',
    etiquette: [
      { do: 'Bow when greeting — a slight nod is fine', dont: 'Don\'t tip at restaurants. It\'s considered rude' },
      { do: 'Remove shoes before entering homes, temples, some restaurants', dont: 'Don\'t eat or drink while walking. Stand to the side' },
      { do: 'Slurp your noodles — it means you\'re enjoying them', dont: 'Don\'t stick chopsticks upright in rice (funeral ritual)' },
      { do: 'Queue properly. Japanese queuing is an art form', dont: 'Don\'t talk loudly on trains. Use silent mode on your phone' },
    ],
    tipping: 'Never tip. Service is included. Leaving money can be confusing or offensive.',
    commonScams: ['Friendly "bar" invitations in Kabukicho — you\'ll get a $500 bill', 'Fake monks asking for donations near temples'],
    simCard: { provider: 'Sakura Mobile or airport SIM vending machines', cost: '~$30 for 2 weeks unlimited data', where: 'Airport arrival hall (Narita/Haneda)' },
    currency: { code: 'JPY', symbol: '¥', tip: 'Japan is still cash-heavy. Carry ¥10,000+ bills. 7-Eleven ATMs accept foreign cards' },
    plugType: 'Type A (US-style, 2 flat prongs). No adapter needed for US travelers.',
    waterSafety: 'tap_safe',
    dressCodes: ['Cover shoulders and knees at temples', 'Socks required (shoes off) at many temples — bring clean ones'],
  },
  {
    country: 'Thailand',
    destinations: ['Bangkok', 'Chiang Mai'],
    flag: '\uD83C\uDDF9\uD83C\uDDED',
    etiquette: [
      { do: 'Wai (palms together bow) when greeting elders', dont: 'Never touch someone\'s head — it\'s the most sacred body part' },
      { do: 'Remove shoes before entering temples or homes', dont: 'Don\'t point your feet at Buddha images or people' },
      { do: 'Speak softly and smile — Thailand is the "Land of Smiles"', dont: 'Never disrespect the Thai Royal Family. It\'s a criminal offense' },
    ],
    tipping: '20-50 THB for meals. Round up for taxis. 50-100 THB/day for hotel staff.',
    commonScams: ['Tuk-tuk drivers taking you to gem stores for commission', '"Grand Palace is closed today" — it\'s not, they want to redirect you', 'Jet ski damage scams in beach areas — take photos before renting'],
    simCard: { provider: 'AIS, DTAC, or TrueMove', cost: '~$8 for 7 days with 15GB data', where: 'Airport arrivals (BKK/DMK) or any 7-Eleven' },
    currency: { code: 'THB', symbol: '฿', tip: 'ATMs charge 220 THB ($6) per withdrawal. Take out larger amounts. Bangkok Bank ATMs are cheapest' },
    plugType: 'Type A/B/C (US plugs fit most outlets). Adapter rarely needed.',
    waterSafety: 'bottled_only',
    dressCodes: ['Cover shoulders and knees at ALL temples', 'Long pants required at Grand Palace — they rent wraps if needed'],
  },
  {
    country: 'Spain',
    destinations: ['Barcelona'],
    flag: '\uD83C\uDDEA\uD83C\uDDF8',
    etiquette: [
      { do: 'Greet with two kisses (left cheek first)', dont: 'Don\'t rush meals — dinner starts at 9-10pm' },
      { do: 'Say "buenos días" when entering shops', dont: 'Don\'t expect businesses open 2-5pm (siesta hours)' },
    ],
    tipping: 'Not expected but appreciated. Round up the bill or leave 5-10% for great service.',
    commonScams: ['Pickpockets on Las Ramblas and in the Metro', '"Friendship bracelet" scam — someone ties one on your wrist then demands payment', 'Fake petitions asking for signatures then money'],
    simCard: { provider: 'Orange, Vodafone, or Movistar', cost: '~€10 for 10GB data', where: 'Phone shops on any major street or airport' },
    currency: { code: 'EUR', symbol: '€', tip: 'Cards accepted nearly everywhere. Keep some cash for small bars/markets' },
    plugType: 'Type C/F (European round 2-pin). US travelers need an adapter.',
    waterSafety: 'tap_safe',
    dressCodes: ['Cover shoulders in churches', 'Barcelona is casual — shorts and sandals are fine everywhere else'],
  },
  {
    country: 'Italy',
    destinations: ['Rome', 'Florence', 'Amalfi Coast'],
    flag: '\uD83C\uDDEE\uD83C\uDDF9',
    etiquette: [
      { do: 'Say "buongiorno" (before 3pm) or "buonasera" (after)', dont: 'Don\'t order a cappuccino after 11am — locals will judge you' },
      { do: 'Stand at the bar for cheaper coffee (coperto = sit-down charge)', dont: 'Don\'t eat near major monuments — it\'s illegal and fined in Rome/Florence' },
    ],
    tipping: 'Not expected. "Coperto" (cover charge) is on the bill. Round up for exceptional service.',
    commonScams: ['Gladiators at the Colosseum who charge €20+ for a photo', '"Restaurant" tourist traps near Piazza Navona with "friendly" greeters', 'Fake charity petition scams near tourist sites'],
    simCard: { provider: 'TIM, Vodafone, or WindTre', cost: '~€10 for 50GB data', where: 'Phone shops near train stations or airport' },
    currency: { code: 'EUR', symbol: '€', tip: 'Many small trattorias are cash-only. ATMs everywhere but avoid currency exchange shops' },
    plugType: 'Type C/F/L (European round 2/3-pin). US travelers need an adapter.',
    waterSafety: 'tap_safe',
    dressCodes: ['Shoulders AND knees must be covered at ALL churches (Vatican is strict)', 'They hand out paper shawls at St. Peter\'s if you forget'],
  },
  {
    country: 'Indonesia',
    destinations: ['Bali'],
    flag: '\uD83C\uDDEE\uD83C\uDDE9',
    etiquette: [
      { do: 'Use your right hand for giving/receiving — left hand is unclean', dont: 'Don\'t touch offerings (canang sari) on the ground — step around them' },
      { do: 'Bargain at markets — start at 40% of asking price', dont: 'Don\'t sunbathe topless — Bali is Hindu and conservative outside resorts' },
    ],
    tipping: '10-15% at restaurants. Round up for drivers. Rp 20,000-50,000 for guides.',
    commonScams: ['Money changers shortchanging you — count carefully, avoid street exchangers', 'Motorbike rental damage claims for pre-existing scratches — photo EVERYTHING first', 'Taxi drivers who "don\'t have change" — carry small bills'],
    simCard: { provider: 'Telkomsel or XL Axiata', cost: '~$5 for 25GB data', where: 'Airport arrival or any small phone kiosk in Seminyak/Ubud' },
    currency: { code: 'IDR', symbol: 'Rp', tip: 'Millions of rupiah sounds crazy but 1 USD ≈ 16,000 IDR. Use ATMs in banks, not standalone machines' },
    plugType: 'Type C/F (European round 2-pin). US travelers need an adapter.',
    waterSafety: 'bottled_only',
    dressCodes: ['Sarong and sash required at ALL temples (usually provided for rent)', 'Cover shoulders at temples — bring a light scarf'],
  },
  {
    country: 'Morocco',
    destinations: ['Marrakech'],
    flag: '\uD83C\uDDF2\uD83C\uDDE6',
    etiquette: [
      { do: 'Bargain at souks — it\'s expected and part of the culture', dont: 'Don\'t photograph people without asking first' },
      { do: 'Accept mint tea if offered — it\'s a sign of hospitality', dont: 'Don\'t use your left hand for eating or greeting' },
    ],
    tipping: '10-15% at restaurants. 10-20 MAD for small services. Guides: 100-200 MAD/day.',
    commonScams: ['"Helpful" locals guiding you then demanding payment', 'Henna artists who grab your hand and demand €50+', 'Snake charmers placing snakes on you then charging for photos'],
    simCard: { provider: 'Maroc Telecom, Orange, or Inwi', cost: '~$5 for 20GB data', where: 'Airport or phone shops in Guéliz/new city area' },
    currency: { code: 'MAD', symbol: 'DH', tip: 'Cash is king. ATMs in Guéliz and medina. Cards rarely accepted in souks' },
    plugType: 'Type C/E (European round 2-pin). US travelers need an adapter.',
    waterSafety: 'bottled_only',
    dressCodes: ['Women: cover shoulders and knees in the medina', 'Men: avoid shorts in the medina — long pants preferred'],
  },
  {
    country: 'France',
    destinations: ['Paris'],
    flag: '\uD83C\uDDEB\uD83C\uDDF7',
    etiquette: [
      { do: 'Say "bonjour" when entering any shop or café', dont: 'Don\'t skip the greeting — it\'s considered very rude in France' },
      { do: 'Dress well — Parisians notice', dont: 'Don\'t speak loudly in restaurants or on the Métro' },
    ],
    tipping: 'Service included ("service compris"). Round up a euro or two for great service.',
    commonScams: ['Gold ring scam: someone "finds" a ring and tries to sell it to you', 'Petition signers near Sacré-Cœur who then demand money', 'Bracelet sellers at Montmartre who tie them on you'],
    simCard: { provider: 'Orange, SFR, or Free', cost: '~€10 for 80GB data (Free has best deals)', where: 'Tabac shops or phone stores on any commercial street' },
    currency: { code: 'EUR', symbol: '€', tip: 'Cards accepted almost everywhere. Paris is very card-friendly' },
    plugType: 'Type C/E (European round 2-pin). US travelers need an adapter.',
    waterSafety: 'tap_safe',
    dressCodes: ['No strict dress codes but dress smart-casual for restaurants', 'Cover shoulders in churches (Notre-Dame, Sacré-Cœur)'],
  },
  {
    country: 'Portugal',
    destinations: ['Lisbon'],
    flag: '\uD83C\uDDF5\uD83C\uDDF9',
    etiquette: [
      { do: 'Try to speak some Portuguese — locals appreciate the effort', dont: 'Don\'t call Portuguese people Spanish. Different country, different language' },
      { do: 'Order a pastel de nata at every opportunity', dont: 'Don\'t refuse bread/olives at restaurants — just know they\'re charged extra (couvert)' },
    ],
    tipping: '5-10% for good service. Not strictly expected but becoming more common.',
    commonScams: ['Pickpockets on Tram 28 and in Alfama — use a money belt', 'Overpriced restaurants in Praça do Comércio with pushy greeters'],
    simCard: { provider: 'NOS, MEO, or Vodafone', cost: '~€10 for 15GB data', where: 'Airport arrival hall or phone shops downtown' },
    currency: { code: 'EUR', symbol: '€', tip: 'Cards accepted widely. Cash useful for tiny tascas (local bars)' },
    plugType: 'Type C/F (European round 2-pin). US travelers need an adapter.',
    waterSafety: 'tap_safe',
    dressCodes: ['Very casual city — dress comfortably', 'Comfortable shoes essential — Lisbon is HILLY'],
  },
];

/** Find cultural guide for a destination */
export function getCulturalGuideForDestination(destination: string): CulturalGuide | null {
  return CULTURAL_GUIDES.find((guide) =>
    guide.destinations.some((d) => destination.toLowerCase().includes(d.toLowerCase()))
  ) ?? null;
}
