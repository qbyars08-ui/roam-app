// =============================================================================
// ROAM — Tourist Scam Alert Database
// Curated, destination-specific scam intelligence
// =============================================================================

export interface ScamAlert {
  readonly name: string;
  readonly destination: string;
  readonly location: string;
  readonly howItWorks: string;
  readonly howToAvoid: string;
  readonly severity: 'low' | 'medium' | 'high';
}

const SCAM_ALERTS: readonly ScamAlert[] = [
  // ---------------------------------------------------------------------------
  // Tokyo
  // ---------------------------------------------------------------------------
  { name: 'Fake Monk Donation', destination: 'Tokyo', location: 'Shibuya Crossing, Asakusa', howItWorks: 'A person dressed as a monk hands you a gold card or bracelet, then demands a large "donation" and refuses to take it back.', howToAvoid: 'Politely decline and keep walking. Real monks do not solicit donations on the street.', severity: 'medium' },
  { name: 'Izakaya Overcharge', destination: 'Tokyo', location: 'Kabukichō, Roppongi', howItWorks: 'A tout invites you to a bar or izakaya with "cheap drinks." The bill arrives with hidden seat charges, service fees, and inflated prices totaling 10-50x the expected cost.', howToAvoid: 'Never follow touts. Choose restaurants yourself and confirm prices before ordering.', severity: 'high' },
  { name: 'Friendly English Student', destination: 'Tokyo', location: 'Harajuku, Akihabara', howItWorks: 'Someone approaches claiming to practice English, then leads you to an overpriced tea ceremony, karaoke room, or shop where they earn a commission.', howToAvoid: 'Be cautious of unsolicited friendliness near tourist spots. Suggest a public café instead.', severity: 'low' },
  { name: 'Fake Taxi Meter', destination: 'Tokyo', location: 'Narita/Haneda airports', howItWorks: 'Unlicensed drivers at the airport offer flat-rate rides that cost 2-3x the metered fare. Some tamper with meters.', howToAvoid: 'Only use official taxi stands or pre-booked airport transfers. Licensed taxis have green plates.', severity: 'medium' },
  { name: 'Photo Charge at Senso-ji', destination: 'Tokyo', location: 'Senso-ji Temple, Asakusa', howItWorks: 'Someone in traditional dress offers to pose for a photo, then demands ¥1,000-3,000 for the privilege.', howToAvoid: 'Decline posed photos with strangers. If someone insists, walk away.', severity: 'low' },

  // ---------------------------------------------------------------------------
  // Paris
  // ---------------------------------------------------------------------------
  { name: 'Petition Scam', destination: 'Paris', location: 'Sacré-Cœur, Trocadéro, Champs-Élysées', howItWorks: 'A group asks you to sign a petition for a fake charity. While you write, accomplices pickpocket you, or they demand a cash donation after signing.', howToAvoid: 'Never stop to sign anything. Say "non" firmly and keep walking.', severity: 'high' },
  { name: 'Gold Ring Scam', destination: 'Paris', location: 'Pont des Arts, Tuileries Garden', howItWorks: 'Someone "finds" a gold ring on the ground near you and offers it as a gift, then asks for money as a reward for their honesty.', howToAvoid: 'Ignore anyone showing you a found ring. It is always fake brass.', severity: 'medium' },
  { name: 'Free Bracelet Scam', destination: 'Paris', location: 'Montmartre, Sacré-Cœur steps', howItWorks: 'A man grabs your wrist and ties a string bracelet on before you can refuse, then aggressively demands €10-20 payment.', howToAvoid: 'Keep hands in pockets near Montmartre. If someone reaches for your hand, pull away immediately.', severity: 'high' },
  { name: 'Three-Card Monte', destination: 'Paris', location: 'Pont Neuf, near Louvre', howItWorks: 'A street game where you guess which cup hides a ball. Shills in the crowd "win" to lure you in. The game is rigged and you always lose.', howToAvoid: 'Never play street gambling games. The entire crowd may be part of the operation.', severity: 'medium' },
  { name: 'Rose Seller Guilt Trip', destination: 'Paris', location: 'Eiffel Tower, restaurant terraces', howItWorks: 'A vendor hands a rose to your date. If either of you touch it, they demand €5-10 and cause a scene if you refuse.', howToAvoid: 'Do not accept or touch anything handed to you. A firm "non merci" and no eye contact works.', severity: 'low' },

  // ---------------------------------------------------------------------------
  // Rome
  // ---------------------------------------------------------------------------
  { name: 'Gladiator Photo Scam', destination: 'Rome', location: 'Colosseum, Roman Forum', howItWorks: 'Men dressed as gladiators pose for photos, then demand €20-50 per person per photo. They can become aggressive if you refuse to pay.', howToAvoid: 'Do not pose with costumed characters unless you agree on price first. Walk away if pressured.', severity: 'medium' },
  { name: 'Restaurant Cover Charge', destination: 'Rome', location: 'Piazza Navona, near Vatican', howItWorks: 'Tourist-trap restaurants add a hidden coperto (cover charge) plus inflated service fees. A simple pasta can cost €30+ near major sights.', howToAvoid: 'Check menus for coperto and servizio before sitting. Eat at least 2-3 blocks from major attractions.', severity: 'medium' },
  { name: 'Fake Designer Bags on Blankets', destination: 'Rome', location: 'Spanish Steps, Trevi Fountain', howItWorks: 'Street vendors sell counterfeit goods. If police arrive, they vanish. Buyers can be fined up to €7,000 under Italian law for purchasing counterfeits.', howToAvoid: 'Never buy from blanket vendors. The legal risk to buyers is real in Italy.', severity: 'high' },
  { name: 'Taxi Long Route', destination: 'Rome', location: 'Fiumicino Airport, Termini Station', howItWorks: 'Drivers take a long detour from the airport or station, turning a €48 fixed-fare ride into a €80-120 metered trip.', howToAvoid: 'Insist on the fixed fare (€50 Fiumicino to center). Only use white licensed taxis from official stands.', severity: 'medium' },
  { name: 'Friendship Bracelet Distraction', destination: 'Rome', location: 'Trevi Fountain, Pantheon', howItWorks: 'While one person ties a bracelet on your wrist, an accomplice picks your pocket or bag.', howToAvoid: 'Wear crossbody bags zipped in front. Refuse any physical contact from strangers.', severity: 'high' },

  // ---------------------------------------------------------------------------
  // Barcelona
  // ---------------------------------------------------------------------------
  { name: 'La Rambla Pickpockets', destination: 'Barcelona', location: 'La Rambla, Plaça de Catalunya', howItWorks: 'Teams of pickpockets work the crowds. Distractions include fake arguments, someone spilling something on you, or someone pointing at a "sight."', howToAvoid: 'Use a money belt or front crossbody bag. Keep phones in front pockets. Stay alert in crowds.', severity: 'high' },
  { name: 'Beach Bag Theft', destination: 'Barcelona', location: 'Barceloneta Beach', howItWorks: 'While you swim or nap, thieves take bags left on the sand. Some use children as lookouts or distraction.', howToAvoid: 'Never leave valuables on the beach. Use a waterproof pouch you can swim with.', severity: 'high' },
  { name: 'Fake Police ID Check', destination: 'Barcelona', location: 'Gothic Quarter, near ATMs', howItWorks: 'Someone flashes a fake police badge and asks to check your wallet for counterfeit bills. They pocket some of your cash during the "inspection."', howToAvoid: 'Real police never check wallets on the street. Ask for ID and say you will walk to the nearest station.', severity: 'high' },
  { name: 'Bird Poop Scam', destination: 'Barcelona', location: 'Passeig de Gràcia, Park Güell entrance', howItWorks: 'Someone squirts a substance on your shoulder. A "helpful" stranger offers to clean it off while an accomplice steals from your bag or pockets.', howToAvoid: 'If something lands on you, move away from everyone before cleaning up. Do not let strangers help.', severity: 'medium' },
  { name: 'ATM Shoulder Surfing', destination: 'Barcelona', location: 'La Rambla, El Born', howItWorks: 'Someone watches your PIN then distracts you or follows you to steal the card. Some ATMs have skimming devices installed.', howToAvoid: 'Cover the keypad. Use ATMs inside bank branches during business hours only.', severity: 'medium' },

  // ---------------------------------------------------------------------------
  // Bangkok
  // ---------------------------------------------------------------------------
  { name: 'Tuk-Tuk Gem Shop Scam', destination: 'Bangkok', location: 'Grand Palace, Khao San Road', howItWorks: 'A friendly local says the palace is closed for a "ceremony" and offers a cheap tuk-tuk tour. Every stop is a gem shop or tailor where the driver earns commission. The gems are worthless glass.', howToAvoid: 'The Grand Palace is never closed for a random ceremony. Walk to the entrance yourself. Never buy gems from shops a driver takes you to.', severity: 'high' },
  { name: 'Temple Is Closed Scam', destination: 'Bangkok', location: 'Wat Pho, Grand Palace gates', howItWorks: 'A well-dressed person near the temple entrance says it is closed for lunch or prayers, then offers to take you somewhere else. They earn commission from shops they bring you to.', howToAvoid: 'Ignore anyone outside the gate. Walk to the actual entrance and check yourself.', severity: 'high' },
  { name: 'Jet Ski Damage Scam', destination: 'Bangkok', location: 'Pattaya, Phuket beaches', howItWorks: 'After you return a rented jet ski, the operator claims you caused pre-existing damage and demands thousands of baht. They may threaten police involvement.', howToAvoid: 'Photo and video the jet ski from every angle before renting. Avoid jet ski rentals from beach vendors entirely.', severity: 'high' },
  { name: 'Metered Taxi Refusal', destination: 'Bangkok', location: 'Suvarnabhumi Airport, tourist areas', howItWorks: 'Taxi drivers refuse to use the meter and quote a flat fare 3-5x the actual cost. Common at airports and near tourist attractions.', howToAvoid: 'Insist on the meter or walk to the official taxi stand. Use Grab (ride-hailing app) as an alternative.', severity: 'medium' },
  { name: 'Ping Pong Show Bait-and-Switch', destination: 'Bangkok', location: 'Patpong Night Market, Nana', howItWorks: 'Touts offer free entry to a show. Once inside, you get a bill for thousands of baht for "drinks" you never ordered. Bouncers block the exit.', howToAvoid: 'Avoid following touts to any upstairs bar. If you go, set a firm budget and never open a tab.', severity: 'high' },

  // ---------------------------------------------------------------------------
  // Bali
  // ---------------------------------------------------------------------------
  { name: 'Money Exchange Short-Change', destination: 'Bali', location: 'Kuta, Legian, Seminyak streets', howItWorks: 'Unlicensed exchange booths advertise great rates, then use sleight of hand to short-change you — folding bills, fast counting, or hiding notes under the counter.', howToAvoid: 'Only use official BMV or Central Kuta exchange offices with glass counters. Count money twice before leaving.', severity: 'high' },
  { name: 'Broken Scooter Scam', destination: 'Bali', location: 'Ubud, Canggu, Seminyak', howItWorks: 'You return a rented scooter and the owner claims you caused scratches or damage that was already there. They demand $200-500 for "repairs."', howToAvoid: 'Photo and video every scratch before renting. Use a reputable rental with a written agreement and insurance.', severity: 'high' },
  { name: 'Temple Donation Pressure', destination: 'Bali', location: 'Uluwatu Temple, Besakih Temple', howItWorks: 'Self-appointed "guides" attach themselves to you at temples, give an unwanted tour, then demand a large donation. At Besakih, they claim entry requires a personal guide.', howToAvoid: 'Besakih does not require a personal guide. Politely decline and walk with other tourists. Donate only in official donation boxes.', severity: 'medium' },
  { name: 'Taxi Meter Tampering', destination: 'Bali', location: 'Airport, Kuta, Denpasar', howItWorks: 'Unofficial taxis use rigged meters that run 2-3x faster than normal, or drivers claim the meter is broken and quote inflated prices.', howToAvoid: 'Use Blue Bird taxis (blue with a bird logo) or Grab/Gojek apps. Confirm meter works before departing.', severity: 'medium' },
  { name: 'Monkey Forest Theft', destination: 'Bali', location: 'Sacred Monkey Forest, Ubud', howItWorks: 'Staff or locals encourage you to hold food for the monkeys. Monkeys grab sunglasses, phones, or jewelry. Nearby "helpers" charge to retrieve your items.', howToAvoid: 'Secure all loose items before entering. Do not carry food. Keep sunglasses in a zippered bag.', severity: 'low' },

  // ---------------------------------------------------------------------------
  // Istanbul
  // ---------------------------------------------------------------------------
  { name: 'Shoe Shine Drop Scam', destination: 'Istanbul', location: 'Istiklal Avenue, Galata Bridge', howItWorks: 'A shoe shiner "accidentally" drops his brush near you. When you pick it up or call out, he insists on shining your shoes for free, then demands 50-100 lira.', howToAvoid: 'Do not pick up the brush. Keep walking without engaging.', severity: 'medium' },
  { name: 'My Uncle\'s Carpet Shop', destination: 'Istanbul', location: 'Grand Bazaar, Sultanahmet', howItWorks: 'A friendly local offers tea and directions, then steers you to a carpet shop where high-pressure sales tactics and inflated prices await. They earn a finder\'s commission.', howToAvoid: 'Politely decline invitations from strangers. If shopping for carpets, research prices beforehand and visit multiple shops.', severity: 'medium' },
  { name: 'Friendly Bar Scam', destination: 'Istanbul', location: 'Taksim Square, Beyoğlu', howItWorks: 'A local "friend" invites you for drinks at a specific bar. Women appear. The bill arrives at $500-2,000 for a few drinks. Bouncers enforce payment.', howToAvoid: 'Never go to a bar suggested by a stranger you just met. Choose your own venues.', severity: 'high' },
  { name: 'Taxi Route Manipulation', destination: 'Istanbul', location: 'Atatürk Airport, Sultanahmet', howItWorks: 'Drivers take the long way, "accidentally" cross the Bosphorus bridge (adding a toll), or use a tampered meter. Some swap large bills and claim you underpaid.', howToAvoid: 'Use BiTaksi app or agree on a price beforehand. Keep small bills to pay exact amounts. Track the route on your phone.', severity: 'high' },
  { name: 'Counterfeit Spice Market Goods', destination: 'Istanbul', location: 'Spice Bazaar (Mısır Çarşısı)', howItWorks: 'Vendors sell "saffron" that is actually safflower or turmeric-dyed threads at premium saffron prices. Turkish delight may be stale stock repackaged.', howToAvoid: 'Buy saffron from established shops outside the bazaar. Real saffron threads are dark red with a bitter taste. Taste-test Turkish delight before buying in bulk.', severity: 'low' },

  // ---------------------------------------------------------------------------
  // Marrakech
  // ---------------------------------------------------------------------------
  { name: 'Medina Maze Guide Scam', destination: 'Marrakech', location: 'Medina, Jemaa el-Fnaa', howItWorks: 'Someone offers to guide you through the medina for free or a small fee, then leads you to their friend\'s shop. If you buy nothing, they demand a large guide fee and may become hostile.', howToAvoid: 'Use Google Maps offline or a GPS app. If you need help, ask shopkeepers for directions rather than accepting a walking guide.', severity: 'high' },
  { name: 'Henna Tattoo Overcharge', destination: 'Marrakech', location: 'Jemaa el-Fnaa, medina alleys', howItWorks: 'A woman grabs your hand and starts drawing henna before agreeing on a price. A small design turns into a full arm piece. They then demand 200-500 dirham.', howToAvoid: 'Never let someone start without agreeing on the exact design, size, and price in writing first.', severity: 'medium' },
  { name: 'Snake Charmer Photo Trap', destination: 'Marrakech', location: 'Jemaa el-Fnaa', howItWorks: 'A snake charmer places a snake on your shoulders without asking. Multiple people then demand payment for the photo — the charmer, the photographer, and assistants. Refusing triggers a confrontation.', howToAvoid: 'Avoid eye contact with snake charmers. If a snake is placed on you, stay calm, set it down, and walk away. Have small bills to settle quickly if needed.', severity: 'medium' },
  { name: 'Fixed Price Myth at Souks', destination: 'Marrakech', location: 'Souk Semmarine, Souk el-Attarine', howItWorks: 'Vendors quote 5-10x the actual price and claim it is fixed. Aggressive sellers block your path or follow you. Some claim items are handmade when they are factory-produced imports.', howToAvoid: 'Always negotiate — start at 30% of the asking price. Walk away to test the real price. Shop at Ensemble Artisanal first for fixed-price benchmarks.', severity: 'medium' },
  { name: 'Fake Riad Redirect', destination: 'Marrakech', location: 'Medina entrances', howItWorks: 'A local claims your riad is closed, moved, or dangerous, then leads you to a different accommodation where they earn commission. Some even call ahead to confirm the lie.', howToAvoid: 'Get your riad\'s phone number and WhatsApp before arrival. Call them directly if anyone claims it is closed. Arrange an airport pickup through your riad.', severity: 'high' },
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const normalize = (s: string): string => s.toLowerCase().trim();

/**
 * Returns all scam alerts for a given destination.
 */
export function getScamAlerts(destination: string): readonly ScamAlert[] {
  const key = normalize(destination);
  return SCAM_ALERTS.filter((a) => normalize(a.destination) === key);
}

/**
 * Returns only high-severity alerts for a destination.
 */
export function getHighSeverityAlerts(destination: string): readonly ScamAlert[] {
  return getScamAlerts(destination).filter((a) => a.severity === 'high');
}

/**
 * Returns true if the database contains alerts for a destination.
 */
export function hasScamAlerts(destination: string): boolean {
  return getScamAlerts(destination).length > 0;
}
