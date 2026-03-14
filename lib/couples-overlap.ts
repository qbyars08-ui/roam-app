// =============================================================================
// ROAM for Dates — Merge two travel profiles into one "couples" profile
// Finds overlap: average numeric, intersect multi-select, compromise accommodation
// =============================================================================
import type {
  TravelProfile,
  TransportPreference,
  TripPurpose,
  AccommodationStyle,
  TravelFrequency,
} from './types/travel-profile';

export function mergeProfiles(a: TravelProfile, b: TravelProfile): TravelProfile {
  const avg = (x: number, y: number) => Math.round((x + y) / 2);
  const transportSet = new Set<TransportPreference>([
    ...a.transport.filter((t) => b.transport.includes(t)),
    ...(a.transport.length === 0 && b.transport.length === 0
      ? ([] as TransportPreference[])
      : a.transport.length === 0
      ? b.transport
      : b.transport.length === 0
      ? a.transport
      : a.transport.filter((t) => b.transport.includes(t))),
  ]);
  const purposesSet = new Set<TripPurpose>(
    a.tripPurposes.length === 0 || b.tripPurposes.length === 0
      ? [...a.tripPurposes, ...b.tripPurposes]
      : a.tripPurposes.filter((p) => b.tripPurposes.includes(p))
  );

  const accommodationOrder: AccommodationStyle[] = [
    'hostels',
    'budget-hotels',
    'apartments',
    'boutique',
    'mix',
    'luxury',
  ];
  const accIdx = (s: AccommodationStyle) => accommodationOrder.indexOf(s) ?? 2;
  const accA = accIdx(a.accommodation);
  const accB = accIdx(b.accommodation);
  const mid = Math.round((accA + accB) / 2);
  const accommodation = accommodationOrder[Math.min(mid, accommodationOrder.length - 1)] ?? 'mix';

  const freqOrder: TravelFrequency[] = ['first-trip', 'once-a-year', 'few-times-year', 'constantly'];
  const freqIdx = (f: TravelFrequency) => freqOrder.indexOf(f);
  const freqMid = Math.round((freqIdx(a.travelFrequency) + freqIdx(b.travelFrequency)) / 2);
  const travelFrequency = freqOrder[Math.min(freqMid, 3)] ?? 'few-times-year';

  return {
    passportNationality: a.passportNationality,
    travelFrequency,
    pace: Math.min(10, avg(a.pace, b.pace) + 0) || 5,
    budgetStyle: Math.min(10, avg(a.budgetStyle, b.budgetStyle) + 0) || 5,
    transport: Array.from(transportSet),
    crowdTolerance: Math.min(10, avg(a.crowdTolerance, b.crowdTolerance) + 0) || 5,
    foodAdventurousness: Math.min(10, avg(a.foodAdventurousness, b.foodAdventurousness) + 0) || 5,
    accommodation,
    tripPurposes: Array.from(purposesSet),
  };
}
