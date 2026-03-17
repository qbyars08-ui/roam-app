// =============================================================================
// ROAM — Itinerary Types & Runtime Validator
// =============================================================================

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface TimeSlotActivity {
  activity: string;
  location: string;
  cost: string;
  tip: string;
  /** Exact time e.g. "9:00 AM" — required for itinerary display */
  time?: string;
  /** Duration in minutes e.g. "90" — helps users plan their day */
  duration?: string;
  /** Neighborhood or district e.g. "Shibuya" — helps with map grouping */
  neighborhood?: string;
  /** Google Maps-friendly address for navigation */
  address?: string;
  /** Transit info to next activity e.g. "15 min walk" or "Take subway Ginza Line, 3 stops" */
  transitToNext?: string;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  morning: TimeSlotActivity;
  afternoon: TimeSlotActivity;
  evening: TimeSlotActivity;
  accommodation: {
    name: string;
    type: string;
    pricePerNight: string;
    /** Neighborhood for map context */
    neighborhood?: string;
  };
  dailyCost: string;
  /** Summary of the day's neighborhoods e.g. "Shibuya → Harajuku → Shinjuku" */
  routeSummary?: string;
}

export interface BudgetBreakdown {
  accommodation: string;
  food: string;
  activities: string;
  transportation: string;
  miscellaneous: string;
}

export interface Itinerary {
  destination: string;
  tagline: string;
  totalBudget: string;
  days: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  packingEssentials: string[];
  proTip: string;
  visaInfo: string;
}

// ---------------------------------------------------------------------------
// Runtime validator — parse raw Claude output into a typed Itinerary
// ---------------------------------------------------------------------------

/**
 * Strip optional markdown code fences (`\`\`\`json ... \`\`\``) that Claude
 * sometimes wraps around JSON output, then parse and validate.
 */
export function parseItinerary(raw: string): Itinerary {
  // #region agent log
  const logPayload = { sessionId: 'f6988f', location: 'itinerary.ts:parseItinerary', message: 'parseItinerary entry', data: { rawLen: raw?.length ?? 0, rawPreview: raw?.trim().slice(0, 120) }, timestamp: Date.now(), hypothesisId: 'D' };
  if (typeof fetch !== 'undefined') {
    fetch('http://127.0.0.1:7616/ingest/63f217f0-eacc-4083-91d1-27bfecce344b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f6988f' }, body: JSON.stringify(logPayload) }).catch(() => {});
  }
  // #endregion
  // 1. Strip markdown code fences if present
  let cleaned = raw.trim();

  // Handle ```json ... ``` or ``` ... ```
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/;
  const match = cleaned.match(fenceRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  // 2. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const msg = `Failed to parse itinerary JSON: ${err instanceof Error ? err.message : String(err)}`;
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7616/ingest/63f217f0-eacc-4083-91d1-27bfecce344b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f6988f' }, body: JSON.stringify({ sessionId: 'f6988f', location: 'itinerary.ts:parseItinerary', message: 'JSON.parse threw', data: { errMessage: msg }, timestamp: Date.now(), hypothesisId: 'D' }) }).catch(() => {});
    }
    throw new Error(msg);
  }

  // 3. Validate top-level shape
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Itinerary must be a JSON object');
  }

  const obj = parsed as Record<string, unknown>;

  const requiredStrings = ['destination', 'tagline', 'totalBudget', 'proTip', 'visaInfo'] as const;
  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string') {
      throw new Error(`Itinerary missing required string field: ${key}`);
    }
  }

  if (!Array.isArray(obj.days) || obj.days.length === 0) {
    throw new Error('Itinerary must include at least one day');
  }

  if (!Array.isArray(obj.packingEssentials)) {
    throw new Error('Itinerary must include packingEssentials array');
  }

  // 4. Validate budgetBreakdown
  if (typeof obj.budgetBreakdown !== 'object' || obj.budgetBreakdown === null) {
    throw new Error('Itinerary must include budgetBreakdown object');
  }
  const bb = obj.budgetBreakdown as Record<string, unknown>;
  const bbFields = ['accommodation', 'food', 'activities', 'transportation', 'miscellaneous'] as const;
  for (const key of bbFields) {
    if (typeof bb[key] !== 'string') {
      throw new Error(`budgetBreakdown missing field: ${key}`);
    }
  }

  // 5. Validate each day
  for (let i = 0; i < obj.days.length; i++) {
    const day = obj.days[i] as Record<string, unknown>;
    if (typeof day.day !== 'number') {
      throw new Error(`days[${i}].day must be a number`);
    }
    if (typeof day.theme !== 'string') {
      throw new Error(`days[${i}].theme must be a string`);
    }
    if (typeof day.dailyCost !== 'string') {
      throw new Error(`days[${i}].dailyCost must be a string`);
    }

    // Validate time slots
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      const ts = day[slot] as Record<string, unknown> | undefined;
      if (!ts || typeof ts !== 'object') {
        throw new Error(`days[${i}].${slot} must be an object`);
      }
      for (const field of ['activity', 'location', 'cost', 'tip'] as const) {
        if (typeof ts[field] !== 'string') {
          throw new Error(`days[${i}].${slot}.${field} must be a string`);
        }
      }
      // Validate optional string fields
      for (const optField of ['time', 'duration', 'neighborhood', 'address', 'transitToNext'] as const) {
        if (ts[optField] !== undefined && typeof ts[optField] !== 'string') {
          throw new Error(`days[${i}].${slot}.${optField} must be a string if present`);
        }
      }
    }

    // Validate optional day-level fields
    if (day.routeSummary !== undefined && typeof day.routeSummary !== 'string') {
      throw new Error(`days[${i}].routeSummary must be a string if present`);
    }

    // Validate accommodation
    const acc = day.accommodation as Record<string, unknown> | undefined;
    if (!acc || typeof acc !== 'object') {
      throw new Error(`days[${i}].accommodation must be an object`);
    }
    for (const field of ['name', 'type', 'pricePerNight'] as const) {
      if (typeof acc[field] !== 'string') {
        throw new Error(`days[${i}].accommodation.${field} must be a string`);
      }
    }
    if (acc.neighborhood !== undefined && typeof acc.neighborhood !== 'string') {
      throw new Error(`days[${i}].accommodation.neighborhood must be a string if present`);
    }
  }

  return parsed as Itinerary;
}
