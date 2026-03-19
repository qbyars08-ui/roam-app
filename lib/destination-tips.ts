// =============================================================================
// ROAM — Destination Quick Tips
// Curated, opinionated tips that only a local would know.
// NOT generic "be careful" advice — specific, actionable, memorable.
// =============================================================================

export interface DestinationTip {
  readonly category: 'money' | 'transit' | 'food' | 'safety' | 'culture' | 'tech';
  readonly tip: string;
}

// ---------------------------------------------------------------------------
// Curated tips — the kind you'd text a friend
// ---------------------------------------------------------------------------

const TIPS: Record<string, readonly DestinationTip[]> = {
  tokyo: [
    { category: 'money', tip: '7-Eleven ATMs accept foreign cards. Most others don\'t. Withdraw cash on arrival.' },
    { category: 'transit', tip: 'Get a Suica card, not a PASMO. Same thing but Suica works on more vending machines.' },
    { category: 'food', tip: 'Lunch sets (teishoku) are half the dinner price at the same restaurant. Eat big at noon.' },
    { category: 'culture', tip: 'Don\'t tip. Anywhere. It\'s considered rude.' },
    { category: 'tech', tip: 'Download Tabelog for restaurant reviews — Google ratings in Japan are inflated.' },
    { category: 'safety', tip: 'Leave your bag on a chair to save your seat. Nobody will touch it.' },
  ],
  paris: [
    { category: 'money', tip: 'Never exchange money at the airport. Use your debit card at any ATM — Wise card gets the best rate.' },
    { category: 'transit', tip: 'Buy a Navigo Easy card and load t+ tickets. The old paper tickets are gone.' },
    { category: 'food', tip: 'Order the "formule" (prix fixe) at lunch. Same restaurant, same food, 40% cheaper than dinner.' },
    { category: 'culture', tip: 'Say "Bonjour" when entering any shop. Not saying it is considered very rude.' },
    { category: 'safety', tip: 'The petition scam near Sacré-Cœur — someone asks you to sign, then demands money. Keep walking.' },
    { category: 'tech', tip: 'Citymapper > Google Maps for Paris metro. It knows which exit to use.' },
  ],
  bali: [
    { category: 'money', tip: 'Always negotiate taxi prices before getting in. Or use Grab — it\'s 50% cheaper.' },
    { category: 'transit', tip: 'Rent a scooter only if you\'ve ridden before. Bali traffic kills tourists every month.' },
    { category: 'food', tip: 'Warung > restaurant. A full meal at a warung is $2-3. Same food, no markup.' },
    { category: 'culture', tip: 'Cover your shoulders and knees at temples. They rent sarongs for $1 at the entrance.' },
    { category: 'safety', tip: 'Don\'t drink tap water or use ice at small warungs. Bintang beer is safer than water.' },
    { category: 'tech', tip: 'Grab doesn\'t work in Ubud center (drivers can\'t enter). Walk to the main road to get picked up.' },
  ],
  bangkok: [
    { category: 'money', tip: 'SuperRich exchange has the best rates in Thailand. There\'s one in every mall.' },
    { category: 'transit', tip: 'BTS Skytrain > taxi during rush hour. A 15-min train ride = 90 min in traffic.' },
    { category: 'food', tip: 'Jay Fai has a Michelin star but the line is 3 hours. Raan Jay Fai Gaa next door is almost as good.' },
    { category: 'culture', tip: 'Never point your feet at a Buddha statue or a person. It\'s deeply disrespectful.' },
    { category: 'safety', tip: 'Tuk-tuk drivers who offer free rides are taking you to a gem scam shop. Every time.' },
    { category: 'tech', tip: 'LINE is Thailand\'s WhatsApp. Restaurants and shops communicate via LINE.' },
  ],
  rome: [
    { category: 'money', tip: 'Standing at a bar = €1 espresso. Sitting at a table = €4 espresso. Same coffee.' },
    { category: 'transit', tip: 'Walk everywhere in Centro Storico. Taking the metro/bus actually takes longer.' },
    { category: 'food', tip: 'Never eat within eyesight of a major monument. Walk 2 blocks in any direction for real food.' },
    { category: 'culture', tip: 'Aperitivo (6-8pm) at any bar comes with free food. Order a Spritz, eat a meal\'s worth of snacks.' },
    { category: 'safety', tip: 'Gladiators at the Colosseum charge €20 for a photo after you take it. Just say no.' },
    { category: 'tech', tip: 'Book Vatican tickets online minimum 2 weeks ahead. The line without tickets is 3+ hours.' },
  ],
  barcelona: [
    { category: 'money', tip: 'La Boqueria market prices are 2x for tourists. Go to Mercat de Sant Antoni instead.' },
    { category: 'transit', tip: 'T-Casual card: 10 trips for €11.35 on metro, bus, and tram. Way cheaper than singles.' },
    { category: 'food', tip: 'Dinner starts at 9pm. Restaurants open at 8pm are tourist-only. Locals eat at 10.' },
    { category: 'culture', tip: 'Catalonia is NOT Spain to Catalans. Don\'t call it Spain.' },
    { category: 'safety', tip: 'La Rambla is pickpocket central. Front pocket or cross-body bag, always.' },
    { category: 'tech', tip: 'Book Sagrada Família tickets on the official site only. Tours charge double for the same ticket.' },
  ],
  seoul: [
    { category: 'money', tip: 'T-money card works on all transit AND convenience stores. Load it at any subway machine.' },
    { category: 'transit', tip: 'KakaoMap > Google Maps in Korea. Google doesn\'t have transit directions.' },
    { category: 'food', tip: 'Convenience store food in Korea is actually good. GS25 and CU have hot meals for $3.' },
    { category: 'culture', tip: 'Pour drinks for elders with both hands, and turn away when drinking. It matters.' },
    { category: 'safety', tip: 'Korea is one of the safest countries on earth. You can walk anywhere at 3am.' },
    { category: 'tech', tip: 'Get KakaoPay for contactless payments. Works everywhere Koreans shop.' },
  ],
  london: [
    { category: 'money', tip: 'Contactless payment works on all transit. Just tap your card — no Oyster needed.' },
    { category: 'transit', tip: 'Buses are faster than the Tube for short distances and you see the city.' },
    { category: 'food', tip: 'Borough Market for lunch, not dinner. The good stalls close by 5pm.' },
    { category: 'culture', tip: 'Stand on the right on escalators. Walking side is left. Londoners will actually yell at you.' },
    { category: 'safety', tip: 'Moped phone snatching is real. Don\'t walk with your phone in your hand near roads.' },
    { category: 'tech', tip: 'Most museums are free. Don\'t pay for skip-the-line tickets at free museums — that\'s a scam.' },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getDestinationTips(destination: string): readonly DestinationTip[] {
  const key = destination.toLowerCase().trim();
  return TIPS[key] ?? [];
}

export function getTipsByCategory(
  destination: string,
  category: DestinationTip['category']
): readonly DestinationTip[] {
  return getDestinationTips(destination).filter((t) => t.category === category);
}

export function getTopTips(destination: string, count = 3): readonly DestinationTip[] {
  return getDestinationTips(destination).slice(0, count);
}

export function hasDestinationTips(destination: string): boolean {
  return getDestinationTips(destination).length > 0;
}

export const TIP_CATEGORY_ICONS = {
  money: 'DollarSign',
  transit: 'Train',
  food: 'UtensilsCrossed',
  safety: 'Shield',
  culture: 'Globe',
  tech: 'Smartphone',
} as const;

export const TIP_CATEGORY_LABELS = {
  money: 'Money',
  transit: 'Getting around',
  food: 'Food',
  safety: 'Safety',
  culture: 'Culture',
  tech: 'Tech',
} as const;
