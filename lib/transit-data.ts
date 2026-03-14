// =============================================================================
// ROAM — Transit Intelligence Data
// The "Budapest problem": solo traveler lands at 11pm, doesn't know
// how to get to their hostel, what card to tap, or what the metro map means.
// This module solves it for every destination.
// =============================================================================

export interface TransitLine {
  name: string;
  color: string;        // hex for UI rendering
  type: 'metro' | 'tram' | 'bus' | 'ferry' | 'rail' | 'brt';
  usefulFor: string;    // "Airport to city center" or "Crosses entire downtown"
}

export interface TransitPayment {
  method: string;       // "IC Card (Suica/Pasmo)"
  howToGet: string;     // "Buy at any station machine — ¥500 deposit"
  cost: string;         // "¥500 deposit + load"
  tap: boolean;         // contactless tap?
  tip: string;          // "Get Suica, not Pasmo — works everywhere including vending machines"
}

export interface AirportTransfer {
  name: string;
  type: 'train' | 'bus' | 'metro' | 'shuttle' | 'taxi' | 'rideshare' | 'brt';
  cost: string;
  duration: string;
  schedule: string;     // "Every 15 min, last train 11:30pm"
  tip: string;
}

export interface TransitGuide {
  city: string;
  country: string;
  /** The single most important thing a first-timer needs to know */
  headline: string;
  /** Main transit lines a tourist should know */
  lines: TransitLine[];
  /** How to pay for transit */
  payment: TransitPayment[];
  /** Airport → city options */
  airportTransfers: AirportTransfer[];
  /** Late-night options (after midnight) */
  lateNight: string;
  /** Common tourist mistakes */
  mistakes: string[];
  /** Google Maps accuracy for transit */
  googleMapsWorks: boolean;
  googleMapsNote: string;
}

// ---------------------------------------------------------------------------
// Transit data for every ROAM destination
// ---------------------------------------------------------------------------

const TRANSIT_GUIDES: TransitGuide[] = [
  {
    city: 'Tokyo',
    country: 'JP',
    headline: 'Get a Suica card. Tap everything. The metro is your best friend.',
    lines: [
      { name: 'Yamanote Line', color: '#80C241', type: 'rail', usefulFor: 'Loop connecting all major districts — Shibuya, Shinjuku, Ikebukuro, Ueno, Tokyo Station' },
      { name: 'Tokyo Metro', color: '#00A7DB', type: 'metro', usefulFor: 'Goes everywhere. Ginza Line (orange) is the tourist workhorse.' },
      { name: 'Toei Subway', color: '#E85298', type: 'metro', usefulFor: 'Covers gaps the Metro misses. Oedo Line is a deep loop.' },
    ],
    payment: [
      { method: 'Suica / Pasmo (IC Card)', howToGet: 'Buy at any JR station machine — ¥500 deposit', cost: '¥500 deposit + load as needed', tap: true, tip: 'Get Suica, not Pasmo — both work everywhere but Suica is the standard. Works in convenience stores and vending machines too.' },
      { method: 'Apple Wallet Suica', howToGet: 'Add directly in Apple Wallet — no physical card needed', cost: 'Load from credit card', tap: true, tip: 'Best option for iPhone users. Load before you land.' },
    ],
    airportTransfers: [
      { name: 'Narita Express (N\'EX)', type: 'train', cost: '¥3,250', duration: '60 min to Tokyo Station', schedule: 'Every 30 min, last train ~9:45pm', tip: 'Book the N\'EX Tokyo Round Trip for ¥4,070 — saves money on the return.' },
      { name: 'Skyliner (Keisei)', type: 'train', cost: '¥2,520', duration: '36 min to Ueno', schedule: 'Every 20 min, last train ~10:30pm', tip: 'Fastest option if staying near Ueno or Asakusa.' },
      { name: 'Access Express', type: 'train', cost: '¥1,270', duration: '55 min to Asakusa', schedule: 'Every 20 min', tip: 'Budget option. No reserved seats but rarely crowded.' },
      { name: 'Limousine Bus', type: 'bus', cost: '¥3,200', duration: '75-90 min to Shinjuku', schedule: 'Every 20 min, runs until ~11pm', tip: 'Best for Shinjuku/Ikebukuro hotels — drops right at the door.' },
    ],
    lateNight: 'Trains stop at midnight. After that: taxi (expensive, ~¥8,000-15,000 from Shinjuku to Shibuya is rare but some areas), night buses, or wait for the 5am first train at a manga café or izakaya.',
    mistakes: [
      'Taking a taxi from Narita — it\'s ¥20,000-30,000',
      'Not getting a Suica before leaving the airport',
      'Trying to use Google Maps in subway stations — GPS doesn\'t work underground. Check your route before descending.',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Excellent. Shows real-time departures, platform numbers, and walking transfers. Use it.',
  },
  {
    city: 'Paris',
    country: 'FR',
    headline: 'The Métro goes everywhere. Buy a Navigo Easy card and load 10-packs.',
    lines: [
      { name: 'Métro Line 1', color: '#FFCD00', type: 'metro', usefulFor: 'Crosses the city east-west: La Défense → Châtelet → Bastille → Nation' },
      { name: 'Métro Line 4', color: '#BE418D', type: 'metro', usefulFor: 'North-south: Gare du Nord → Châtelet → Saint-Germain → Montparnasse' },
      { name: 'RER B', color: '#5291CE', type: 'rail', usefulFor: 'Airport (CDG) to city center. Also serves Gare du Nord.' },
    ],
    payment: [
      { method: 'Navigo Easy', howToGet: 'Buy at any Métro station ticket machine — €2 for the card', cost: '€2 card + tickets', tap: true, tip: 'Load a carnet of 10 tickets (t+) for €16.90. Each ride is €1.69 vs €2.15 single.' },
      { method: 'Contactless bank card', howToGet: 'Just tap your Visa/Mastercard at turnstiles', cost: '€2.15/ride, daily cap at ~€8', tap: true, tip: 'Easiest option — no card to buy. Daily cap means unlimited rides after ~4 trips.' },
    ],
    airportTransfers: [
      { name: 'RER B', type: 'train', cost: '€11.45', duration: '35 min CDG → Châtelet', schedule: 'Every 10-15 min, runs 5am-midnight', tip: 'Watch your bags — pickpockets target tourists on the RER B. Keep backpack in front.' },
      { name: 'Roissybus', type: 'bus', cost: '€16.20', duration: '60-75 min to Opéra', schedule: 'Every 15-20 min', tip: 'Slower but more comfortable than RER B. Good if you have big luggage.' },
      { name: 'Taxi', type: 'taxi', cost: '€55 flat rate (Right Bank) / €62 (Left Bank)', duration: '45-75 min', schedule: '24/7', tip: 'Flat rate is law — don\'t let them meter it. Right Bank = north of Seine.' },
    ],
    lateNight: 'Métro stops ~1am (2am Fri/Sat). Noctilien night buses run all night on major routes. Uber/Bolt are reliable.',
    mistakes: [
      'Taking a taxi from CDG without knowing the flat rate — you\'ll get scammed',
      'Buying single tickets instead of a 10-pack',
      'Standing on the left side of escalators — Parisians will glare',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for Métro. RER timing can be off. Citymapper is more accurate for Paris.',
  },
  {
    city: 'Bali',
    country: 'ID',
    headline: 'No public transit. Rent a scooter or use Grab. That\'s it.',
    lines: [],
    payment: [
      { method: 'Grab (ride-hailing)', howToGet: 'Download Grab app, link card or use cash', cost: 'Varies — Seminyak to Ubud ~150k IDR ($10)', tap: false, tip: 'Always use Grab, not street taxis. Drivers will quote 3x the real price otherwise.' },
      { method: 'Scooter rental', howToGet: 'Rent from your hotel or any rental shop', cost: '60-80k IDR/day ($4-5)', tap: false, tip: 'Get an international driving permit before you go. Most travel insurance won\'t cover scooter accidents without one.' },
    ],
    airportTransfers: [
      { name: 'Grab', type: 'rideshare', cost: '~100-200k IDR ($7-13)', duration: '20-60 min depending on destination', schedule: '24/7', tip: 'Walk to the pickup zone outside arrivals — drivers can\'t enter the terminal area.' },
      { name: 'Airport taxi (official)', type: 'taxi', cost: '~150-300k IDR', duration: '20-60 min', schedule: '24/7', tip: 'Use the official taxi counter inside arrivals. Refuse anyone who approaches you in the terminal.' },
    ],
    lateNight: 'Grab works until late but surge pricing after midnight. Arrange return transport with your driver before going out.',
    mistakes: [
      'Renting a scooter without an international driving permit — police checkpoints are common and fines are ~500k IDR',
      'Using a metered taxi that "accidentally" takes the long route',
      'Not negotiating the price before getting in a non-app taxi',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works for driving/scooter routes. No public transit to map.',
  },
  {
    city: 'New York',
    country: 'US',
    headline: 'Subway runs 24/7. Get an OMNY tap or use contactless.',
    lines: [
      { name: '1/2/3 (Red)', color: '#EE352E', type: 'metro', usefulFor: 'West side: Times Square, Penn Station, WTC, Brooklyn' },
      { name: '4/5/6 (Green)', color: '#00933C', type: 'metro', usefulFor: 'East side: Grand Central, Union Square, Brooklyn Bridge' },
      { name: 'L Train', color: '#A7A9AC', type: 'metro', usefulFor: 'Crosstown: Union Square → Williamsburg, Brooklyn' },
      { name: 'N/Q/R/W (Yellow)', color: '#FCCC0A', type: 'metro', usefulFor: 'Broadway: Times Square, Herald Square, Canal St, Astoria' },
    ],
    payment: [
      { method: 'OMNY (contactless)', howToGet: 'Just tap your phone or contactless card at the turnstile', cost: '$2.90/ride, capped at $34/week', tap: true, tip: 'Best option — no card to buy. Weekly cap means unlimited after 12 rides.' },
      { method: 'MetroCard', howToGet: 'Buy at station vending machines', cost: '$2.90/ride or $34/week unlimited', tap: false, tip: 'Only get this if your card doesn\'t have contactless. OMNY is better.' },
    ],
    airportTransfers: [
      { name: 'AirTrain + Subway (JFK)', type: 'train', cost: '$10.50 total', duration: '60-75 min to Midtown', schedule: '24/7 (AirTrain every 5-10 min)', tip: 'Take AirTrain to Jamaica, then E train to Midtown. Cheapest option by far.' },
      { name: 'NYC Airporter / Bus', type: 'bus', cost: '$19', duration: '45-75 min', schedule: 'Every 20-30 min', tip: 'Good for Grand Central, Port Authority, or Penn Station direct.' },
      { name: 'Taxi (flat rate)', type: 'taxi', cost: '$70 flat + tolls + tip (~$85-95)', duration: '40-60 min', schedule: '24/7', tip: 'Flat rate from JFK to Manhattan is law. Don\'t let them meter it.' },
    ],
    lateNight: 'Subway runs 24/7 but trains are less frequent after midnight (every 15-20 min). Uber/Lyft are everywhere.',
    mistakes: [
      'Taking a taxi from JFK without knowing it\'s a $70 flat rate — you\'ll get a scenic detour',
      'Standing on the left side of the escalator — New Yorkers walk on the left',
      'Trying to hail an Uber at the airport — use the rideshare pickup zone',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Excellent for subway. Shows real-time arrivals and service alerts.',
  },
  {
    city: 'Barcelona',
    country: 'ES',
    headline: 'The metro is clean, fast, and covers everything. Get a T-casual card.',
    lines: [
      { name: 'L1 (Red)', color: '#E1251B', type: 'metro', usefulFor: 'Hospital de Bellvitge → Fondo. Hits Arc de Triomf, Plaça Catalunya.' },
      { name: 'L3 (Green)', color: '#33A23D', type: 'metro', usefulFor: 'Tourist line: Diagonal, Passeig de Gràcia, Plaça Catalunya, Drassanes (Ramblas)' },
      { name: 'L4 (Yellow)', color: '#FFAA00', type: 'metro', usefulFor: 'Barceloneta beach, Passeig de Gràcia, Via Laietana' },
    ],
    payment: [
      { method: 'T-casual (10 trips)', howToGet: 'Buy at any metro station machine', cost: '€11.35 for 10 trips in Zone 1', tap: false, tip: 'Best value for tourists — that\'s €1.14/ride vs €2.40 single. Can\'t be shared between people.' },
      { method: 'Hola BCN! Travel Card', howToGet: 'Buy online or at airport metro station', cost: '€17.50 (48h) / €25.50 (72h) / €35.50 (96h)', tap: true, tip: 'Unlimited rides including airport metro. Worth it for 3+ days.' },
    ],
    airportTransfers: [
      { name: 'Aerobus', type: 'bus', cost: '€7.75', duration: '35 min to Plaça Catalunya', schedule: 'Every 5 min, runs 5:30am-1am', tip: 'Most reliable option. Stops at Plaça Espanya and Plaça Catalunya.' },
      { name: 'Metro L9 Sud', type: 'metro', cost: '€5.50 (special airport fare)', duration: '30-40 min to Zona Universitària, transfer to L3', schedule: '5am-midnight', tip: 'Cheaper than Aerobus but requires a transfer. Not on the T-casual.' },
      { name: 'Taxi', type: 'taxi', cost: '€39 flat rate', duration: '25-40 min', schedule: '24/7', tip: 'Flat rate from airport to city center. Reliable.' },
    ],
    lateNight: 'Metro closes at midnight (2am Fri/Sat). NitBus night buses run all night. Taxis are affordable.',
    mistakes: [
      'Buying single metro tickets — a T-casual is half the price per ride',
      'Walking down La Rambla with your phone out — pickpocket central',
      'Not validating your T-casual when entering — you\'ll get fined €100',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good. TMB app is better for real-time metro arrivals.',
  },
  {
    city: 'Rome',
    country: 'IT',
    headline: 'Two metro lines. That\'s it. Walk everywhere — Rome is best on foot.',
    lines: [
      { name: 'Metro A (Orange)', color: '#F68B1F', type: 'metro', usefulFor: 'Spanish Steps, Vatican, Termini Station' },
      { name: 'Metro B (Blue)', color: '#0072BC', type: 'metro', usefulFor: 'Colosseum, Termini, Piramide (Testaccio)' },
    ],
    payment: [
      { method: 'BIT ticket', howToGet: 'Buy at tabacchi shops or station machines', cost: '€1.50 for 100 min', tap: false, tip: 'Valid for 100 min including one metro ride + unlimited bus. Buy a stack at a tabacchi.' },
      { method: 'Roma 48/72h pass', howToGet: 'Station machines or online', cost: '€12.50 (48h) / €18 (72h)', tap: false, tip: 'Worth it if you plan to use transit heavily. Most of Rome is walkable though.' },
    ],
    airportTransfers: [
      { name: 'Leonardo Express', type: 'train', cost: '€14', duration: '32 min FCO → Termini', schedule: 'Every 15 min, 6:23am-11:23pm', tip: 'Direct, no stops. The only option that makes sense from Fiumicino.' },
      { name: 'Regional train (FL1)', type: 'train', cost: '€8', duration: '45-55 min to Trastevere/Ostiense', schedule: 'Every 15 min', tip: 'Cheaper if your hotel is near Trastevere or Ostiense. Slower.' },
      { name: 'SIT Bus', type: 'bus', cost: '€7', duration: '60 min to Termini', schedule: 'Every 30 min', tip: 'Budget option but slower. Book online for a seat.' },
    ],
    lateNight: 'Metro stops at 11:30pm (1:30am Fri/Sat). Night buses exist but are unreliable. Taxi or walk.',
    mistakes: [
      'Not validating your bus ticket on board — inspectors fine €50+',
      'Taking a taxi from FCO without checking the meter is running — flat rate is €50 to city center',
      'Expecting the metro to be convenient — it only has 2 lines, most sights are faster on foot',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'OK for metro routes. Bus timing is unreliable on all apps. Trust the metro, walk the rest.',
  },
  {
    city: 'London',
    country: 'GB',
    headline: 'Contactless card on the Tube. That\'s literally all you need.',
    lines: [
      { name: 'Central (Red)', color: '#DC241F', type: 'metro', usefulFor: 'East-west: Liverpool Street, Oxford Circus, Notting Hill' },
      { name: 'Northern (Black)', color: '#000000', type: 'metro', usefulFor: 'North-south: Camden, King\'s Cross, Bank, London Bridge' },
      { name: 'Piccadilly (Blue)', color: '#003688', type: 'metro', usefulFor: 'Heathrow airport, Covent Garden, King\'s Cross' },
      { name: 'Elizabeth Line', color: '#6950A1', type: 'rail', usefulFor: 'New crossrail: Heathrow → Paddington → Liverpool Street → Canary Wharf' },
    ],
    payment: [
      { method: 'Contactless bank card', howToGet: 'Just tap your card at the barrier', cost: '£2.80/ride Zone 1, daily cap £8.10', tap: true, tip: 'Best option. Daily and weekly caps mean you never overpay. No Oyster card needed.' },
      { method: 'Oyster Card', howToGet: 'Buy at any station, £7 deposit', cost: '£2.80/ride Zone 1, same caps as contactless', tap: true, tip: 'Only get this if your bank card doesn\'t have contactless (unlikely in 2026).' },
    ],
    airportTransfers: [
      { name: 'Elizabeth Line (Heathrow)', type: 'train', cost: '£12.80', duration: '30-40 min to Paddington', schedule: 'Every 5-10 min, 5am-midnight', tip: 'New, fast, cheap. No reason to take Heathrow Express anymore.' },
      { name: 'Piccadilly Line (Heathrow)', type: 'metro', cost: '£5.50 (off-peak contactless)', duration: '50-60 min to central', schedule: 'Every 3-5 min, 5am-midnight', tip: 'Cheapest option. Slow but goes directly to Covent Garden, Leicester Square.' },
      { name: 'Gatwick Express', type: 'train', cost: '£19.90', duration: '30 min to Victoria', schedule: 'Every 15 min', tip: 'Overpriced. Thameslink is half the price and only 10 min slower.' },
    ],
    lateNight: 'Night Tube runs Fri/Sat on Central, Jubilee, Northern, Piccadilly, Victoria lines. Otherwise bus network runs 24/7.',
    mistakes: [
      'Taking the Heathrow Express — £25 when the Elizabeth Line is £12.80 and almost as fast',
      'Buying an Oyster card when your bank card already has contactless',
      'Standing on the left of escalators — you will be told to move',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Excellent. Real-time Tube data. Citymapper also excellent for London.',
  },
  {
    city: 'Bangkok',
    country: 'TH',
    headline: 'BTS Skytrain + MRT Metro for central Bangkok. Grab for everything else.',
    lines: [
      { name: 'BTS Sukhumvit Line', color: '#79BD46', type: 'rail', usefulFor: 'Siam, Asok, Phrom Phong, Mo Chit (Chatuchak Market)' },
      { name: 'BTS Silom Line', color: '#79BD46', type: 'rail', usefulFor: 'Siam, Sala Daeng, Saphan Taksin (river boats)' },
      { name: 'MRT Blue Line', color: '#2E4491', type: 'metro', usefulFor: 'Chatuchak, Sukhumvit, Chinatown (Wat Mangkon)' },
    ],
    payment: [
      { method: 'Rabbit Card (BTS)', howToGet: 'Buy at any BTS station, ฿100 deposit + ฿100 min load', cost: '฿100 deposit + fares ฿17-62/ride', tap: true, tip: 'Only works on BTS, not MRT. Yes, it\'s annoying. They\'re different systems.' },
      { method: 'MRT Token/Card', howToGet: 'Buy tokens at MRT machines', cost: '฿17-42/ride', tap: false, tip: 'Tokens for single rides, stored-value card for frequent use. Doesn\'t work on BTS.' },
      { method: 'Grab', howToGet: 'Download app, link card or use cash', cost: 'Varies — ฿50-200 for most trips', tap: false, tip: 'Use for anything BTS/MRT don\'t reach. Cheaper than taxis.' },
    ],
    airportTransfers: [
      { name: 'Airport Rail Link', type: 'train', cost: '฿45', duration: '30 min to Makkasan (connect to MRT)', schedule: 'Every 10-15 min, 6am-midnight', tip: 'Cheapest and fastest from Suvarnabhumi. Transfer to MRT at Makkasan/Phetchaburi.' },
      { name: 'Grab', type: 'rideshare', cost: '฿300-500', duration: '30-60 min to central', schedule: '24/7', tip: 'Walk to the public pickup zone level 2. Don\'t use the taxi counter — Grab is cheaper.' },
      { name: 'Don Mueang: A1 Bus', type: 'bus', cost: '฿30', duration: '45 min to Mo Chit BTS', schedule: 'Every 10-20 min', tip: 'From Don Mueang airport to Mo Chit BTS. Then BTS anywhere.' },
    ],
    lateNight: 'BTS/MRT stop at midnight. After that: Grab, taxis (insist on meter), or tuk-tuks (agree price first).',
    mistakes: [
      'Taking a tuk-tuk from the airport — they\'ll charge 10x the real fare',
      'Not insisting taxi drivers use the meter — say "meter" before getting in',
      'Expecting Rabbit Card to work on MRT — two separate systems, two separate cards',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for BTS/MRT routes. Less reliable for buses. Grab has better traffic-aware ETAs.',
  },
  {
    city: 'Marrakech',
    country: 'MA',
    headline: 'No metro. Walk the medina, taxi everywhere else. Agree on price first.',
    lines: [],
    payment: [
      { method: 'Petit taxi (small red taxis)', howToGet: 'Flag down anywhere', cost: '20-50 MAD for most trips in the city', tap: false, tip: 'ALWAYS agree on the price before getting in. They don\'t use meters for tourists. 30 MAD should get you anywhere within the medina area.' },
      { method: 'Grand taxi (shared)', howToGet: 'Find at designated stands', cost: '5-10 MAD per person for shared routes', tap: false, tip: 'Shared with other passengers on fixed routes. Cheap but less convenient.' },
    ],
    airportTransfers: [
      { name: 'Bus 19', type: 'bus', cost: '30 MAD', duration: '20-30 min to Jemaa el-Fnaa', schedule: 'Every 30 min, 6am-11pm', tip: 'Cheapest option. Drops at Jemaa el-Fnaa — walk to your riad from there.' },
      { name: 'Petit taxi', type: 'taxi', cost: '100-150 MAD (negotiate!)', duration: '15-20 min', schedule: '24/7', tip: 'Agree on 100 MAD before you get in. They\'ll start at 200. Walk away if they won\'t negotiate.' },
    ],
    lateNight: 'Petit taxis run late but are harder to find after midnight near the medina. Arrange a pickup through your riad.',
    mistakes: [
      'Not agreeing on a taxi price before getting in — you\'ll pay triple',
      'Expecting Google Maps to work in the medina — the alleys aren\'t all mapped',
      'Following "helpful" locals who offer to guide you to your riad — they\'ll charge you or lead you to a shop',
    ],
    googleMapsWorks: false,
    googleMapsNote: 'Works outside the medina. Inside the medina, it\'s unreliable — alleys change, GPS bounces. Use Maps.me offline or ask locals.',
  },
  {
    city: 'Lisbon',
    country: 'PT',
    headline: 'Metro + trams + walking. Buy a Viva Viagem card. Watch for hills.',
    lines: [
      { name: 'Metro Blue', color: '#0060AE', type: 'metro', usefulFor: 'Airport → Baixa/Chiado. The tourist lifeline.' },
      { name: 'Metro Green', color: '#00A651', type: 'metro', usefulFor: 'Cais do Sodré (food market) → Rossio → Anjos' },
      { name: 'Tram 28', color: '#FFD700', type: 'tram', usefulFor: 'Iconic route through Alfama, Graça, Baixa — tourist must-do but always packed' },
    ],
    payment: [
      { method: 'Viva Viagem Card', howToGet: 'Buy at metro stations — €0.50 for the card', cost: '€0.50 card + €1.65/ride (loaded with Zapping)', tap: true, tip: 'Load with "Zapping" (pay-as-you-go) — €1.65/ride on metro, tram, bus. Way cheaper than single tickets.' },
      { method: '24h pass', howToGet: 'Load onto Viva Viagem at any station', cost: '€6.80', tap: true, tip: 'Unlimited metro, bus, tram, elevadors for 24h. Worth it if you ride 5+ times.' },
    ],
    airportTransfers: [
      { name: 'Metro Red Line', type: 'metro', cost: '€1.65 (Zapping)', duration: '20 min to Alameda, transfer to Green', schedule: 'Every 5-8 min, 6:30am-1am', tip: 'Cheapest and easiest. Airport station is right in the terminal.' },
      { name: 'Aerobus', type: 'bus', cost: '€4', duration: '30-40 min to Cais do Sodré', schedule: 'Every 20 min', tip: 'Good if you\'re staying near Cais do Sodré. More comfortable with luggage.' },
    ],
    lateNight: 'Metro closes at 1am. Night buses run limited routes. Uber/Bolt are cheap and everywhere.',
    mistakes: [
      'Riding Tram 28 during the day — it\'s a sardine can. Go early morning or take it just for 2-3 stops.',
      'Not loading Zapping on your Viva Viagem — single tickets are way more expensive',
      'Wearing slippery shoes — the hills and cobblestones are real',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works well for metro and walking. Bus timing can be off.',
  },
  {
    city: 'Seoul',
    country: 'KR',
    headline: 'One of the best metro systems on Earth. Get a T-money card.',
    lines: [
      { name: 'Line 1 (Blue)', color: '#263C96', type: 'metro', usefulFor: 'Seoul Station, City Hall, Jongno' },
      { name: 'Line 2 (Green)', color: '#33A23D', type: 'metro', usefulFor: 'Loop line: Hongdae, Gangnam, Jamsil, Dongdaemun' },
      { name: 'Line 3 (Orange)', color: '#FE5B00', type: 'metro', usefulFor: 'Gyeongbokgung, Anguk (Bukchon)' },
    ],
    payment: [
      { method: 'T-money Card', howToGet: 'Buy at any convenience store (CU, GS25) — ₩2,500', cost: '₩2,500 + load. Rides are ₩1,400', tap: true, tip: 'Works on metro, bus, taxi, and convenience stores. Load at any store or station.' },
    ],
    airportTransfers: [
      { name: 'AREX (Airport Express)', type: 'train', cost: '₩9,500 (express) / ₩4,750 (all-stop)', duration: '43 min express / 66 min all-stop to Seoul Station', schedule: 'Every 30-40 min (express), every 6 min (all-stop)', tip: 'All-stop is half the price and uses T-money. Express is only worth it if you\'re in a rush.' },
      { name: 'Airport Limousine Bus', type: 'bus', cost: '₩17,000-18,000', duration: '60-90 min', schedule: 'Every 15-30 min', tip: 'Goes directly to major hotels. Comfortable with luggage. Best if your hotel is on the route.' },
    ],
    lateNight: 'Metro runs until ~midnight. After: Kakao T (Korean Uber), late-night buses, or a jjimjilbang (bathhouse with sleeping rooms, ~₩15,000).',
    mistakes: [
      'Not getting a T-money card at the airport convenience store — you\'ll need it everywhere',
      'Taking the AREX express when the all-stop is half the price',
      'Not downloading Naver Map — Google Maps works but Naver Map is more accurate for Korea',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works but Naver Map and KakaoMap are significantly better for Korea. Download Naver Map.',
  },
  {
    city: 'Budapest',
    country: 'HU',
    headline: 'Trams are the move. Metro is old-school but works. Get a Budapest Card or 24h pass.',
    lines: [
      { name: 'M1 (Yellow)', color: '#FFD800', type: 'metro', usefulFor: 'Oldest metro in continental Europe. Runs under Andrássy Avenue — Opera, Heroes\' Square.' },
      { name: 'M2 (Red)', color: '#E41E20', type: 'metro', usefulFor: 'East-west: Keleti Station → Kossuth tér (Parliament) → Déli Station' },
      { name: 'Tram 2', color: '#FFD800', type: 'tram', usefulFor: 'THE scenic route along the Danube on the Pest side. Parliament, Chain Bridge views.' },
      { name: 'Tram 4/6', color: '#FFD800', type: 'tram', usefulFor: 'Grand Boulevard loop — Oktogon, Westend, Margit Bridge. Runs 24/7.' },
    ],
    payment: [
      { method: 'BKK single ticket', howToGet: 'Buy at metro stations, tram stops, or BKK app', cost: '450 HUF (~$1.20)', tap: false, tip: 'Must validate before boarding. Inspectors are ruthless — 16,000 HUF fine (~$42).' },
      { method: '24h/72h travel card', howToGet: 'Metro stations or BKK app', cost: '2,500 HUF (24h) / 5,500 HUF (72h)', tap: false, tip: 'Unlimited metro, tram, bus. Worth it if you ride 6+ times a day. Activate when you first use it.' },
      { method: 'Budapest Card', howToGet: 'Online or tourist offices', cost: '€29 (24h) / €43 (48h) / €55 (72h)', tap: false, tip: 'Includes transit + museum entries + thermal baths. Good deal if you\'re sightseeing heavily.' },
    ],
    airportTransfers: [
      { name: 'Bus 100E', type: 'bus', cost: '2,200 HUF (~$5.80)', duration: '30-40 min to Deák Ferenc tér', schedule: 'Every 10-20 min, 4am-1:30am', tip: 'Direct to city center. Buy ticket at the BKK machine — NOT from the driver.' },
      { name: 'Bus 200E + Metro M3', type: 'bus', cost: '450 HUF (regular ticket)', duration: '50-60 min total', schedule: '4am-11pm', tip: 'Cheaper but slower. Take 200E to Kőbánya-Kispest, then M3 metro to center.' },
      { name: 'Taxi (Főtaxi)', type: 'taxi', cost: '~9,000-12,000 HUF (~$24-32)', duration: '25-40 min', schedule: '24/7', tip: 'Only use Főtaxi (the official airport taxi). Book at the counter inside arrivals. Fixed-ish rate.' },
    ],
    lateNight: 'Metro stops ~11:30pm. Tram 4/6 runs 24/7 on the Grand Boulevard. Night buses cover main routes. Bolt/Uber work.',
    mistakes: [
      'Not validating your ticket on trams/buses — plain-clothes inspectors check constantly and the fine is 16,000 HUF',
      'Taking a random taxi at the airport — only use Főtaxi from the official counter',
      'Expecting the 100E airport bus to accept a regular transit pass — it requires a special ticket',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for metro/tram. BKK Futár app is better for real-time tram and bus arrivals.',
  },
  {
    city: 'Istanbul',
    country: 'TR',
    headline: 'Istanbulkart is king. Works on everything — metro, tram, ferry, bus.',
    lines: [
      { name: 'M1A/M2 Metro', color: '#E4222C', type: 'metro', usefulFor: 'M2: Taksim → Şişhane → Airport connector' },
      { name: 'T1 Tram', color: '#0A6EB4', type: 'tram', usefulFor: 'Tourist spine: Kabataş → Sultanahmet → Beyazıt → Zeytinburnu' },
      { name: 'Bosphorus Ferry', color: '#00A0E1', type: 'ferry', usefulFor: 'Eminönü → Kadıköy. The best commute view in the world.' },
    ],
    payment: [
      { method: 'Istanbulkart', howToGet: 'Buy at metro/tram stations or kiosks — ₺50', cost: '₺50 card + load. Rides ~₺20', tap: true, tip: 'One card, everything — metro, tram, bus, ferry, even public restrooms. Load it up.' },
    ],
    airportTransfers: [
      { name: 'Havaist Bus', type: 'bus', cost: '₺140', duration: '60-90 min to Taksim', schedule: 'Every 30-45 min, 24/7', tip: 'From Istanbul Airport (IST). Multiple routes to different neighborhoods. Check which one goes near your hotel.' },
      { name: 'Metro M11', type: 'metro', cost: '~₺20 (Istanbulkart)', duration: '40 min to Gayrettepe (connect to M2)', schedule: 'Every 10-15 min, 6am-midnight', tip: 'New metro line. Cheapest option. Transfer to M2 at Gayrettepe for Taksim.' },
      { name: 'Taxi', type: 'taxi', cost: '₺700-1,000', duration: '45-75 min', schedule: '24/7', tip: 'Insist on the meter. Some drivers will try a flat rate — it\'s always more expensive.' },
    ],
    lateNight: 'Metro/tram stop around midnight. Havaist bus and taxis run 24/7. Dolmuş (shared minibus) on some routes.',
    mistakes: [
      'Not getting an Istanbulkart at the airport — you\'ll pay way more for single tickets',
      'Taking a taxi from the old airport without the meter — you\'ll get charged 3x',
      'Expecting the T1 tram to be fast — it stops every 200m and is packed during rush hour',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for metro/tram routes. Ferry schedules are better on the Şehir Hatları app.',
  },
  {
    city: 'Mexico City',
    country: 'MX',
    headline: 'Metro is absurdly cheap (₱5) and covers the city. Uber for everything else.',
    lines: [
      { name: 'Line 1 (Pink)', color: '#E9518B', type: 'metro', usefulFor: 'Chapultepec, Balderas, Salto del Agua' },
      { name: 'Line 2 (Blue)', color: '#0072BB', type: 'metro', usefulFor: 'Zócalo, Bellas Artes, Tacuba' },
      { name: 'Line 3 (Olive)', color: '#A7914F', type: 'metro', usefulFor: 'Hidalgo, Coyoacán (south), Ciudad Universitaria' },
    ],
    payment: [
      { method: 'Mi Tarjeta', howToGet: 'Buy at any metro station — free', cost: '₱5/ride (yes, five pesos ≈ $0.25)', tap: true, tip: 'Load at machines or windows. ₱100 lasts ages. Also works on Metrobús.' },
      { method: 'Uber/Didi', howToGet: 'Download app, link card', cost: 'Varies — Roma to Centro ~₱80-120', tap: false, tip: 'Use for anything outside metro coverage or at night. Didi is sometimes cheaper than Uber.' },
    ],
    airportTransfers: [
      { name: 'Metro Line 5', type: 'metro', cost: '₱5', duration: '30-40 min to centro', schedule: '5am-midnight', tip: 'Terminal 1 only. Walk to the metro entrance inside the airport. Incredibly cheap.' },
      { name: 'Metrobús Line 4', type: 'brt', cost: '₱30', duration: '30-45 min to Centro/Buenavista', schedule: '4:30am-midnight', tip: 'From Terminal 1 or Terminal 2. More comfortable than metro with luggage.' },
      { name: 'Uber/Didi', type: 'rideshare', cost: '₱200-400', duration: '30-60 min', schedule: '24/7', tip: 'Order from the rideshare pickup zone. Much cheaper than official taxis.' },
    ],
    lateNight: 'Metro closes at midnight. Uber/Didi are safe and affordable 24/7. Avoid street taxis at night.',
    mistakes: [
      'Taking an official airport taxi — they charge ₱300-500 when Uber is ₱150-200',
      'Carrying valuables on the metro during rush hour — pickpockets are skilled',
      'Not having cash for the metro — machines sometimes only accept coins',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for metro routes. Traffic ETAs for Uber/taxi are accurate.',
  },
  {
    city: 'Amsterdam',
    country: 'NL',
    headline: 'Rent a bike. Seriously. Also, trams are great and accept contactless.',
    lines: [
      { name: 'Tram 2', color: '#FFFFFF', type: 'tram', usefulFor: 'Central Station → Rijksmuseum → Vondelpark → Zuid' },
      { name: 'Tram 5', color: '#FFFFFF', type: 'tram', usefulFor: 'Central Station → Leidseplein → Museumplein' },
      { name: 'Metro 52 (Noord/Zuidlijn)', color: '#FFD700', type: 'metro', usefulFor: 'Central Station → Vijzelgracht → Zuid. New line, fast.' },
    ],
    payment: [
      { method: 'OV-chipkaart', howToGet: 'Buy anonymous card at stations — €7.50', cost: '€7.50 card + load. Rides ~€1-3', tap: true, tip: 'Works on all Dutch transit — trams, buses, metros, trains nationwide.' },
      { method: 'Contactless', howToGet: 'Tap bank card at the reader', cost: '~€1-3/ride', tap: true, tip: 'Now works on all GVB transit. Check-in AND check-out required or you\'re charged max fare.' },
      { method: 'Bike rental', howToGet: 'MacBike, Donkey Republic, or Swapfiets', cost: '€8-15/day', tap: false, tip: 'This is how locals get around. Lock both frame and wheel or it will be stolen.' },
    ],
    airportTransfers: [
      { name: 'Sprinter train', type: 'train', cost: '€5.70', duration: '15 min to Centraal', schedule: 'Every 10 min, 6am-1am', tip: 'Follow signs to "Trains" in the airport. The platform is right there. Fastest and cheapest.' },
      { name: 'Bus 397', type: 'bus', cost: '€6.50', duration: '30 min to Leidseplein/Rijksmuseum', schedule: 'Every 15 min', tip: 'Good if you\'re staying near the museum quarter.' },
    ],
    lateNight: 'Trams/metros stop ~12:30am. Night buses run limited routes. Uber is reliable but taxis are expensive.',
    mistakes: [
      'Not checking out when exiting tram/metro — you\'ll be charged the maximum fare',
      'Walking in the bike lane — the red-paved lanes are for bikes only and cyclists will not stop',
      'Renting a bike without a proper lock — bike theft is Amsterdam\'s real sport',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Excellent for everything including cycling routes. 9292.nl app for real-time Dutch transit.',
  },
  {
    city: 'Dubai',
    country: 'AE',
    headline: 'Metro covers the main strip. Taxi/Uber for everything else. It\'s a car city.',
    lines: [
      { name: 'Red Line', color: '#EE2737', type: 'metro', usefulFor: 'Airport → DIFC → Burj Khalifa → Marina → Ibn Battuta' },
      { name: 'Green Line', color: '#4CB848', type: 'metro', usefulFor: 'Creek area → Bur Dubai → Deira' },
    ],
    payment: [
      { method: 'Nol Card (Silver)', howToGet: 'Buy at metro stations — AED 25 (includes AED 19 credit)', cost: 'AED 25 + load. Rides AED 4-8.50', tap: true, tip: 'Works on metro, bus, tram, water bus. Gold class requires Gold Nol card.' },
      { method: 'Uber/Careem', howToGet: 'Download app', cost: 'Varies — Marina to Downtown ~AED 30-50', tap: false, tip: 'Careem is the local alternative. Both work well.' },
    ],
    airportTransfers: [
      { name: 'Metro Red Line', type: 'metro', cost: 'AED 7.50', duration: '30-40 min to downtown', schedule: '5am-midnight (Fri 10am start)', tip: 'From T1 and T3. Cheapest by far. Doesn\'t serve T2.' },
      { name: 'Taxi', type: 'taxi', cost: 'AED 50-80', duration: '15-25 min', schedule: '24/7', tip: 'Metered. Fair and reliable. Add AED 25 airport surcharge.' },
    ],
    lateNight: 'Metro stops at midnight (1am Thu/Fri). Taxis and Uber/Careem run 24/7.',
    mistakes: [
      'Sitting in the women\'s/Gold class metro carriage by accident — look at the signs, fine is AED 200',
      'Expecting to walk between places — distances in Dubai are enormous',
      'Not having a Nol card ready — you can\'t buy metro tickets with cash at machines',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for metro. RTA Journey Planner app for bus routes.',
  },
  {
    city: 'Cape Town',
    country: 'ZA',
    headline: 'Uber everywhere. MyCiti bus for the airport. Don\'t use minibus taxis as a tourist.',
    lines: [
      { name: 'MyCiti Bus', color: '#E31B23', type: 'brt', usefulFor: 'Airport, Civic Centre, Table View, Blouberg. Limited but reliable.' },
    ],
    payment: [
      { method: 'myconnect card (MyCiti)', howToGet: 'Buy at MyCiti stations — R35', cost: 'R35 + load. Rides R10-30', tap: true, tip: 'Only works on MyCiti buses. Load at stations.' },
      { method: 'Uber/Bolt', howToGet: 'Download app', cost: 'Varies — V&A to Camps Bay ~R80-120', tap: false, tip: 'Primary transport for tourists. Bolt is sometimes cheaper.' },
    ],
    airportTransfers: [
      { name: 'MyCiti Bus A01', type: 'bus', cost: 'R99', duration: '30-45 min to Civic Centre', schedule: 'Every 20 min, 5am-10pm', tip: 'Cheapest reliable option. Buy myconnect card at the airport station.' },
      { name: 'Uber/Bolt', type: 'rideshare', cost: 'R200-350', duration: '20-30 min', schedule: '24/7', tip: 'Most convenient. Use the rideshare pickup zone.' },
    ],
    lateNight: 'MyCiti buses stop by 10pm. Uber/Bolt are your only options. Avoid walking alone at night.',
    mistakes: [
      'Using minibus taxis as a tourist — the routes aren\'t marked and it can be unsafe if you don\'t know the system',
      'Walking alone after dark in the city center — Uber door to door',
      'Not having cash for tips — R10-20 for car guards, waiters',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works for Uber routing. Public transit data is limited.',
  },
  {
    city: 'Chiang Mai',
    country: 'TH',
    headline: 'No metro, no train. Red songthaew trucks and Grab. Simple.',
    lines: [],
    payment: [
      { method: 'Red songthaew (shared truck)', howToGet: 'Flag down on the street', cost: '30-50 THB per person in the city', tap: false, tip: 'Shared pickup trucks. Tell the driver where you\'re going — if they\'re headed that way, hop in. Pay when you get off.' },
      { method: 'Grab', howToGet: 'Download app', cost: 'Varies — Old City to Nimman ~40-70 THB', tap: false, tip: 'More predictable than songthaews. Use for specific destinations.' },
      { method: 'Scooter rental', howToGet: 'Rent from any shop on your street', cost: '200-300 THB/day', tap: false, tip: 'International driving permit needed. Helmet required. Police checkpoints are common.' },
    ],
    airportTransfers: [
      { name: 'Grab', type: 'rideshare', cost: '100-150 THB', duration: '15 min to Old City', schedule: '24/7', tip: 'Walk to departures level for pickup.' },
      { name: 'Airport taxi', type: 'taxi', cost: '150 THB (fixed)', duration: '15 min', schedule: '24/7', tip: 'Fixed rate from the counter inside arrivals. Fair price.' },
    ],
    lateNight: 'Red songthaews stop around 10pm. Grab works late. Arrange return transport before going out.',
    mistakes: [
      'Renting a scooter without a helmet — police fines are 500 THB',
      'Taking a tuk-tuk without agreeing on price — they\'ll charge double',
      'Expecting meter taxis — they don\'t exist here',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works for driving directions. No public transit data.',
  },
  {
    city: 'Hoi An',
    country: 'VN',
    headline: 'Walk or bike. The old town is tiny. Grab to the beach.',
    lines: [],
    payment: [
      { method: 'Walking', howToGet: 'Your feet', cost: 'Free', tap: false, tip: 'The old town is 1km across. Everything is walkable.' },
      { method: 'Bicycle rental', howToGet: 'Most hotels offer free bikes', cost: 'Free-50,000 VND/day', tap: false, tip: 'Best way to explore. Ride to An Bang Beach (4km).' },
      { method: 'Grab', howToGet: 'Download app', cost: '20,000-50,000 VND for most trips', tap: false, tip: 'Use for beach trips or Da Nang day trips.' },
    ],
    airportTransfers: [
      { name: 'Grab (from Da Nang Airport)', type: 'rideshare', cost: '200,000-300,000 VND ($8-12)', duration: '30-40 min', schedule: '24/7', tip: 'Da Nang airport serves Hoi An. Grab is the easiest way.' },
      { name: 'Hotel shuttle', type: 'shuttle', cost: 'Free-$10', duration: '30-40 min', schedule: 'Varies', tip: 'Many hotels offer free airport pickup. Ask when you book.' },
    ],
    lateNight: 'Hoi An shuts down by 11pm. Grab works but limited drivers late at night.',
    mistakes: [
      'Taking a "xe ôm" (motorbike taxi) without agreeing on price first',
      'Riding a motorbike in the old town after 8am — vehicles are banned until 11am',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works well for walking and driving. Traffic conditions accurate.',
  },
  {
    city: 'Buenos Aires',
    country: 'AR',
    headline: 'Subte (metro) + bus. Get a SUBE card. Everything is cheap.',
    lines: [
      { name: 'Line A', color: '#56B5E1', type: 'metro', usefulFor: 'Plaza de Mayo → San Telmo → Caballito' },
      { name: 'Line B', color: '#E81D2A', type: 'metro', usefulFor: 'Florida/Centro → Medrano → Federico Lacroze' },
      { name: 'Line D', color: '#1E8E3E', type: 'metro', usefulFor: 'Catedral → Palermo → Belgrano' },
    ],
    payment: [
      { method: 'SUBE card', howToGet: 'Buy at kioscos (newsstands) — ARS 500', cost: 'ARS 500 card + load. Rides ~ARS 150', tap: true, tip: 'Works on subte, bus, and commuter trains. Load at kioscos or subte stations. Mandatory for all transit.' },
    ],
    airportTransfers: [
      { name: 'Tienda León bus', type: 'bus', cost: 'ARS 6,000-8,000', duration: '40-60 min to Obelisco', schedule: 'Every 30 min', tip: 'Reliable, comfortable. Drops at Madero/Retiro area.' },
      { name: 'Taxi (official remise)', type: 'taxi', cost: 'ARS 15,000-20,000', duration: '30-45 min', schedule: '24/7', tip: 'Book at the remise counter inside the airport. Avoid anyone approaching you in the terminal.' },
      { name: 'Uber', type: 'rideshare', cost: 'ARS 8,000-12,000', duration: '30-45 min', schedule: '24/7', tip: 'Works but drivers may ask you to sit in front to avoid taxi driver conflicts.' },
    ],
    lateNight: 'Subte closes at ~11pm. Night buses (colectivos) run 24/7 on major routes. Uber/Cabify reliable.',
    mistakes: [
      'Not having a SUBE card — you literally cannot board a bus without one',
      'Paying in USD and expecting a good rate — always pay in ARS for the "blue dollar" advantage',
      'Taking a random taxi at Ezeiza — use the remise counter or Uber',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for subte. Bus routes are better on the BA Cómo Llego app.',
  },
  {
    city: 'Sydney',
    country: 'AU',
    headline: 'Opal card or contactless. Ferries are the best way to see the harbor.',
    lines: [
      { name: 'T1 North Shore', color: '#F99D1C', type: 'rail', usefulFor: 'Central → Town Hall → Wynyard → North Sydney' },
      { name: 'T4 Eastern Suburbs', color: '#005AA3', type: 'rail', usefulFor: 'Central → Kings Cross → Bondi Junction' },
      { name: 'F1 Manly Ferry', color: '#00A9A7', type: 'ferry', usefulFor: 'Circular Quay → Manly. 30 min. Best commute in Sydney.' },
    ],
    payment: [
      { method: 'Contactless (Visa/Mastercard)', howToGet: 'Tap at the reader', cost: 'Varies — $3.20-4.80/ride. Daily cap $17.80', tap: true, tip: 'Best option. Same Opal pricing, no card to buy. Tap on AND off.' },
      { method: 'Opal Card', howToGet: 'Buy online or at stations — free', cost: 'Free card + load. Rides $3.20-4.80', tap: true, tip: 'Only get this if you can\'t use contactless.' },
    ],
    airportTransfers: [
      { name: 'Airport Link train', type: 'train', cost: '$19.04 (includes station access fee)', duration: '13 min to Central', schedule: 'Every 10 min, 5am-midnight', tip: 'Fast but expensive because of the airport surcharge. Still cheaper than a taxi.' },
      { name: 'Uber', type: 'rideshare', cost: 'A$40-60', duration: '20-30 min to CBD', schedule: '24/7', tip: 'Use the rideshare pickup zone in the arrivals car park.' },
    ],
    lateNight: 'Trains run until ~1am, then NightRide buses. Uber/DiDi reliable 24/7.',
    mistakes: [
      'Not tapping off when exiting — you\'ll be charged the maximum default fare',
      'Skipping the ferry to Manly — it\'s the best harbor experience and counts as transit',
      'Paying the airport station surcharge both ways — stay at an airport-area hotel to use the surcharge-free Green Square station instead',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Excellent for all Sydney transit. TripView app for real-time train arrivals.',
  },
  {
    city: 'Kyoto',
    country: 'JP',
    headline: 'Bus city. Get a bus day pass. Trains for getting in/out.',
    lines: [
      { name: 'Kyoto Bus Network', color: '#008E5B', type: 'bus', usefulFor: 'Covers all major temples and districts. Bus 100/101/102 are tourist routes.' },
      { name: 'Karasuma Line (subway)', color: '#33A532', type: 'metro', usefulFor: 'Kyoto Station → Shijo (downtown) → Kitaoji' },
      { name: 'Tozai Line (subway)', color: '#FF6600', type: 'metro', usefulFor: 'Nijo Castle → Karasuma Oike → Higashiyama' },
    ],
    payment: [
      { method: 'Suica/ICOCA', howToGet: 'Same IC card from Tokyo works here', cost: 'Standard fares — ¥230/bus ride', tap: true, tip: 'Tap when getting OFF the bus (rear door entry, front door exit). Different from Tokyo.' },
      { method: 'Bus 1-Day Pass', howToGet: 'Buy from bus driver or station', cost: '¥700', tap: false, tip: 'Unlimited city buses for the day. Worth it if you ride 4+ times. Doesn\'t cover subway.' },
    ],
    airportTransfers: [
      { name: 'Haruka Express (from KIX)', type: 'train', cost: '¥3,640', duration: '75 min Kansai Airport → Kyoto', schedule: 'Every 30 min', tip: 'ICOCA & Haruka discount ticket for foreigners — ¥2,200. Buy at the airport JR counter.' },
      { name: 'Bus (from Itami/ITM)', type: 'bus', cost: '¥1,340', duration: '55 min to Kyoto Station', schedule: 'Every 20-30 min', tip: 'Itami (domestic flights) is closer to Kyoto than Kansai.' },
    ],
    lateNight: 'Buses stop by ~11pm. Last trains around midnight. Limited taxis — book via app or from station taxi stands.',
    mistakes: [
      'Entering from the front of the bus — enter from the REAR, exit from the front, pay when exiting',
      'Not getting the ICOCA & Haruka discount — it saves ¥1,440 on the airport train',
      'Expecting Kyoto to be walkable like a European city — temples are spread across the city, buses are essential',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for bus routes. Shows which bus to take for each temple. Very helpful here.',
  },
  {
    city: 'Oaxaca',
    country: 'MX',
    headline: 'Walk the centro. Colectivos for further out. Uber doesn\'t work here.',
    lines: [],
    payment: [
      { method: 'Colectivo (shared van)', howToGet: 'Find at designated stops or flag down', cost: '10-15 MXN per ride', tap: false, tip: 'Shared vans run fixed routes. Ask the driver if they go to your destination. Pay in cash.' },
      { method: 'Taxi', howToGet: 'Radio taxi or flag down', cost: '50-80 MXN in the city', tap: false, tip: 'No Uber in Oaxaca. Use Didi or agree on price before getting in.' },
      { method: 'Didi', howToGet: 'Download app', cost: '40-70 MXN', tap: false, tip: 'The ride-hailing option that actually works in Oaxaca.' },
    ],
    airportTransfers: [
      { name: 'Colectivo van', type: 'shuttle', cost: '100-150 MXN', duration: '20 min to centro', schedule: 'Meets incoming flights', tip: 'Shared van to the center. Buy ticket at the counter inside the airport.' },
      { name: 'Taxi', type: 'taxi', cost: '200-250 MXN', duration: '15-20 min', schedule: '24/7', tip: 'Fixed rate from the airport taxi counter.' },
    ],
    lateNight: 'Colectivos stop by 10pm. Radio taxis or Didi for late nights. Centro is walkable if you\'re close.',
    mistakes: [
      'Expecting Uber to work — it doesn\'t in Oaxaca, use Didi',
      'Walking to Monte Albán — it\'s a 20-min drive, take a colectivo from the market',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works for walking and driving. No public transit data.',
  },
  {
    city: 'Dubrovnik',
    country: 'HR',
    headline: 'Walk the old town. Libertas buses for Lapad/Gruž. Ferries to islands.',
    lines: [
      { name: 'Libertas Bus 1A/1B', color: '#005AAA', type: 'bus', usefulFor: 'Pile Gate (Old Town) → Gruž Port → Lapad Peninsula' },
      { name: 'Libertas Bus 6', color: '#005AAA', type: 'bus', usefulFor: 'Old Town → Babin Kuk (hotels area)' },
    ],
    payment: [
      { method: 'Libertas bus ticket', howToGet: 'Buy from driver or kiosks', cost: '15 HRK from driver / 12 HRK from kiosk', tap: false, tip: 'Cheaper from newsstand kiosks. Valid for 1 hour with transfers.' },
      { method: 'Dubrovnik Card', howToGet: 'Tourist offices or online', cost: '€35 (1 day) / €45 (3 days)', tap: false, tip: 'Includes bus, city walls entry, and museums. Saves money if you\'re sightseeing.' },
    ],
    airportTransfers: [
      { name: 'Atlas Airport Shuttle', type: 'bus', cost: '€8', duration: '30 min to Pile Gate', schedule: 'Meets incoming flights', tip: 'Most reliable option. Buy ticket at the counter. Drops at Pile Gate and Gruž Port.' },
      { name: 'Taxi', type: 'taxi', cost: '€35-40', duration: '20-25 min', schedule: '24/7', tip: 'Fixed rate from the taxi counter. Split with other travelers if possible.' },
    ],
    lateNight: 'Buses stop around 1am in summer. Walking or taxi from there.',
    mistakes: [
      'Visiting city walls after 10am — go at opening (8am) to beat cruise ship crowds',
      'Taking a taxi inside the old town — it\'s pedestrian only, everything is walkable',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for walking routes. Limited bus data — check Libertas timetables.',
  },
  {
    city: 'Cartagena',
    country: 'CO',
    headline: 'Walk the walled city. Uber for everything else. Cheap taxis.',
    lines: [],
    payment: [
      { method: 'Uber', howToGet: 'Download app', cost: 'COP 8,000-15,000 for most trips', tap: false, tip: 'Works well. Cheaper and safer than street taxis.' },
      { method: 'Taxi', howToGet: 'Flag down or from hotel', cost: 'COP 8,000-20,000', tap: false, tip: 'Agree on price first. No meters. Short rides in the walled city should be COP 8,000-10,000.' },
    ],
    airportTransfers: [
      { name: 'Uber', type: 'rideshare', cost: 'COP 15,000-25,000', duration: '15-20 min to Old Town', schedule: '24/7', tip: 'Walk to the arrivals pickup area. Cheapest option.' },
      { name: 'Taxi', type: 'taxi', cost: 'COP 25,000-35,000', duration: '15-20 min', schedule: '24/7', tip: 'From the taxi counter in arrivals. Fixed rate.' },
    ],
    lateNight: 'Uber works late. The walled city is walkable. Avoid walking to Getsemaní alone late at night.',
    mistakes: [
      'Taking a taxi from the airport without a fixed price — the "meter" will be imaginary',
      'Walking with your phone out in Getsemaní after midnight',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for walking. Traffic ETAs accurate for Uber.',
  },
  {
    city: 'Jaipur',
    country: 'IN',
    headline: 'Auto-rickshaws and Uber/Ola. No useful metro for tourists yet.',
    lines: [],
    payment: [
      { method: 'Uber/Ola', howToGet: 'Download app', cost: '₹100-200 for most city rides', tap: false, tip: 'Ola is the local equivalent of Uber. Both work well. Use for all rides.' },
      { method: 'Auto-rickshaw', howToGet: 'Flag down anywhere', cost: '₹50-150', tap: false, tip: 'ALWAYS agree on price first. They\'ll quote tourists 3-5x. ₹100 gets you most places in the city.' },
    ],
    airportTransfers: [
      { name: 'Uber/Ola', type: 'rideshare', cost: '₹250-400', duration: '25-35 min to center', schedule: '24/7', tip: 'Best option. Book from the arrivals area.' },
      { name: 'Prepaid taxi', type: 'taxi', cost: '₹500-700', duration: '25-35 min', schedule: '24/7', tip: 'Prepaid counter inside arrivals. More expensive than Uber but you don\'t need an app.' },
    ],
    lateNight: 'Uber/Ola work late. Auto-rickshaws are available but harder to negotiate at night.',
    mistakes: [
      'Getting in an auto-rickshaw without agreeing on price — you\'ll pay 5x',
      'Trusting a driver who says your hotel is "closed" and offers an alternative — classic scam',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works for Uber/Ola routing. Auto-rickshaw routes are approximate.',
  },
  {
    city: 'Queenstown',
    country: 'NZ',
    headline: 'Car town. Rent a car or use Orbus. Everything is a drive.',
    lines: [
      { name: 'Orbus', color: '#008C4C', type: 'bus', usefulFor: 'Queenstown → Frankton → Airport → Arrowtown' },
    ],
    payment: [
      { method: 'Bee Card', howToGet: 'Buy online or at i-SITE', cost: 'NZ$5 card + load. Rides NZ$2-5', tap: true, tip: 'Works on Orbus. 25% discount vs cash.' },
      { method: 'Car rental', howToGet: 'Airport counters or pre-book', cost: 'NZ$40-80/day', tap: false, tip: 'Essential for Milford Sound, Glenorchy, Wanaka day trips. Book early in peak season.' },
    ],
    airportTransfers: [
      { name: 'Orbus #1', type: 'bus', cost: 'NZ$2 (Bee Card) / NZ$5 (cash)', duration: '20 min to town center', schedule: 'Every 15-30 min', tip: 'Cheap and easy. Bus stop is right outside the terminal.' },
      { name: 'Taxi', type: 'taxi', cost: 'NZ$35-45', duration: '10 min', schedule: '24/7', tip: 'Short ride — the airport is close to town.' },
    ],
    lateNight: 'Buses stop by 7-8pm. Taxi or walk from there. Town center is compact.',
    mistakes: [
      'Not renting a car and expecting to see the region — Milford Sound is 4 hours each way',
      'Driving to Milford Sound without checking road conditions — it closes in winter',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Excellent for driving. Essential for South Island road trips.',
  },
  {
    city: 'Reykjavik',
    country: 'IS',
    headline: 'Walkable downtown. Rent a car for anywhere outside the city. No trains.',
    lines: [
      { name: 'Strætó buses', color: '#FFD700', type: 'bus', usefulFor: 'City routes + Keflavík airport. Limited but functional.' },
    ],
    payment: [
      { method: 'Strætó app', howToGet: 'Download app, buy tickets in-app', cost: 'ISK 550 single / ISK 4,000 day pass', tap: false, tip: 'Exact change only on bus. App is easier.' },
      { method: 'Car rental', howToGet: 'Airport or in-city', cost: 'ISK 8,000-15,000/day ($55-100)', tap: false, tip: 'Essential for Golden Circle, South Coast, Ring Road. Book early in summer.' },
    ],
    airportTransfers: [
      { name: 'Flybus', type: 'bus', cost: 'ISK 3,999', duration: '45 min to BSÍ terminal', schedule: 'Meets all flights', tip: 'Add hotel drop-off for ISK 4,999. Book online. Reliable.' },
      { name: 'Airport Direct', type: 'bus', cost: 'ISK 3,599', duration: '45 min', schedule: 'Meets all flights', tip: 'Slightly cheaper than Flybus. Same quality.' },
    ],
    lateNight: 'Buses stop early (~11pm). Walking downtown (10 min across) or taxi.',
    mistakes: [
      'Not renting a car and trying to bus to the Golden Circle — there\'s no direct bus service',
      'Forgetting that Iceland is expensive — budget ISK 4,000-6,000 ($28-42) per meal minimum',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for driving. Essential for Ring Road navigation.',
  },
  {
    city: 'Tbilisi',
    country: 'GE',
    headline: 'Metro + marshrutkas. Get a Metromoney card. Taxis are dirt cheap.',
    lines: [
      { name: 'Line 1 (Red)', color: '#E60012', type: 'metro', usefulFor: 'Station Square → Liberty Square → Rustaveli → Delisi' },
      { name: 'Line 2 (Blue)', color: '#0066B3', type: 'metro', usefulFor: 'Station Square → Samgori (limited use for tourists)' },
    ],
    payment: [
      { method: 'Metromoney card', howToGet: 'Buy at any metro station — GEL 2', cost: 'GEL 2 card + load. Rides GEL 1 (~$0.37)', tap: true, tip: 'Works on metro, bus, cable car. Load at stations or Bank of Georgia ATMs.' },
      { method: 'Bolt/Yandex', howToGet: 'Download app', cost: 'GEL 3-8 for most rides (~$1-3)', tap: false, tip: 'Insanely cheap. No reason to walk long distances.' },
    ],
    airportTransfers: [
      { name: 'Bus 37', type: 'bus', cost: 'GEL 0.50', duration: '30-40 min to Liberty Square', schedule: 'Every 15-20 min, 7am-11pm', tip: 'Cheapest option. Uses Metromoney card. Stops at the main bus station.' },
      { name: 'Bolt/Yandex', type: 'rideshare', cost: 'GEL 15-25 (~$5-9)', duration: '20-30 min', schedule: '24/7', tip: 'So cheap there\'s almost no reason to take the bus. Night arrivals: this is your only option.' },
    ],
    lateNight: 'Metro closes at midnight. Bolt/Yandex work 24/7 and are very cheap.',
    mistakes: [
      'Not getting a Metromoney card — you can\'t pay cash on the metro',
      'Taking a regular taxi instead of Bolt — they\'ll charge 5-10x',
      'Expecting Uber to work — use Bolt or Yandex in Georgia',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for metro. Google Maps or 2GIS for other routes.',
  },
  {
    city: 'Porto',
    country: 'PT',
    headline: 'Walk + Metro. Andante card covers everything. Very compact city.',
    lines: [
      { name: 'Metro Line D (Yellow)', color: '#FFD700', type: 'metro', usefulFor: 'Hospital São João → Trindade → São Bento → Ribeira area' },
      { name: 'Metro Line E (Violet)', color: '#800080', type: 'metro', usefulFor: 'Airport → Trindade → Campanhã' },
    ],
    payment: [
      { method: 'Andante Card', howToGet: 'Buy at metro stations — €0.60 for the card', cost: '€0.60 card + €1.40/ride (Z2)', tap: true, tip: 'Load with "Z2" trips (covers the whole urban area). Works on metro, bus, tram.' },
      { method: 'Porto Card', howToGet: 'Tourist offices or online', cost: '€13 (1 day) / €20 (2 days) / €25 (3 days)', tap: true, tip: 'Includes transit + museum discounts. Good value for 2+ days of sightseeing.' },
    ],
    airportTransfers: [
      { name: 'Metro Line E', type: 'metro', cost: '€2.60 (Z4 ticket + Andante card)', duration: '30 min to Trindade', schedule: 'Every 20-30 min, 6am-1am', tip: 'Direct from airport. Buy Andante card at the station machine. Load a Z4 trip (airport zone).' },
      { name: 'Uber', type: 'rideshare', cost: '€12-18', duration: '20 min to Ribeira', schedule: '24/7', tip: 'Worth it if you have luggage. Metro requires stairs.' },
    ],
    lateNight: 'Metro runs until 1am. Night buses limited. Uber/Bolt are cheap.',
    mistakes: [
      'Not getting an Andante card — single tickets cost more',
      'Trying to walk everywhere — Porto\'s hills are brutal, especially with luggage',
      'Using Tram 1 as regular transit — it\'s mainly a tourist experience, slow and infrequent',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Works well for metro and walking.',
  },
  {
    city: 'Medellín',
    country: 'CO',
    headline: 'The Metro is excellent and covers the whole valley. Integrado card for everything.',
    lines: [
      { name: 'Metro Line A', color: '#009639', type: 'metro', usefulFor: 'Niquía → Centro → Poblado → Itagüí. Main north-south line.' },
      { name: 'Metro Line B', color: '#F7941D', type: 'metro', usefulFor: 'San Antonio → San Javier. East-west.' },
      { name: 'Metrocable Line K', color: '#8B0000', type: 'rail', usefulFor: 'Santo Domingo (Comuna 13 views from above)' },
    ],
    payment: [
      { method: 'Cívica Card', howToGet: 'Buy at metro stations — COP 5,000', cost: 'COP 5,000 card + load. Rides COP 2,950', tap: true, tip: 'Works on Metro, Metrocable, Metroplús (BRT), some buses. Load at stations or Éxito stores.' },
      { method: 'Uber/DiDi', howToGet: 'Download app', cost: 'COP 8,000-15,000 for most rides', tap: false, tip: 'Both work. Be discreet — some taxi drivers don\'t like ride-sharing apps.' },
    ],
    airportTransfers: [
      { name: 'Colectivo to San Diego Mall → Metro', type: 'shuttle', cost: 'COP 12,000 + metro fare', duration: '90 min total', schedule: 'Every 15 min', tip: 'Budget option: colectivo from Rionegro Airport to San Diego Mall, then Metro from Industriales station.' },
      { name: 'Taxi (official)', type: 'taxi', cost: 'COP 90,000-120,000', duration: '45-60 min', schedule: '24/7', tip: 'From the taxi counter inside arrivals. Fixed rate. The airport is far from the city.' },
      { name: 'Uber', type: 'rideshare', cost: 'COP 50,000-80,000', duration: '45-60 min', schedule: '24/7', tip: 'Cheaper than taxis. Walk to the parking area for pickup.' },
    ],
    lateNight: 'Metro closes at 11pm. Uber/DiDi work late. Be cautious with street taxis at night.',
    mistakes: [
      'Not trying the Metrocable — it\'s a legit transit system with incredible valley views, not just a tourist attraction',
      'Taking a taxi from the airport without using the official counter — you\'ll be overcharged',
      'Expecting the airport to be close — Rionegro Airport is 45+ min from El Poblado',
    ],
    googleMapsWorks: true,
    googleMapsNote: 'Good for Metro routes. Moovit app is more accurate for bus routes.',
  },
];

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

/**
 * Get transit guide for a destination.
 * Matches by city name (case-insensitive, accent-insensitive).
 */
export function getTransitGuide(destination: string): TransitGuide | null {
  const normalized = destination
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  return TRANSIT_GUIDES.find((g) => {
    const cityNorm = g.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return normalized.includes(cityNorm) || cityNorm.includes(normalized);
  }) ?? null;
}

/**
 * Get all available transit guide cities.
 */
export function getAvailableTransitCities(): string[] {
  return TRANSIT_GUIDES.map((g) => g.city);
}
