/**
 * Comprehensive unit tests for parseItinerary()
 * Covers validation of every required/optional field, code-fence stripping,
 * multi-day trips, and all error paths.
 */
import { parseItinerary, type Itinerary, type TimeSlotActivity } from '../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

function makeSlot(overrides: Partial<TimeSlotActivity> = {}): TimeSlotActivity {
  return {
    activity: 'Visit Senso-ji Temple',
    location: 'Senso-ji, Asakusa',
    cost: '$0',
    tip: 'Arrive before 8 AM to beat the crowds',
    ...overrides,
  };
}

function makeValidRaw(overrides: Record<string, unknown> = {}): string {
  const base = {
    destination: 'Tokyo, Japan',
    tagline: 'Neon lights, ancient temples',
    totalBudget: '$2,500',
    days: [
      {
        day: 1,
        theme: 'Shibuya & Harajuku',
        morning: makeSlot(),
        afternoon: makeSlot({ activity: 'Takeshita Street', location: 'Harajuku', cost: '$20' }),
        evening: makeSlot({ activity: 'Ramen at Ichiran', location: 'Shibuya', cost: '$15' }),
        accommodation: { name: 'Hotel Gracery Shinjuku', type: 'hotel', pricePerNight: '$120' },
        dailyCost: '$155',
      },
    ],
    budgetBreakdown: {
      accommodation: '$840',
      food: '$420',
      activities: '$350',
      transportation: '$280',
      miscellaneous: '$200',
    },
    packingEssentials: ['Portable charger', 'Walking shoes'],
    proTip: 'Get a Suica card at the airport — works for trains, subway, and convenience stores.',
    visaInfo: 'US citizens: visa-free for up to 90 days.',
    ...overrides,
  };
  return JSON.stringify(base);
}

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

describe('parseItinerary — happy paths', () => {
  it('returns a typed Itinerary object', () => {
    const result: Itinerary = parseItinerary(makeValidRaw());
    expect(result).toBeTruthy();
    expect(result.destination).toBe('Tokyo, Japan');
  });

  it('returns all required top-level fields', () => {
    const result = parseItinerary(makeValidRaw());
    expect(result.tagline).toBe('Neon lights, ancient temples');
    expect(result.totalBudget).toBe('$2,500');
    expect(result.proTip).toContain('Suica');
    expect(result.visaInfo).toContain('90 days');
  });

  it('returns the days array with correct length', () => {
    const result = parseItinerary(makeValidRaw());
    expect(Array.isArray(result.days)).toBe(true);
    expect(result.days).toHaveLength(1);
  });

  it('returns all budgetBreakdown fields', () => {
    const result = parseItinerary(makeValidRaw());
    expect(result.budgetBreakdown.accommodation).toBe('$840');
    expect(result.budgetBreakdown.food).toBe('$420');
    expect(result.budgetBreakdown.activities).toBe('$350');
    expect(result.budgetBreakdown.transportation).toBe('$280');
    expect(result.budgetBreakdown.miscellaneous).toBe('$200');
  });

  it('returns the packingEssentials array', () => {
    const result = parseItinerary(makeValidRaw());
    expect(result.packingEssentials).toEqual(['Portable charger', 'Walking shoes']);
  });

  it('accepts an empty packingEssentials array', () => {
    const result = parseItinerary(makeValidRaw({ packingEssentials: [] }));
    expect(result.packingEssentials).toEqual([]);
  });

  it('handles a 7-day itinerary', () => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      theme: `Day ${i + 1} theme`,
      morning: makeSlot(),
      afternoon: makeSlot(),
      evening: makeSlot(),
      accommodation: { name: 'Hotel', type: 'hotel', pricePerNight: '$100' },
      dailyCost: '$120',
    }));
    const result = parseItinerary(makeValidRaw({ days }));
    expect(result.days).toHaveLength(7);
    expect(result.days[6].day).toBe(7);
  });

  it('strips ```json ... ``` code fences', () => {
    const wrapped = '```json\n' + makeValidRaw() + '\n```';
    expect(parseItinerary(wrapped).destination).toBe('Tokyo, Japan');
  });

  it('strips plain ``` ... ``` code fences', () => {
    const wrapped = '```\n' + makeValidRaw() + '\n```';
    expect(parseItinerary(wrapped).destination).toBe('Tokyo, Japan');
  });

  it('trims leading/trailing whitespace before parsing', () => {
    expect(parseItinerary('  \n' + makeValidRaw() + '\n  ').destination).toBe('Tokyo, Japan');
  });
});

// ---------------------------------------------------------------------------
// Optional TimeSlotActivity fields
// ---------------------------------------------------------------------------

describe('parseItinerary — optional TimeSlotActivity fields', () => {
  it('accepts time, duration, neighborhood, address, transitToNext when provided as strings', () => {
    const slot = makeSlot({
      time: '9:00 AM',
      duration: '90',
      neighborhood: 'Asakusa',
      address: 'Senso-ji Temple, 2-3-1 Asakusa, Tokyo',
      transitToNext: '10 min walk to Ueno Park',
    });
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'Asakusa', morning: slot,
        afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'Hotel', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$120',
      }],
    });
    const result = parseItinerary(raw);
    const m = result.days[0].morning;
    expect(m.time).toBe('9:00 AM');
    expect(m.duration).toBe('90');
    expect(m.neighborhood).toBe('Asakusa');
    expect(m.address).toContain('Asakusa');
    expect(m.transitToNext).toContain('Ueno');
  });

  it('throws when time is present but not a string', () => {
    const slot = makeSlot({ time: 900 as unknown as string });
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T', morning: slot,
        afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('time must be a string');
  });

  it('throws when duration is present but not a string', () => {
    const slot = makeSlot({ duration: 90 as unknown as string });
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T', morning: slot,
        afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('duration must be a string');
  });

  it('throws when neighborhood is present but not a string', () => {
    const slot = makeSlot({ neighborhood: 42 as unknown as string });
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T', morning: slot,
        afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('neighborhood must be a string');
  });

  it('throws when address is present but not a string', () => {
    const slot = makeSlot({ address: true as unknown as string });
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T', morning: slot,
        afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('address must be a string');
  });

  it('throws when transitToNext is present but not a string', () => {
    const slot = makeSlot({ transitToNext: [] as unknown as string });
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T', morning: slot,
        afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('transitToNext must be a string');
  });
});

// ---------------------------------------------------------------------------
// Optional day-level fields
// ---------------------------------------------------------------------------

describe('parseItinerary — optional day-level fields', () => {
  it('accepts routeSummary when provided as a string', () => {
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T',
        morning: makeSlot(), afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
        routeSummary: 'Shibuya → Harajuku → Shinjuku',
      }],
    });
    const result = parseItinerary(raw);
    expect(result.days[0].routeSummary).toBe('Shibuya → Harajuku → Shinjuku');
  });

  it('throws when routeSummary is present but not a string', () => {
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T',
        morning: makeSlot(), afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'H', type: 'hotel', pricePerNight: '$100' },
        dailyCost: '$100',
        routeSummary: 123,
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('routeSummary must be a string');
  });

  it('accepts accommodation.neighborhood when provided as a string', () => {
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T',
        morning: makeSlot(), afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'Hotel', type: 'hotel', pricePerNight: '$100', neighborhood: 'Shinjuku' },
        dailyCost: '$100',
      }],
    });
    const result = parseItinerary(raw);
    expect(result.days[0].accommodation.neighborhood).toBe('Shinjuku');
  });

  it('throws when accommodation.neighborhood is present but not a string', () => {
    const raw = makeValidRaw({
      days: [{
        day: 1, theme: 'T',
        morning: makeSlot(), afternoon: makeSlot(), evening: makeSlot(),
        accommodation: { name: 'Hotel', type: 'hotel', pricePerNight: '$100', neighborhood: 99 },
        dailyCost: '$100',
      }],
    });
    expect(() => parseItinerary(raw)).toThrow('accommodation.neighborhood must be a string');
  });
});

// ---------------------------------------------------------------------------
// Missing required top-level string fields
// ---------------------------------------------------------------------------

describe('parseItinerary — missing required top-level strings', () => {
  it('throws when tagline is missing', () => {
    const { tagline: _, ...rest } = JSON.parse(makeValidRaw());
    expect(() => parseItinerary(JSON.stringify(rest))).toThrow('missing required string field: tagline');
  });

  it('throws when totalBudget is missing', () => {
    const { totalBudget: _, ...rest } = JSON.parse(makeValidRaw());
    expect(() => parseItinerary(JSON.stringify(rest))).toThrow('missing required string field: totalBudget');
  });

  it('throws when proTip is missing', () => {
    const { proTip: _, ...rest } = JSON.parse(makeValidRaw());
    expect(() => parseItinerary(JSON.stringify(rest))).toThrow('missing required string field: proTip');
  });

  it('throws when visaInfo is missing', () => {
    const { visaInfo: _, ...rest } = JSON.parse(makeValidRaw());
    expect(() => parseItinerary(JSON.stringify(rest))).toThrow('missing required string field: visaInfo');
  });

  it('throws when destination is a number instead of string', () => {
    expect(() => parseItinerary(makeValidRaw({ destination: 42 }))).toThrow(
      'missing required string field: destination'
    );
  });

  it('throws when proTip is null', () => {
    expect(() => parseItinerary(makeValidRaw({ proTip: null }))).toThrow(
      'missing required string field: proTip'
    );
  });
});

// ---------------------------------------------------------------------------
// Missing required budgetBreakdown sub-fields
// ---------------------------------------------------------------------------

describe('parseItinerary — budgetBreakdown sub-field validation', () => {
  const fields = ['food', 'activities', 'transportation', 'miscellaneous'] as const;

  for (const field of fields) {
    it(`throws when budgetBreakdown.${field} is missing`, () => {
      const parsed = JSON.parse(makeValidRaw());
      delete parsed.budgetBreakdown[field];
      expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
        `budgetBreakdown missing field: ${field}`
      );
    });
  }

  it('throws when budgetBreakdown.accommodation is a number', () => {
    const parsed = JSON.parse(makeValidRaw());
    parsed.budgetBreakdown.accommodation = 840;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'budgetBreakdown missing field: accommodation'
    );
  });
});

// ---------------------------------------------------------------------------
// Day-level field validation
// ---------------------------------------------------------------------------

describe('parseItinerary — day-level field validation', () => {
  function makeBadDay(overrides: Record<string, unknown>) {
    const parsed = JSON.parse(makeValidRaw());
    parsed.days[0] = { ...parsed.days[0], ...overrides };
    return JSON.stringify(parsed);
  }

  it('throws when day.day is a string instead of number', () => {
    expect(() => parseItinerary(makeBadDay({ day: '1' }))).toThrow('days[0].day must be a number');
  });

  it('throws when day.day is missing', () => {
    const parsed = JSON.parse(makeValidRaw());
    delete parsed.days[0].day;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow('days[0].day must be a number');
  });

  it('throws when day.theme is a number', () => {
    expect(() => parseItinerary(makeBadDay({ theme: 1 }))).toThrow('days[0].theme must be a string');
  });

  it('throws when day.dailyCost is missing', () => {
    const parsed = JSON.parse(makeValidRaw());
    delete parsed.days[0].dailyCost;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow('days[0].dailyCost must be a string');
  });

  it('throws when morning slot is null', () => {
    expect(() => parseItinerary(makeBadDay({ morning: null }))).toThrow(
      'days[0].morning must be an object'
    );
  });

  it('throws when afternoon slot is missing', () => {
    const parsed = JSON.parse(makeValidRaw());
    delete parsed.days[0].afternoon;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'days[0].afternoon must be an object'
    );
  });

  it('throws when evening slot is an array (fails field check — arrays are typeof "object")', () => {
    // An empty array passes typeof check but has no .activity — fails field validation
    expect(() => parseItinerary(makeBadDay({ evening: [] }))).toThrow(
      'days[0].evening.activity must be a string'
    );
  });

  it('throws when morning.activity is missing', () => {
    const parsed = JSON.parse(makeValidRaw());
    delete parsed.days[0].morning.activity;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'days[0].morning.activity must be a string'
    );
  });

  it('throws when afternoon.location is a number', () => {
    const parsed = JSON.parse(makeValidRaw());
    parsed.days[0].afternoon.location = 99;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'days[0].afternoon.location must be a string'
    );
  });

  it('throws when evening.tip is missing', () => {
    const parsed = JSON.parse(makeValidRaw());
    delete parsed.days[0].evening.tip;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'days[0].evening.tip must be a string'
    );
  });

  it('throws when accommodation is null', () => {
    expect(() => parseItinerary(makeBadDay({ accommodation: null }))).toThrow(
      'days[0].accommodation must be an object'
    );
  });

  it('throws when accommodation.name is missing', () => {
    const parsed = JSON.parse(makeValidRaw());
    delete parsed.days[0].accommodation.name;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'days[0].accommodation.name must be a string'
    );
  });

  it('throws when accommodation.pricePerNight is a number', () => {
    const parsed = JSON.parse(makeValidRaw());
    parsed.days[0].accommodation.pricePerNight = 120;
    expect(() => parseItinerary(JSON.stringify(parsed))).toThrow(
      'days[0].accommodation.pricePerNight must be a string'
    );
  });
});

// ---------------------------------------------------------------------------
// JSON-level errors
// ---------------------------------------------------------------------------

describe('parseItinerary — JSON-level errors', () => {
  it('throws on completely invalid JSON', () => {
    expect(() => parseItinerary('not json at all')).toThrow('Failed to parse itinerary JSON');
  });

  it('throws on truncated JSON', () => {
    expect(() => parseItinerary('{"destination": "Tokyo"')).toThrow('Failed to parse itinerary JSON');
  });

  it('throws on JSON null', () => {
    expect(() => parseItinerary('null')).toThrow('Itinerary must be a JSON object');
  });

  it('throws on JSON array', () => {
    expect(() => parseItinerary('[]')).toThrow();
  });

  it('throws on JSON number', () => {
    expect(() => parseItinerary('42')).toThrow('Itinerary must be a JSON object');
  });

  it('throws on JSON string', () => {
    expect(() => parseItinerary('"hello"')).toThrow('Itinerary must be a JSON object');
  });

  it('throws on empty string', () => {
    expect(() => parseItinerary('')).toThrow();
  });
});
