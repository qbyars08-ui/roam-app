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
  };
  dailyCost: string;
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
    throw new Error(
      `Failed to parse itinerary JSON: ${err instanceof Error ? err.message : String(err)}`
    );
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
  }

  return parsed as Itinerary;
}
