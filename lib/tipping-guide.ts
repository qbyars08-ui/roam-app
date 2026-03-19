// =============================================================================
// ROAM — Tipping Guide
// Know exactly what to tip, where, and when — no awkward moments.
// =============================================================================

export interface TippingRule {
  readonly situation: string;
  readonly amount: string;
  readonly note: string;
}

export interface TippingGuide {
  readonly culture: 'tip-expected' | 'tip-appreciated' | 'no-tip' | 'tip-offensive';
  readonly currency: string;
  readonly summary: string;
  readonly rules: readonly TippingRule[];
}

// ---------------------------------------------------------------------------
// Curated tipping data — researched, not guessed
// ---------------------------------------------------------------------------

const GUIDES: Record<string, TippingGuide> = {
  tokyo: {
    culture: 'no-tip',
    currency: 'JPY',
    summary: 'Tipping is NOT customary and can be seen as rude. Exceptional service is the standard.',
    rules: [
      { situation: 'Restaurants', amount: 'Never', note: 'Service charge (10%) may be added at high-end spots. That\'s your "tip."' },
      { situation: 'Taxis', amount: 'Never', note: 'Drivers will literally chase you to return extra money.' },
      { situation: 'Hotels', amount: 'Never', note: 'Leave the room tidy instead — that\'s the respectful move.' },
      { situation: 'Bars', amount: 'Never', note: 'Otoshi (small appetizer charge ¥300-500) IS the service fee.' },
      { situation: 'Tour guides', amount: '¥1,000-3,000 in envelope', note: 'The ONE exception. Always use an envelope, never hand cash directly.' },
    ],
  },
  paris: {
    culture: 'tip-appreciated',
    currency: 'EUR',
    summary: 'Service charge (service compris) is included by law. Small tips are kind but not expected.',
    rules: [
      { situation: 'Restaurants', amount: '€2-5 or round up', note: 'Service is included. Leave coins on the table for good service, not a percentage.' },
      { situation: 'Cafés', amount: '€0.50-1', note: 'Round up or leave coins. Standing at the bar = no tip expected.' },
      { situation: 'Taxis', amount: 'Round up to nearest €', note: '€13.40 fare → hand €14. That\'s perfectly fine.' },
      { situation: 'Hotels', amount: '€1-2/bag, €2-5/night housekeeping', note: 'Porters and housekeeping DO expect small tips.' },
      { situation: 'Hair salons', amount: '€5-10', note: 'Tip the person who actually cut your hair, not the receptionist.' },
    ],
  },
  bali: {
    culture: 'tip-appreciated',
    currency: 'IDR',
    summary: 'Not expected but deeply appreciated. Even small tips mean a lot — average local wage is $200/month.',
    rules: [
      { situation: 'Restaurants', amount: '10-15% if no service charge', note: 'Check the bill — many add 10% service + 11% tax already.' },
      { situation: 'Spa/massage', amount: 'Rp 30,000-50,000', note: '~$2-3. Give directly to your therapist, not the front desk.' },
      { situation: 'Drivers (day hire)', amount: 'Rp 50,000-100,000/day', note: '~$3-6. Your driver probably waited 8 hours. Tip generously.' },
      { situation: 'Tour guides', amount: 'Rp 50,000-100,000', note: 'More for multi-day tours. Cash, not transfer.' },
      { situation: 'Housekeeping', amount: 'Rp 20,000-30,000/night', note: 'Leave on the pillow daily — different staff each day.' },
    ],
  },
  bangkok: {
    culture: 'tip-appreciated',
    currency: 'THB',
    summary: 'Tipping culture is relaxed. Locals rarely tip at street food, but appreciate it at restaurants.',
    rules: [
      { situation: 'Restaurants', amount: '10% or round up', note: 'If service charge (SC 10%) is on the bill, no extra needed.' },
      { situation: 'Street food', amount: 'Leave the coins', note: 'If your meal is ฿60, pay with ฿100, leave the coins from change.' },
      { situation: 'Massage/spa', amount: '฿50-100', note: 'At ฿200/hour Thai massage shops. More at luxury spas (฿200-300).' },
      { situation: 'Taxis', amount: 'Round up', note: '฿87 fare → give ฿100 and say "mai tong torn" (no change needed).' },
      { situation: 'Hotel staff', amount: '฿20-50/bag', note: 'Porters and bellboys. Housekeeping ฿50/night for good hotels.' },
    ],
  },
  rome: {
    culture: 'tip-appreciated',
    currency: 'EUR',
    summary: 'Coperto (cover charge €1-3) is standard. Tips beyond that are a bonus, not an obligation.',
    rules: [
      { situation: 'Restaurants', amount: '€1-5 or round up', note: 'Coperto covers "service." Leave extra only for exceptional meals.' },
      { situation: 'Cafés', amount: '€0.20 in the tip jar', note: 'Drop coins in the jar at the register. Standing at bar = no tip.' },
      { situation: 'Taxis', amount: 'Round up to nearest €', note: 'Rome taxis have fixed rates to airports. No tip needed on those.' },
      { situation: 'Free walking tours', amount: '€5-10/person', note: 'These guides work for tips only. €5 minimum is the unspoken rule.' },
      { situation: 'Gelato shops', amount: 'Nothing', note: 'Seriously, nobody tips at gelato shops. Don\'t make it weird.' },
    ],
  },
  barcelona: {
    culture: 'tip-appreciated',
    currency: 'EUR',
    summary: 'Spanish tipping is casual. Leave coins, don\'t calculate percentages — that\'s an American thing here.',
    rules: [
      { situation: 'Restaurants', amount: '€1-5 or 5-10%', note: 'Only at sit-down restaurants. Tapas bars = just leave coins.' },
      { situation: 'Bars', amount: 'Round up', note: '€4.50 drink → leave €5. More than that looks weird.' },
      { situation: 'Taxis', amount: 'Round up', note: '€11.40 ride → give €12. That\'s generous by local standards.' },
      { situation: 'Hotels', amount: '€1-2/bag, €2-3/night', note: 'Beach hotels and resorts — tip housekeeping daily.' },
      { situation: 'Tour guides', amount: '€5-10/person', note: 'Especially for Sagrada Família and Gaudí tours. They earn it.' },
    ],
  },
  seoul: {
    culture: 'no-tip',
    currency: 'KRW',
    summary: 'Korea does NOT have a tipping culture. Service is included and expected to be excellent.',
    rules: [
      { situation: 'Restaurants', amount: 'Never', note: 'Some places literally won\'t accept it. Don\'t insist.' },
      { situation: 'Taxis', amount: 'Never', note: 'Pay the meter, say "kamsahamnida" (thank you). Done.' },
      { situation: 'Hotels', amount: 'Optional for bellboys', note: 'International hotels may accept ₩2,000-5,000 for porters. Local hotels, never.' },
      { situation: 'Delivery', amount: 'Never', note: 'Even food delivery — the delivery fee IS the tip.' },
      { situation: 'Tour guides', amount: '₩10,000-20,000 if exceptional', note: 'Only for private tours. Group tours = included in price.' },
    ],
  },
  london: {
    culture: 'tip-appreciated',
    currency: 'GBP',
    summary: 'Check the bill for service charge (12.5% is common). If it\'s there, you\'re done.',
    rules: [
      { situation: 'Restaurants', amount: '10-12.5% if no service charge', note: 'ALWAYS check the bill. "Service" or "optional service charge" means it\'s included.' },
      { situation: 'Pubs', amount: 'Nothing', note: 'You don\'t tip at pubs. You might say "and one for yourself" to buy the barkeep a drink.' },
      { situation: 'Taxis (black cabs)', amount: 'Round up 10%', note: '£13 fare → give £14-15. Uber = tip in app if you want.' },
      { situation: 'Hotels', amount: '£1-2/bag', note: 'Porters yes. Housekeeping is less common — £2-5 at end of stay if you want.' },
      { situation: 'Hairdressers', amount: '10% or £2-5', note: 'Pretty standard. Give it directly to the stylist.' },
    ],
  },
  'new york': {
    culture: 'tip-expected',
    currency: 'USD',
    summary: 'Tipping is mandatory in practice. Servers earn $5/hour base — tips are their real income.',
    rules: [
      { situation: 'Restaurants', amount: '18-22% of pre-tax total', note: 'Under 18% is considered bad. 20% is the new standard. Don\'t tip on tax.' },
      { situation: 'Bars', amount: '$1-2/drink or 18-20% on tabs', note: '$1/beer, $2/cocktail minimum. Open a tab and tip 20% at the end.' },
      { situation: 'Taxis/Uber', amount: '15-20%', note: 'NYC taxi screens suggest 20/25/30%. 20% is fine.' },
      { situation: 'Coffee shops', amount: '$1 or skip', note: 'The iPad flip is optional. $1 for a drip coffee, nothing for grabbing a pastry.' },
      { situation: 'Hotels', amount: '$2-5/bag, $5/night housekeeping', note: 'Doorman who hails cab: $1-2. Concierge with reservations: $5-20.' },
    ],
  },
  mexico: {
    culture: 'tip-expected',
    currency: 'MXN',
    summary: 'Tipping is expected and important — wages are low and tips are a significant part of income.',
    rules: [
      { situation: 'Restaurants', amount: '15-20%', note: 'Check for "propina incluida" (tip included). If not, 15% minimum.' },
      { situation: 'Street food / tacos', amount: 'Round up or leave coins', note: 'Not expected but appreciated. ₱5-10 coins are perfect.' },
      { situation: 'Hotels', amount: '₱25-50/bag, ₱50-100/night', note: 'All-inclusive resorts: tip daily. They share among staff.' },
      { situation: 'Gas station attendants', amount: '₱10-20', note: 'All gas stations are full service. They also check tires and clean windshields.' },
      { situation: 'Grocery baggers', amount: '₱10-20', note: 'Baggers (often elderly) work for tips only — no salary. Always tip.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getTippingGuide(destination: string): TippingGuide | null {
  const key = destination.toLowerCase().trim();
  return GUIDES[key] ?? null;
}

export function getTippingCulture(destination: string): TippingGuide['culture'] | null {
  return getTippingGuide(destination)?.culture ?? null;
}

export function getTippingSummary(destination: string): string | null {
  return getTippingGuide(destination)?.summary ?? null;
}

export function hasTippingGuide(destination: string): boolean {
  return getTippingGuide(destination) !== null;
}

export const TIPPING_CULTURE_LABELS = {
  'tip-expected': 'Tips Expected',
  'tip-appreciated': 'Tips Appreciated',
  'no-tip': 'No Tipping',
  'tip-offensive': 'Tipping Offensive',
} as const;

export const TIPPING_CULTURE_COLORS = {
  'tip-expected': 'coral',
  'tip-appreciated': 'sage',
  'no-tip': 'gold',
  'tip-offensive': 'muted',
} as const;
