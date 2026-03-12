// =============================================================================
// ROAM — Destination metadata for premium cards
// Safety score (1–5), avg daily cost, best month
// =============================================================================

export interface DestinationMeta {
  safetyScore: number;
  avgDailyCost: string;
  bestMonth: string;
}

export const DESTINATION_META: Record<string, DestinationMeta> = {
  Tokyo: { safetyScore: 5, avgDailyCost: '$120', bestMonth: 'Nov' },
  Paris: { safetyScore: 5, avgDailyCost: '$180', bestMonth: 'May' },
  Bali: { safetyScore: 4, avgDailyCost: '$45', bestMonth: 'Apr' },
  'New York': { safetyScore: 5, avgDailyCost: '$250', bestMonth: 'Sep' },
  Barcelona: { safetyScore: 5, avgDailyCost: '$100', bestMonth: 'May' },
  Rome: { safetyScore: 5, avgDailyCost: '$110', bestMonth: 'Oct' },
  London: { safetyScore: 5, avgDailyCost: '$200', bestMonth: 'Jun' },
  Bangkok: { safetyScore: 4, avgDailyCost: '$35', bestMonth: 'Nov' },
  Marrakech: { safetyScore: 4, avgDailyCost: '$55', bestMonth: 'Mar' },
  Lisbon: { safetyScore: 5, avgDailyCost: '$70', bestMonth: 'Jun' },
  'Cape Town': { safetyScore: 4, avgDailyCost: '$65', bestMonth: 'Mar' },
  Reykjavik: { safetyScore: 5, avgDailyCost: '$180', bestMonth: 'Aug' },
  Seoul: { safetyScore: 5, avgDailyCost: '$80', bestMonth: 'Oct' },
  'Buenos Aires': { safetyScore: 4, avgDailyCost: '$50', bestMonth: 'Mar' },
  Istanbul: { safetyScore: 4, avgDailyCost: '$55', bestMonth: 'May' },
  Sydney: { safetyScore: 5, avgDailyCost: '$150', bestMonth: 'Mar' },
  'Mexico City': { safetyScore: 4, avgDailyCost: '$45', bestMonth: 'Nov' },
  Dubai: { safetyScore: 5, avgDailyCost: '$300', bestMonth: 'Jan' },
  Kyoto: { safetyScore: 5, avgDailyCost: '$100', bestMonth: 'Nov' },
  Amsterdam: { safetyScore: 5, avgDailyCost: '$130', bestMonth: 'Apr' },
  Medellín: { safetyScore: 4, avgDailyCost: '$40', bestMonth: 'Dec' },
  Tbilisi: { safetyScore: 5, avgDailyCost: '$35', bestMonth: 'May' },
  'Chiang Mai': { safetyScore: 5, avgDailyCost: '$30', bestMonth: 'Nov' },
  Porto: { safetyScore: 5, avgDailyCost: '$65', bestMonth: 'Jun' },
  Oaxaca: { safetyScore: 4, avgDailyCost: '$40', bestMonth: 'Nov' },
  Dubrovnik: { safetyScore: 5, avgDailyCost: '$90', bestMonth: 'Jun' },
  Budapest: { safetyScore: 5, avgDailyCost: '$55', bestMonth: 'May' },
  'Hoi An': { safetyScore: 5, avgDailyCost: '$35', bestMonth: 'Feb' },
  Cartagena: { safetyScore: 4, avgDailyCost: '$60', bestMonth: 'Dec' },
  Jaipur: { safetyScore: 4, avgDailyCost: '$40', bestMonth: 'Feb' },
  Queenstown: { safetyScore: 5, avgDailyCost: '$140', bestMonth: 'Mar' },
};
