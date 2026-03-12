// =============================================================================
// ROAM — Airport Survival Guide Data
// Best food, lounges, security, sleep spots, SIM, currency for major hubs
// =============================================================================

export interface AirportTerminalFood {
  terminal: string;
  spots: { name: string; type: string; note: string }[];
}

export interface AirportData {
  code: string;
  name: string;
  city: string;
  food: AirportTerminalFood[];
  hiddenLounges: { name: string; how: string; cost?: string }[];
  fastestSecurity: string;
  sleepSpots: string[];
  workSpots: string[];
  simCards: { where: string; note: string }[];
  currencyAvoid: string;
  currencyUse: string;
  terminalTransfer: string;
  photoQuery: string;
}

export const AIRPORTS: AirportData[] = [
  {
    code: 'JFK',
    name: 'John F. Kennedy International',
    city: 'New York',
    food: [
      { terminal: 'T4', spots: [{ name: 'Shake Shack', type: 'Burger', note: 'Best fast food in the airport. Landside only.' }, { name: 'La Vie', type: 'French', note: 'Solid sit-down before a long haul' }] },
      { terminal: 'T5', spots: [{ name: 'Five Senses', type: 'Korean', note: 'Bibimbap that beats most chain options' }, { name: 'Deep Blue Sushi', type: 'Sushi', note: 'Fresh enough for airport sushi' }] },
      { terminal: 'T8', spots: [{ name: 'Café Metro', type: 'Deli', note: 'Quick sandwiches, no lines at odd hours' }] },
    ],
    hiddenLounges: [
      { name: 'Airspace Lounge T5', how: 'Day pass $40, or Priority Pass', cost: '$40' },
      { name: 'Virgin Clubhouse', how: 'Virgin Atlantic Upper Class or Flying Club Gold' },
    ],
    fastestSecurity: 'T4 PreCheck around 5–7am; T5 gets slammed 11am–2pm. Skip T1 if you can.',
    sleepSpots: ['T5 gate area near C60 — quieter, armrest-free benches', 'T4 arrivals level has dimmer corners before customs'],
    workSpots: ['T5 near gate 22 — power outlets and tables', 'T4 JetBlue area — good wifi, less foot traffic'],
    simCards: [{ where: 'T4 arrivals, after baggage', note: 'Verizon/T-Mobile kiosks. Prices marked up. Get an eSIM before you fly.' }],
    currencyAvoid: 'Travelex and generic kiosks in T4/T5 — worst rates',
    currencyUse: 'ATM in T4 near Gate B24 (bank fees only)',
    terminalTransfer: 'Airtrain runs 24/7. Allow 15–25 min between terminals. Free landside, $8 airside.',
    photoQuery: 'JFK Airport New York',
  },
  {
    code: 'LAX',
    name: 'Los Angeles International',
    city: 'Los Angeles',
    food: [
      { terminal: 'TBIT', spots: [{ name: 'Border Grill', type: 'Mexican', note: 'Rick Bayless. Worth the price.' }, { name: 'Umami Burger', type: 'Burger', note: 'Solid option in a desert of chains' }] },
      { terminal: 'T4', spots: [{ name: 'Coffee Bean', type: 'Coffee', note: 'Real coffee, not Starbucks' }, { name: 'Real Food Daily', type: 'Vegan', note: 'Actually good, not sad' }] },
      { terminal: 'T2', spots: [{ name: 'Curry House', type: 'Japanese', note: 'Curry udon when you need comfort' }] },
    ],
    hiddenLounges: [
      { name: 'KAL Lounge TBIT', how: 'Priority Pass, $35 walk-in', cost: '$35' },
      { name: 'Star Alliance Lounge TBIT', how: 'Star Alliance Gold or paid day pass', cost: '$59' },
    ],
    fastestSecurity: 'T4 and TBIT north checkpoint — typically lighter than south. PreCheck in TBIT is fast.',
    sleepSpots: ['TBIT upstairs near Gates 130–140 — quieter, fewer announcements', 'T4 landside near baggage claim has benches'],
    workSpots: ['TBIT Gate 148 area — tables, power, decent wifi', 'T4 Delta Sky Club if you have access'],
    simCards: [{ where: 'TBIT arrivals, T4', note: 'T-Mobile and Verizon. eSIM from Airlo or Holafly is cheaper.' }],
    currencyAvoid: 'Currency exchange kiosks — 15–20% markup',
    currencyUse: 'Chase ATM in TBIT arrivals',
    terminalTransfer: 'LAX Shuttle or walk TBIT–T4–T5. Allow 20–40 min. TBIT to T1 is 30+ min.',
    photoQuery: 'LAX Airport Los Angeles',
  },
  {
    code: 'LHR',
    name: 'Heathrow',
    city: 'London',
    food: [
      { terminal: 'T5', spots: [{ name: 'Gordons Wine Bar', type: 'Wine/light bites', note: 'Actually good wine, not airport swill' }, { name: 'Wagamama', type: 'Ramen', note: 'Consistent. Kids eat free.' }] },
      { terminal: 'T3', spots: [{ name: 'The Curator', type: 'Cafe', note: 'Decent coffee and sandwiches' }, { name: 'Giraffe', type: 'Global', note: 'Reliable breakfast' }] },
      { terminal: 'T2', spots: [{ name: 'Prêt', type: 'Sandwich', note: 'Fast, cheap, no surprises' }] },
    ],
    hiddenLounges: [
      { name: 'Plaza Premium T2', how: 'Priority Pass or walk-in', cost: 'GBP 35' },
      { name: 'No1 Lounge T3', how: 'Priority Pass, or book online', cost: 'GBP 35' },
    ],
    fastestSecurity: 'T5 North security often faster than South. Book Fast Track if connection is tight.',
    sleepSpots: ['T5 gate area A — armrest-free benches exist if you hunt', 'YOTELAIR T4 airside — paid sleep pods'],
    workSpots: ['T5 near Gate A18 — power, seating', 'T3 Plaza Premium has work zones'],
    simCards: [{ where: 'T5 arrivals, WHSmith', note: 'Three, EE, Vodafone. Get a SIM before leaving airside.' }],
    currencyAvoid: 'Bureaux de change in arrivals — terrible rates',
    currencyUse: 'ATM in T5 arrivals (bank fee only) or exchange before you leave home',
    terminalTransfer: 'Elizabeth Line or Heathrow Express. T2–T5 is 15–25 min. Bus between T4–T5.',
    photoQuery: 'Heathrow Airport London',
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle',
    city: 'Paris',
    food: [
      { terminal: '2E', spots: [{ name: 'Caviar House', type: 'Seafood', note: 'Splurge. Worth it.' }, { name: 'Paul', type: 'Bakery', note: 'Real croissants. Chain but good.' }] },
      { terminal: '2F', spots: [{ name: 'Exki', type: 'Healthy', note: 'Salads, wraps. Fresh.' }, { name: 'Café Richard', type: 'Coffee', note: 'Proper espresso' }] },
      { terminal: '2A', spots: [{ name: 'Ladurée', type: 'Pastry', note: 'Macarons. Tourist trap but good.' }] },
    ],
    hiddenLounges: [
      { name: 'Espace Salon 2E', how: 'Priority Pass', cost: 'EUR 35' },
      { name: 'YotelAir 2E', how: 'Paid sleep pods', cost: 'EUR 50–80' },
    ],
    fastestSecurity: '2E Hall K usually quicker. 2F gets slammed. Avoid 2G for connections.',
    sleepSpots: ['2E Gate L — quieter end', '2F landside — benches but loud'],
    workSpots: ['2E near Gate M — tables, power', 'Espace Salon lounge if you have access'],
    simCards: [{ where: '2E/2F arrivals, Relay stores', note: 'Orange, SFR, Free. Better to buy at a tabac in Paris.' }],
    currencyAvoid: 'All airport bureaux de change — brutal rates',
    currencyUse: 'ATM in 2E or 2F. Withdraw euros, decline conversion.',
    terminalTransfer: 'CDGVAL train between 2E/2F/2G. 2A–2F is 15–20 min. 1 to 2 is 25+ min.',
    photoQuery: 'Charles de Gaulle Airport Paris',
  },
  {
    code: 'DXB',
    name: 'Dubai International',
    city: 'Dubai',
    food: [
      { terminal: 'T3', spots: [{ name: 'The Kitchen by Wolfgang Puck', type: 'Fine dining', note: 'Expensive but good' }, { name: 'Giraffe', type: 'Global', note: 'Solid breakfast' }] },
      { terminal: 'T1', spots: [{ name: 'Paul', type: 'Bakery', note: 'Croissants and coffee' }, { name: 'Starbucks', type: 'Coffee', note: '24/7, reliable' }] },
      { terminal: 'T2', spots: [{ name: 'Quick bites', type: 'Mixed', note: 'Budget options. Limited.' }] },
    ],
    hiddenLounges: [
      { name: 'Marhaba Lounge T3', how: 'Priority Pass or pay', cost: 'AED 150' },
      { name: 'Plaza Premium T1', how: 'Priority Pass', cost: 'AED 120' },
    ],
    fastestSecurity: 'T3 Concourse A and B — fast. T1 can be slow at peak.',
    sleepSpots: ['T3 Concourse A — quieter gates, loungers', 'Sleep n Fly pods T3 — paid'],
    workSpots: ['T3 near Gate A1 — power, seating', 'Marhaba lounges have work areas'],
    simCards: [{ where: 'T3 arrivals, du and Etisalat kiosks', note: 'Tourist SIMs available. Fair prices.' }],
    currencyAvoid: 'Airport exchange counters — 5–10% worse than city',
    currencyUse: 'ATM in T3 arrivals. AED is pegged to USD.',
    terminalTransfer: 'Free shuttle bus T1–T2–T3. 15–25 min. Metro connects to city.',
    photoQuery: 'Dubai Airport UAE',
  },
  {
    code: 'NRT',
    name: 'Narita International',
    city: 'Tokyo',
    food: [
      { terminal: 'T1', spots: [{ name: 'Tonkatsu Wako', type: 'Japanese', note: 'Real tonkatsu. Not a joke.' }, { name: 'Sushi Kyotatsu', type: 'Sushi', note: 'Solid conveyor sushi' }] },
      { terminal: 'T2', spots: [{ name: 'Ringer Hut', type: 'Ramen', note: 'Nagasaki champon. Comfort food.' }, { name: 'Tsukiji Sushiko', type: 'Sushi', note: 'Decent quality' }] },
      { terminal: 'T3', spots: [{ name: 'LCC terminal', type: 'Limited', note: 'Vending and basics only' }] },
    ],
    hiddenLounges: [
      { name: 'ANA Lounge T1', how: 'ANA/Star Alliance status' },
      { name: 'JAL Sakura Lounge T2', how: 'JAL/oneworld status' },
      { name: 'No1 Lounge T1', how: 'Priority Pass', cost: 'JPY 4,000' },
    ],
    fastestSecurity: 'T1 South wing often faster. T2 North can be slow. Arrive 2.5h early for international.',
    sleepSpots: ['T2 4F — rest zone with recliners', 'T1 landside — capsule-style nap area'],
    workSpots: ['T1 4F — tables, power, good wifi', 'T2 near Gates 71–80'],
    simCards: [{ where: 'T1/T2 arrivals, vending machines and counters', note: 'Ninja WiFi, Sakura Mobile. eSIM from Ubigi is easy.' }],
    currencyAvoid: 'Travelex and airport exchange — bad rates',
    currencyUse: '7-Eleven or Japan Post ATM in arrivals. Best rates.',
    terminalTransfer: 'Free shuttle T1–T2–T3. 10 min. T3 is LCC-only.',
    photoQuery: 'Narita Airport Tokyo',
  },
  {
    code: 'SIN',
    name: 'Changi',
    city: 'Singapore',
    food: [
      { terminal: 'T1', spots: [{ name: 'Heavenly Wang', type: 'Local', note: 'Kaya toast, kopi. Do it.' }, { name: 'Killiney Kopitiam', type: 'Local', note: 'Laksa, Hainanese chicken' }] },
      { terminal: 'T2', spots: [{ name: 'Din Tai Fung', type: 'Dumplings', note: 'XLB. Always.' }, { name: 'Ya Kun', type: 'Local', note: 'Kaya toast, soft boil' }] },
      { terminal: 'T3', spots: [{ name: 'Bengawan Solo', type: 'Pastry', note: 'Pandan cake. Gift it.' }, { name: 'Papa Rich', type: 'Malaysian', note: 'Nasi lemak, roti' }] },
    ],
    hiddenLounges: [
      { name: 'Plaza Premium T1', how: 'Priority Pass' },
      { name: 'Ambassador Transit Lounge T2', how: 'Pay per use', cost: 'SGD 48' },
    ],
    fastestSecurity: 'FastTrack available. Regular lanes are efficient. Arrive 2h for international.',
    sleepSpots: ['T3 Transit Hotel — book by the hour', 'Rest areas in T1/T2/T3 — free loungers'],
    workSpots: ['Jewel — coworking vibe, power everywhere', 'T2 near Gate E5 — quiet'],
    simCards: [{ where: 'T1/T2/T3 arrivals, Changi Recommends', note: 'Tourist SIMs. Good value. eSIM also available.' }],
    currencyAvoid: 'Rarely an issue — most take cards. Skip money changers in transit.',
    currencyUse: 'ATM in any terminal. SGD. Cards widely accepted.',
    terminalTransfer: 'Skytrain between T1–T2–T3. 5–10 min. Jewel is landside.',
    photoQuery: 'Changi Airport Singapore',
  },
  {
    code: 'BKK',
    name: 'Suvarnabhumi',
    city: 'Bangkok',
    food: [
      { terminal: 'All', spots: [{ name: 'Magic Food Point', type: 'Food court', note: 'Landside, basement. Real Thai food. Cheap.' }, { name: 'Cafe Amazon', type: 'Coffee', note: 'Thai chain. Good iced coffee.' }] },
      { terminal: 'G', spots: [{ name: 'Pizzeria Company', type: 'Pizza', note: 'Edible. Sometimes you need it.' }] },
    ],
    hiddenLounges: [
      { name: 'Miracle Lounge', how: 'Priority Pass', cost: 'THB 1,200' },
      { name: 'Coral Executive Lounge', how: 'Priority Pass or pay', cost: 'THB 900' },
    ],
    fastestSecurity: 'FastTrack if you have it. Regular lanes can be 30–45 min at peak.',
    sleepSpots: ['Landside floor 2 — quiet corners', 'Pay-per-hour lounges if desperate'],
    workSpots: ['Gate area near D7 — power outlets', 'Miracle Lounge has work zone'],
    simCards: [{ where: 'Arrivals, AIS/DTAC/True kiosks', note: 'Tourist SIMs. Good deals. Get one here.' }],
    currencyAvoid: 'Airport exchange — 2–3 baht worse than SuperRich in city',
    currencyUse: 'ATM. Decline conversion. SuperRich in city for best rates.',
    terminalTransfer: 'Single terminal. Long walks. Allow 20 min gate to gate.',
    photoQuery: 'Suvarnabhumi Airport Bangkok',
  },
  {
    code: 'BCN',
    name: 'Barcelona-El Prat',
    city: 'Barcelona',
    food: [
      { terminal: 'T1', spots: [{ name: 'Porta Gaig', type: 'Catalan', note: 'Michelin-starred. Book ahead.' }, { name: 'Café & Tapa', type: 'Tapas', note: 'Solid jamon, patatas' }] },
      { terminal: 'T2', spots: [{ name: 'Pans & Company', type: 'Sandwich', note: 'Cheap, quick' }, { name: 'Starbucks', type: 'Coffee', note: 'Reliable' }] },
    ],
    hiddenLounges: [
      { name: 'Sala VIP T1', how: 'Priority Pass or pay', cost: 'EUR 35' },
    ],
    fastestSecurity: 'T1 usually faster. T2B can bottleneck. Arrive 2h for international.',
    sleepSpots: ['T1 gate area — benches, armrest-free in some areas', 'T2 landside — limited'],
    workSpots: ['T1 near Gates D — power, tables', 'Sala VIP if you have access'],
    simCards: [{ where: 'T1/T2 arrivals, Vodafone/Orange', note: 'Tourist SIMs. City shops are cheaper.' }],
    currencyAvoid: 'All airport exchange — terrible',
    currencyUse: 'ATM. Decline conversion. Euros.',
    terminalTransfer: 'Free shuttle T1–T2. 10–15 min.',
    photoQuery: 'Barcelona Airport El Prat',
  },
  {
    code: 'FCO',
    name: 'Fiumicino',
    city: 'Rome',
    food: [
      { terminal: 'T3', spots: [{ name: 'Eataly', type: 'Italian', note: 'Real pasta, wine. Expensive but good.' }, { name: 'Cucina Romana', type: 'Roman', note: 'Carbonara, cacio e pepe' }] },
      { terminal: 'T1', spots: [{ name: 'Barilla', type: 'Pasta', note: 'Quick, decent' }] },
    ],
    hiddenLounges: [
      { name: 'Plaza Premium T3', how: 'Priority Pass', cost: 'EUR 35' },
      { name: 'HelloSky Lounge', how: 'Pay or Priority Pass', cost: 'EUR 35' },
    ],
    fastestSecurity: 'T3 E gates — usually quicker. T1 Schengen can be slow.',
    sleepSpots: ['T3 Gate E — quieter end', 'Rest zones landside — limited comfort'],
    workSpots: ['T3 near Gate E30 — power, seating', 'Plaza Premium has work area'],
    simCards: [{ where: 'T3 arrivals, TIM/Vodafone', note: 'Tourist SIMs. City tabacchi cheaper.' }],
    currencyAvoid: 'All airport exchange — some of the worst in Europe',
    currencyUse: 'ATM. Decline conversion. Euros.',
    terminalTransfer: 'T1–T3 walkable. 10–15 min. T5 is bus.',
    photoQuery: 'Fiumicino Airport Rome',
  },
];
