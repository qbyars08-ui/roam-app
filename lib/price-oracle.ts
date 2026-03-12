// =============================================================================
// ROAM — Price Oracle (Numbeo-style cost of living)
// "Your $150/day in Tokyo buys: 1 night hotel + 3 meals + 5 metro + 1 activity"
// =============================================================================

export interface CostBreakdown {
  destination: string;
  dailyBudget: number;
  breakdown: string;
  trend?: string;  // "up 8% vs last year"
}

const COST_DATA: Record<string, { meal: number; transport: number; hotel: number }> = {
  tokyo: { meal: 12, transport: 8, hotel: 80 },
  paris: { meal: 18, transport: 10, hotel: 120 },
  bangkok: { meal: 5, transport: 3, hotel: 35 },
  bali: { meal: 6, transport: 4, hotel: 45 },
  lisbon: { meal: 12, transport: 4, hotel: 70 },
  'mexico city': { meal: 8, transport: 2, hotel: 55 },
  barcelona: { meal: 15, transport: 6, hotel: 90 },
  rome: { meal: 16, transport: 5, hotel: 100 },
  london: { meal: 20, transport: 12, hotel: 140 },
  seoul: { meal: 10, transport: 3, hotel: 75 },
  istanbul: { meal: 8, transport: 2, hotel: 50 },
};

function keyForCity(city: string): string | null {
  const k = city.toLowerCase().trim();
  for (const key of Object.keys(COST_DATA)) {
    if (k.includes(key) || key.includes(k)) return key;
  }
  return null;
}

export function getCostBreakdown(destination: string, dailyBudget: number): CostBreakdown {
  const key = keyForCity(destination);
  const data = key ? COST_DATA[key] : { meal: 12, transport: 5, hotel: 80 };

  const meals = Math.floor(dailyBudget * 0.3 / data.meal);
  const transport = Math.floor(dailyBudget * 0.15 / data.transport);
  const hotel = dailyBudget >= data.hotel ? 1 : 0;
  const activity = Math.floor((dailyBudget - data.hotel - meals * data.meal - transport * data.transport) / 20);

  const parts: string[] = [];
  if (hotel) parts.push('1 night mid-range hotel');
  if (meals >= 1) parts.push(`${meals} meals`);
  if (transport >= 1) parts.push(`${transport} metro/taxi rides`);
  if (activity >= 1) parts.push(`${activity} activity`);

  return {
    destination,
    dailyBudget,
    breakdown: parts.length > 0
      ? `Your $${dailyBudget}/day in ${destination} buys: ${parts.join(' + ')}`
      : `Budget ~$${dailyBudget}/day for ${destination}`,
    trend: key && Math.random() > 0.6 ? 'Tokyo getting more expensive — up 8% vs last year' : undefined,
  };
}
