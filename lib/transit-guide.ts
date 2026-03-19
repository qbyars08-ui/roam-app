// =============================================================================
// ROAM — Local Transportation Guide
// Curated, opinionated transit advice for top destinations.
// "Take the metro, not a taxi." — honest, cost-aware, app-specific.
// =============================================================================

export interface TransitOption {
  name: string;
  type: 'metro' | 'bus' | 'tram' | 'ferry' | 'rideshare' | 'bike' | 'train';
  recommended: boolean;
  costRange: string;
  tip: string;
  app?: string;
  passOption?: string;
}

export interface TransitGuide {
  destination: string;
  airportToCity: string;
  bestApp: string;
  avoidApp?: string;
  options: TransitOption[];
  proTip: string;
}

// ---------------------------------------------------------------------------
// Curated transit data — 10 destinations
// ---------------------------------------------------------------------------

const TRANSIT_GUIDES: ReadonlyArray<TransitGuide> = [
  {
    destination: 'Tokyo',
    airportToCity: 'Narita: take Narita Express (N\'EX) to Shinjuku/Shibuya (~¥3,250, 80 min). Haneda: take the Keikyu Line to Shinagawa (~¥300, 15 min) — far cheaper and faster than any taxi.',
    bestApp: 'Google Maps',
    avoidApp: 'Apple Maps — transit directions are unreliable in Tokyo',
    options: [
      { name: 'Tokyo Metro + Toei Subway', type: 'metro', recommended: true, costRange: '¥170–¥320 ($1.10–$2.10)', tip: 'Covers nearly everything. Runs 5am–midnight. Color-coded lines make navigation easy even without Japanese.', passOption: 'Suica/Pasmo IC card — tap on/off, works on all trains and most vending machines' },
      { name: 'JR Yamanote Line', type: 'train', recommended: true, costRange: '¥150–¥200 ($1–$1.30)', tip: 'The loop line connecting all major hubs (Shinjuku, Shibuya, Tokyo, Ueno). Use this as your backbone.', passOption: 'Suica card' },
      { name: 'Taxi', type: 'rideshare', recommended: false, costRange: '¥700+ base ($4.50+)', tip: 'Absurdly expensive. A 15-min ride can hit ¥3,000. Only use late at night when trains stop.', app: 'GO (Japan Taxi)' },
      { name: 'Docomo Bike Share', type: 'bike', recommended: false, costRange: '¥165/30 min ($1.10)', tip: 'Great for exploring flat areas like Asakusa or along the Sumida River. Skip it in Shibuya — too hilly.', app: 'Docomo Bike Share' },
    ],
    proTip: 'Get a Suica card at any station kiosk the moment you land. It works on every train, bus, and most convenience stores. Forget cash for transit entirely.',
  },
  {
    destination: 'Paris',
    airportToCity: 'CDG: take RER B to Gare du Nord (~€11.50, 35 min). Avoid the taxi — it\'s a flat €55 and traffic can double the time. Orly: take Orlyval + RER B (~€14, 40 min).',
    bestApp: 'Citymapper',
    avoidApp: 'Uber — surge pricing near tourist areas is brutal; the Metro is always faster',
    options: [
      { name: 'Paris Métro', type: 'metro', recommended: true, costRange: '€2.15 single / €16.90 carnet of 10', tip: 'Fastest way around Paris, period. Stations every 500m. Buy a carnet (10-pack) to save 20%.', passOption: 'Navigo Easy card — load t+ tickets or passes, tap to ride' },
      { name: 'RER', type: 'train', recommended: true, costRange: '€2.15–€14 depending on zone', tip: 'Use for airport transfers and Versailles. Same Navigo card works. Avoid late at night — sketchier than the Métro.', passOption: 'Navigo Easy' },
      { name: 'Vélib\' Bike Share', type: 'bike', recommended: true, costRange: '€3.10/day pass, first 30 min free', tip: 'Paris is flat and has excellent bike lanes. Perfect for Seine-side rides and reaching spots between Métro stops.', app: 'Vélib\'' },
      { name: 'Bus', type: 'bus', recommended: false, costRange: '€2.15 single', tip: 'Same ticket as Métro but much slower. Only worth it for the scenic Route 69 (Eiffel Tower to Père Lachaise).', passOption: 'Navigo Easy' },
    ],
    proTip: 'A Navigo weekly pass (€30.75, Mon–Sun) gives unlimited Métro, RER, bus, and tram in all zones including airports. If you arrive before Wednesday, buy one immediately.',
  },
  {
    destination: 'Bangkok',
    airportToCity: 'Suvarnabhumi: take the Airport Rail Link to Phaya Thai (~฿45, 30 min), then BTS. Don Mueang: take the A1 bus to BTS Mo Chit (~฿30, 30 min). Taxis from either airport are ฿200–400 with expressway tolls.',
    bestApp: 'Grab',
    avoidApp: 'Regular taxis from the street — meters get "broken" for tourists. Always use Grab.',
    options: [
      { name: 'BTS Skytrain', type: 'metro', recommended: true, costRange: '฿16–฿59 ($0.45–$1.70)', tip: 'Elevated, air-conditioned, avoids traffic completely. Covers Sukhumvit, Silom, Siam. Your main line.', passOption: 'Rabbit card — prepaid tap card, also works at 7-Eleven' },
      { name: 'MRT Subway', type: 'metro', recommended: true, costRange: '฿16–฿42 ($0.45–$1.20)', tip: 'Underground complement to BTS. Reaches Chinatown and Chatuchak. Annoyingly uses a different card than BTS.', passOption: 'MRT stored-value card (separate from Rabbit)' },
      { name: 'Grab', type: 'rideshare', recommended: true, costRange: '฿60–฿200 ($1.70–$5.70)', tip: 'Grab is 30–50% cheaper than metered taxis and you won\'t get scammed. Use GrabCar, not GrabTaxi.', app: 'Grab' },
      { name: 'Longtail Boat (Khlong)', type: 'ferry', recommended: false, costRange: '฿10–฿20 ($0.30–$0.60)', tip: 'Canal boats on Khlong Saen Saep cut across the city avoiding traffic. Wet and wild but genuinely fast.', },
      { name: 'Tuk-tuk', type: 'rideshare', recommended: false, costRange: '฿100–฿300 ($2.90–$8.60)', tip: 'A fun experience once, but always negotiate before getting in. Expect to pay 3x what a Grab costs.', },
    ],
    proTip: 'Bangkok traffic is legendary — a 5km taxi ride can take 45 minutes at rush hour. Always choose BTS/MRT over roads between 7–10am and 4–8pm.',
  },
  {
    destination: 'Rome',
    airportToCity: 'Fiumicino: take the Leonardo Express train to Termini (€14, 32 min non-stop). Do NOT take a taxi (€50 flat, 45–90 min in traffic). Ciampino: take a Terravision bus to Termini (€6, 40 min).',
    bestApp: 'Google Maps',
    avoidApp: 'Uber — limited availability in Rome due to taxi union regulations; often no cars',
    options: [
      { name: 'Metro (Line A + B)', type: 'metro', recommended: true, costRange: '€1.50 single', tip: 'Only 2 useful lines but they hit the big spots (Colosseum, Vatican, Termini). Runs until 23:30 (1:30am Fri/Sat).', passOption: '€7 24h pass or €24 72h CIS pass — unlimited bus/metro/tram' },
      { name: 'Walking', type: 'bike', recommended: true, costRange: 'Free', tip: 'Rome\'s historic center is compact. Trevi to Pantheon is 8 minutes on foot. Walking is genuinely the best way to see this city.', },
      { name: 'Bus', type: 'bus', recommended: false, costRange: '€1.50 single', tip: 'Chaotic, unreliable, and pickpocket-heavy. Use only for Trastevere or when your feet give out.', passOption: 'Same BIT ticket as metro' },
      { name: 'Taxi', type: 'rideshare', recommended: false, costRange: '€8–€15 within center', tip: 'Only use official white taxis from stands. Fixed rates exist for airport runs. Never accept a ride from someone approaching you.', app: 'it Taxi' },
    ],
    proTip: 'Buy the €7 daily pass if you plan 3+ rides. Validate your ticket on the bus/tram or risk a €55 fine — inspectors are frequent and unsympathetic.',
  },
  {
    destination: 'Barcelona',
    airportToCity: 'Take the Aerobús from El Prat to Plaça Catalunya (€7.75, 35 min, runs every 5 min). The metro works too (€5.50) but takes longer with luggage. Taxis are €39 flat — only worth it for groups of 3+.',
    bestApp: 'TMB App (official Barcelona transit)',
    avoidApp: 'Cabify during peak hours — surge pricing makes it worse than a taxi',
    options: [
      { name: 'Metro', type: 'metro', recommended: true, costRange: '€2.40 single / €11.35 T-Casual 10-trip', tip: 'Clean, fast, covers all neighborhoods. The T-Casual 10-trip card is essential — saves 50% vs single tickets.', passOption: 'T-Casual (10 trips, €11.35) — works on metro, bus, tram, and FGC' },
      { name: 'Tram', type: 'tram', recommended: false, costRange: '€2.40 single', tip: 'Useful for Diagonal Mar and Glòries areas. Same T-Casual card works. Not essential for most visitors.', passOption: 'T-Casual' },
      { name: 'Bicing Bike Share', type: 'bike', recommended: true, costRange: '€50/year (residents only)', tip: 'Bicing is resident-only. Tourists should use Donkey Republic (~€8/day) — Barcelona\'s bike lanes are excellent along the waterfront.', app: 'Donkey Republic' },
      { name: 'Taxi', type: 'rideshare', recommended: false, costRange: '€8–€15 within city', tip: 'Black-and-yellow cabs are metered and honest. Fine for late nights, but the metro is always cheaper and often faster.', app: 'FREE NOW' },
    ],
    proTip: 'Buy a T-Casual immediately at any metro station. It\'s 10 trips for €11.35 — that\'s €1.13 per ride vs €2.40 for singles. Works on metro, bus, tram, and suburban rail.',
  },
  {
    destination: 'Seoul',
    airportToCity: 'Incheon: take the AREX Express to Seoul Station (₩9,500, 43 min non-stop). The all-stop AREX is ₩4,750 but takes 66 min. Skip the taxi (₩65,000+, 60–90 min).',
    bestApp: 'Naver Map',
    avoidApp: 'Google Maps — transit data is intentionally blocked in South Korea; it barely works',
    options: [
      { name: 'Seoul Metro', type: 'metro', recommended: true, costRange: '₩1,400–₩2,150 ($1.05–$1.60)', tip: '23 lines, insanely comprehensive. Everything is in Korean AND English. Trains run every 2–3 minutes.', passOption: 'T-money card — tap on/off, also works at convenience stores and taxis' },
      { name: 'Bus', type: 'bus', recommended: true, costRange: '₩1,300–₩2,500 ($0.97–$1.87)', tip: 'Color-coded by type: blue (trunk), green (feeder), red (express). Surprisingly useful for Gangnam to Hongdae routes.', passOption: 'T-money card (same as metro)' },
      { name: 'KakaoTaxi', type: 'rideshare', recommended: true, costRange: '₩4,800+ base ($3.60+)', tip: 'Like Uber but actually works in Korea. Fair metered prices, no scams. Essential for late nights when metro closes at midnight.', app: 'Kakao T' },
      { name: 'Seoul Bike (Ttareungyi)', type: 'bike', recommended: false, costRange: '₩1,000/hr ($0.75)', tip: 'Cheap and fun along the Han River paths. Not practical for hills in Itaewon or Bukchon — you\'ll regret it.', app: 'Seoul Bike (Ttareungyi)' },
    ],
    proTip: 'Get a T-money card at any convenience store (₩2,500 for the card + whatever you load). It gives a ₩100 discount per ride and transfers between metro and bus are free within 30 minutes.',
  },
  {
    destination: 'London',
    airportToCity: 'Heathrow: take the Elizabeth Line to central London (£5.70 off-peak with Oyster, 35–50 min). NOT the Heathrow Express (£25 — total rip-off for saving 15 min). Gatwick: Thameslink to St Pancras (£10.20, 30 min).',
    bestApp: 'Citymapper',
    avoidApp: 'Black cabs for long distances — a cross-London ride can hit £40. Tube is always faster.',
    options: [
      { name: 'Tube (Underground)', type: 'metro', recommended: true, costRange: '£2.70–£5.70 per ride with Oyster', tip: 'The backbone of London. Use Oyster or contactless bank card — NEVER buy paper tickets (double the price). Daily cap is £8.10.', passOption: 'Oyster card or contactless bank card — daily spending cap applies automatically' },
      { name: 'Bus', type: 'bus', recommended: true, costRange: '£1.75 flat (daily cap £5.25)', tip: 'Every ride is £1.75 flat, capped at £5.25/day. Routes 11, 24, and 390 pass major sights. Way cheaper than the Tube.', passOption: 'Oyster or contactless (same card)' },
      { name: 'Santander Cycles', type: 'bike', recommended: true, costRange: '£1.65 unlock + free first 30 min', tip: 'Boris Bikes are great for Hyde Park, South Bank, and the City. Dock every 30 min to avoid overage charges.', app: 'Santander Cycles' },
      { name: 'Uber / Bolt', type: 'rideshare', recommended: false, costRange: '£8–£25', tip: 'Only for late nights or groups of 3+. Bolt is usually 15–20% cheaper than Uber for the same route.', app: 'Bolt' },
    ],
    proTip: 'Use a contactless Visa/Mastercard instead of Oyster — same daily cap, no deposit to worry about. The system auto-calculates the cheapest fare.',
  },
  {
    destination: 'Bali',
    airportToCity: 'There is NO public transit from Ngurah Rai airport. Pre-book a Grab (~Rp 80,000–150,000 to Seminyak/Ubud, 30–90 min). The airport taxi mafia charges 2–3x more — walk past them to the Grab pickup zone.',
    bestApp: 'Grab',
    avoidApp: 'Bluebird Taxi app — works okay in Jakarta but drivers in Bali rarely accept rides',
    options: [
      { name: 'Scooter Rental', type: 'bike', recommended: true, costRange: 'Rp 70,000–100,000/day ($4.50–$6.50)', tip: 'The real way to get around Bali. Essential for Ubud and Canggu. Get an international driving permit first — police checkpoints target tourists.', },
      { name: 'Grab', type: 'rideshare', recommended: true, costRange: 'Rp 30,000–150,000 ($2–$10)', tip: 'Grab is 50–70% cheaper than local "transport" touts. Works everywhere except some parts of Ubud where drivers face local pushback.', app: 'Grab' },
      { name: 'Private Driver (day hire)', type: 'rideshare', recommended: true, costRange: 'Rp 500,000–700,000/day ($32–$45)', tip: 'Hire a driver for full-day temple tours or cross-island trips. Ask your hotel — they always know someone. Best value for groups.', },
      { name: 'Perama Shuttle', type: 'bus', recommended: false, costRange: 'Rp 50,000–125,000 ($3.20–$8)', tip: 'Budget shuttles between tourist hubs (Kuta, Ubud, Sanur, Lovina). Slow and infrequent but absurdly cheap for long distances.', },
    ],
    proTip: 'Bali has zero public transit infrastructure. You need either a scooter or Grab for everything. Budget Rp 100,000–200,000/day ($6.50–$13) for transport — it\'s unavoidable.',
  },
  {
    destination: 'Istanbul',
    airportToCity: 'New Istanbul Airport: take the Havaist bus to Taksim or Sultanahmet (~₺140, 60–90 min). The metro extension (M11) now reaches Gayrettepe — transfer to M2 for Taksim. Taxis are ₺400–600 and drivers routinely overcharge tourists.',
    bestApp: 'Moovit',
    avoidApp: 'Regular taxis without BiTaksi app — meter scams are rampant near tourist areas',
    options: [
      { name: 'Istanbul Metro', type: 'metro', recommended: true, costRange: '₺15 flat ($0.45)', tip: 'Fast and expanding rapidly. M2 line covers Taksim to old city via Marmaray tunnel. Absurdly cheap.', passOption: 'Istanbulkart — tap card, works on ALL transit (metro, bus, tram, ferry). Get one immediately.' },
      { name: 'Tram (T1 Kabataş–Bağcılar)', type: 'tram', recommended: true, costRange: '₺15 flat ($0.45)', tip: 'The T1 tram is a tourist lifeline: Kabataş → Sultanahmet → Grand Bazaar. Runs every 3 min.', passOption: 'Istanbulkart' },
      { name: 'Ferry', type: 'ferry', recommended: true, costRange: '₺15 flat ($0.45)', tip: 'The commuter ferries across the Bosphorus are the best €0.45 you\'ll ever spend. Eminönü → Kadıköy is an absolute must.', passOption: 'Istanbulkart' },
      { name: 'BiTaksi', type: 'rideshare', recommended: false, costRange: '₺100–₺300 ($3–$9)', tip: 'Use BiTaksi app to avoid meter fraud. Never hail a cab near Sultanahmet or Taksim Square — the scam rate is nearly 100%.', app: 'BiTaksi' },
    ],
    proTip: 'Get an Istanbulkart at any metro station kiosk (₺70 for the card). It works on metro, tram, bus, ferry, and even the funicular. Transfers within 2 hours get a discount.',
  },
  {
    destination: 'Mexico City',
    airportToCity: 'AICM (Benito Juárez): take the Metrobús Line 4 from Terminal 1 to Centro Histórico (MXN $6, 30 min). Or Uber to Roma/Condesa (~MXN $120–200, 20–40 min). NEVER take a random taxi at the airport — use authorized Sitio taxis (prepaid inside terminal) or Uber.',
    bestApp: 'Uber',
    avoidApp: 'Street taxis (peseros/colectivos) — safety concerns for tourists, especially at night',
    options: [
      { name: 'Metro', type: 'metro', recommended: true, costRange: 'MXN $5 flat ($0.30)', tip: 'One of the cheapest metros on Earth. 12 lines covering the whole city. Avoid rush hour (7–9am, 6–8pm) — it gets crushingly packed.', passOption: 'Rechargeable Metro card (MXN $15 at any station)' },
      { name: 'Metrobús (BRT)', type: 'bus', recommended: true, costRange: 'MXN $6 flat ($0.35)', tip: 'Bus rapid transit with dedicated lanes. Line 1 (Insurgentes) is faster than driving. Clean and reliable.', passOption: 'Metrobús card (MXN $16 + fare)' },
      { name: 'Uber', type: 'rideshare', recommended: true, costRange: 'MXN $50–$200 ($3–$12)', tip: 'Essential for late nights and neighborhoods not well-served by metro. Cheap by global standards. Didi also works and is sometimes cheaper.', app: 'Uber' },
      { name: 'Ecobici Bike Share', type: 'bike', recommended: false, costRange: 'MXN $592/year or MXN $131/week ($7.80/week)', tip: 'Great in Roma, Condesa, and Polanco where bike lanes exist. Skip it elsewhere — CDMX drivers are aggressive.', app: 'Ecobici' },
    ],
    proTip: 'The Metro costs $0.30 per ride — that\'s not a typo. Use it aggressively during the day. Switch to Uber after 10pm for safety, especially in unfamiliar neighborhoods.',
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers — case-insensitive, partial-match
// ---------------------------------------------------------------------------

function normalizeDestination(input: string): string {
  return input.trim().toLowerCase();
}

function findGuide(destination: string): TransitGuide | null {
  const query = normalizeDestination(destination);
  const found = TRANSIT_GUIDES.find((g) => {
    const name = g.destination.toLowerCase();
    return name === query || query.includes(name) || name.includes(query);
  });
  return found ?? null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get the full transit guide for a destination, or null if not covered. */
export function getTransitGuide(destination: string): TransitGuide | null {
  return findGuide(destination);
}

/** Get only the recommended transit options for a destination. */
export function getRecommendedTransit(destination: string): ReadonlyArray<TransitOption> {
  const guide = findGuide(destination);
  if (!guide) return [];
  return guide.options.filter((o) => o.recommended);
}

/** Get the airport-to-city transfer instructions for a destination. */
export function getAirportTransfer(destination: string): string {
  const guide = findGuide(destination);
  if (!guide) return '';
  return guide.airportToCity;
}

/** Get all covered destination names. */
export function getCoveredDestinations(): ReadonlyArray<string> {
  return TRANSIT_GUIDES.map((g) => g.destination);
}
