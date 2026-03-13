// =============================================================================
// ROAM — Cost of Living reference data (offline, no API key)
// Curated daily budget ranges for all ROAM destinations
// =============================================================================

export interface CostOfLiving {
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  budget: DailyBudget;   // backpacker / budget traveler
  comfort: DailyBudget;  // mid-range traveler
  luxury: DailyBudget;   // splurge traveler
  tipping: string;       // tipping culture note
  bargaining: string;    // haggling culture note
}

interface DailyBudget {
  accommodation: string;  // per night range
  meal: string;           // per meal range
  transport: string;      // daily transport range
  dailyTotal: string;     // total daily estimate
}

const COST_DATA: Record<string, CostOfLiving> = {
  'tokyo': {
    city: 'Tokyo', country: 'Japan', currency: 'JPY', currencySymbol: '¥',
    budget: { accommodation: '¥3,000–5,000', meal: '¥500–1,000', transport: '¥1,000', dailyTotal: '~$35–50' },
    comfort: { accommodation: '¥10,000–20,000', meal: '¥1,500–3,000', transport: '¥1,500', dailyTotal: '~$80–150' },
    luxury: { accommodation: '¥30,000+', meal: '¥5,000–15,000', transport: '¥3,000', dailyTotal: '~$250+' },
    tipping: 'No tipping — it can be considered rude.',
    bargaining: 'Prices are fixed everywhere. Never haggle.',
  },
  'bali': {
    city: 'Bali', country: 'Indonesia', currency: 'IDR', currencySymbol: 'Rp',
    budget: { accommodation: 'Rp100k–200k', meal: 'Rp30k–60k', transport: 'Rp50k', dailyTotal: '~$15–25' },
    comfort: { accommodation: 'Rp500k–1M', meal: 'Rp100k–200k', transport: 'Rp100k', dailyTotal: '~$50–80' },
    luxury: { accommodation: 'Rp2M+', meal: 'Rp300k+', transport: 'Rp200k+', dailyTotal: '~$150+' },
    tipping: '10% at restaurants. Round up for drivers.',
    bargaining: 'Expected at markets. Start at 40% of asking price.',
  },
  'bangkok': {
    city: 'Bangkok', country: 'Thailand', currency: 'THB', currencySymbol: '฿',
    budget: { accommodation: '฿300–600', meal: '฿50–150', transport: '฿100', dailyTotal: '~$15–25' },
    comfort: { accommodation: '฿1,500–3,000', meal: '฿200–500', transport: '฿300', dailyTotal: '~$50–100' },
    luxury: { accommodation: '฿5,000+', meal: '฿1,000+', transport: '฿500+', dailyTotal: '~$200+' },
    tipping: 'Not expected but 20–50 baht appreciated at restaurants.',
    bargaining: 'Markets and tuk-tuks yes. Malls no.',
  },
  'mexico city': {
    city: 'Mexico City', country: 'Mexico', currency: 'MXN', currencySymbol: '$',
    budget: { accommodation: '$300–600 MXN', meal: '$50–150 MXN', transport: '$50 MXN', dailyTotal: '~$20–35' },
    comfort: { accommodation: '$1,500–3,000 MXN', meal: '$200–500 MXN', transport: '$200 MXN', dailyTotal: '~$70–130' },
    luxury: { accommodation: '$5,000+ MXN', meal: '$1,000+ MXN', transport: '$500+ MXN', dailyTotal: '~$250+' },
    tipping: '10–15% at restaurants. Propinas expected.',
    bargaining: 'Markets yes. Restaurants and shops no.',
  },
  'paris': {
    city: 'Paris', country: 'France', currency: 'EUR', currencySymbol: '€',
    budget: { accommodation: '€30–60', meal: '€8–15', transport: '€10', dailyTotal: '~$60–100' },
    comfort: { accommodation: '€100–200', meal: '€20–40', transport: '€15', dailyTotal: '~$150–250' },
    luxury: { accommodation: '€300+', meal: '€60+', transport: '€30+', dailyTotal: '~$400+' },
    tipping: 'Service included (service compris). Round up for good service.',
    bargaining: 'Never. Prices are fixed.',
  },
  'barcelona': {
    city: 'Barcelona', country: 'Spain', currency: 'EUR', currencySymbol: '€',
    budget: { accommodation: '€20–50', meal: '€8–12', transport: '€8', dailyTotal: '~$40–70' },
    comfort: { accommodation: '€80–150', meal: '€15–30', transport: '€12', dailyTotal: '~$100–180' },
    luxury: { accommodation: '€250+', meal: '€50+', transport: '€25+', dailyTotal: '~$300+' },
    tipping: 'Not expected. 5–10% for exceptional service.',
    bargaining: 'La Boquería market vendors expect fixed prices. Flea markets maybe.',
  },
  'budapest': {
    city: 'Budapest', country: 'Hungary', currency: 'HUF', currencySymbol: 'Ft',
    budget: { accommodation: '5,000–10,000 Ft', meal: '1,500–3,000 Ft', transport: '1,500 Ft', dailyTotal: '~$25–40' },
    comfort: { accommodation: '15,000–30,000 Ft', meal: '4,000–8,000 Ft', transport: '3,000 Ft', dailyTotal: '~$60–100' },
    luxury: { accommodation: '50,000+ Ft', meal: '15,000+ Ft', transport: '5,000+ Ft', dailyTotal: '~$200+' },
    tipping: '10% at restaurants. Check if service charge is included.',
    bargaining: 'Not common except at flea markets.',
  },
  'marrakech': {
    city: 'Marrakech', country: 'Morocco', currency: 'MAD', currencySymbol: 'د.م.',
    budget: { accommodation: '150–300 MAD', meal: '30–60 MAD', transport: '30 MAD', dailyTotal: '~$20–35' },
    comfort: { accommodation: '600–1,200 MAD', meal: '100–200 MAD', transport: '100 MAD', dailyTotal: '~$60–120' },
    luxury: { accommodation: '2,000+ MAD', meal: '300+ MAD', transport: '200+ MAD', dailyTotal: '~$200+' },
    tipping: '10% at restaurants. Small tips for guides and hammam attendants.',
    bargaining: 'Essential in souks. Start at 30% of asking price. Walk away to get best price.',
  },
  'cape town': {
    city: 'Cape Town', country: 'South Africa', currency: 'ZAR', currencySymbol: 'R',
    budget: { accommodation: 'R300–600', meal: 'R80–150', transport: 'R100', dailyTotal: '~$25–45' },
    comfort: { accommodation: 'R1,200–2,500', meal: 'R200–400', transport: 'R200', dailyTotal: '~$80–150' },
    luxury: { accommodation: 'R4,000+', meal: 'R600+', transport: 'R400+', dailyTotal: '~$250+' },
    tipping: '10–15% at restaurants. R20–50 for car guards.',
    bargaining: 'Greenmarket Square and craft markets yes. Shops no.',
  },
  'lisbon': {
    city: 'Lisbon', country: 'Portugal', currency: 'EUR', currencySymbol: '€',
    budget: { accommodation: '€20–40', meal: '€6–12', transport: '€6', dailyTotal: '~$35–60' },
    comfort: { accommodation: '€80–150', meal: '€15–25', transport: '€10', dailyTotal: '~$90–160' },
    luxury: { accommodation: '€200+', meal: '€40+', transport: '€20+', dailyTotal: '~$250+' },
    tipping: 'Not expected. 5–10% for good service.',
    bargaining: 'Not common. Fixed prices everywhere.',
  },
};

export function getCostOfLiving(destination: string): CostOfLiving | null {
  const key = destination.toLowerCase().trim();
  return COST_DATA[key] ?? null;
}

export function getAvailableCostCities(): string[] {
  return Object.keys(COST_DATA);
}
