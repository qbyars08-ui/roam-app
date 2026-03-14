/**
 * Unit tests for buildTripPrompt() in lib/claude.ts
 *
 * buildTripPrompt is a pure string-building function — no network calls,
 * no mocks needed. Every branch and optional section is tested.
 */
import { buildTripPrompt, type WeatherContext } from '../lib/claude';
import { type TravelProfile } from '../lib/types/travel-profile';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  destination: 'Tokyo, Japan',
  days: 5,
  budget: 'mid',
  vibes: ['culture', 'food'],
} as const;

const MOCK_PROFILE: TravelProfile = {
  passportNationality: 'US',
  travelFrequency: 'few-times-year',
  pace: 5,
  budgetStyle: 5,
  transport: [],
  crowdTolerance: 5,
  foodAdventurousness: 7,
  accommodation: 'boutique',
  tripPurposes: ['food', 'history'],
};

const MOCK_WEATHER: WeatherContext = {
  days: [
    { date: '2026-04-01', tempMin: 12, tempMax: 19, description: 'Partly cloudy', pop: 0.1 },
    { date: '2026-04-02', tempMin: 10, tempMax: 16, description: 'Rain showers', pop: 0.75 },
    { date: '2026-04-03', tempMin: 14, tempMax: 22, description: 'Sunny', pop: 0.05 },
  ],
};

// ---------------------------------------------------------------------------
// Return type & basic structure
// ---------------------------------------------------------------------------

describe('buildTripPrompt — return type and basic structure', () => {
  it('returns a non-empty string', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the destination', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).toContain('Tokyo, Japan');
  });

  it('contains the number of days', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).toContain('5-day');
  });

  it('contains the budget tier', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).toContain('mid');
  });

  it('contains the vibes joined as a list', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).toContain('culture, food');
  });

  it('ends with the final instruction line', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).toContain('Provide a complete itinerary with real place names, costs, and insider tips.');
  });
});

// ---------------------------------------------------------------------------
// Vibes
// ---------------------------------------------------------------------------

describe('buildTripPrompt — vibes', () => {
  it('uses "general sightseeing" when vibes array is empty', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, vibes: [] });
    expect(result).toContain('general sightseeing');
  });

  it('joins multiple vibes with ", "', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, vibes: ['adventure', 'nightlife', 'food'] });
    expect(result).toContain('adventure, nightlife, food');
  });

  it('handles a single vibe', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, vibes: ['relaxation'] });
    expect(result).toContain('relaxation');
  });
});

// ---------------------------------------------------------------------------
// Group size
// ---------------------------------------------------------------------------

describe('buildTripPrompt — groupSize', () => {
  it('does not include group size line when omitted', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Group size');
  });

  it('does not include group size line when groupSize is 1', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, groupSize: 1 });
    expect(result).not.toContain('Group size');
  });

  it('includes group size line when groupSize is 2', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, groupSize: 2 });
    expect(result).toContain('Group size: 2 travelers');
  });

  it('includes group size line when groupSize is 6', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, groupSize: 6 });
    expect(result).toContain('Group size: 6 travelers');
  });
});

// ---------------------------------------------------------------------------
// Trip customization fields
// ---------------------------------------------------------------------------

describe('buildTripPrompt — tripComposition', () => {
  it('is included when provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, tripComposition: 'Couple' });
    expect(result).toContain('Trip composition: Couple');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Trip composition');
  });
});

describe('buildTripPrompt — pace', () => {
  it('is included when provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, pace: 'slow' });
    expect(result).toContain('Travel pace: slow');
  });

  it('includes the matching-activities instruction', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, pace: 'fast' });
    expect(result).toContain('Match the number of activities per time slot to this pace exactly.');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Travel pace');
  });
});

describe('buildTripPrompt — morningType', () => {
  it('maps "early-bird" to the 6:30 AM instruction', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, morningType: 'early-bird' });
    expect(result).toContain('6:30-7:00 AM');
    expect(result).toContain('beat crowds');
  });

  it('maps "regular" to the 9:00 AM instruction', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, morningType: 'regular' });
    expect(result).toContain('9:00 AM');
    expect(result).toContain('Standard pacing');
  });

  it('maps "sleep-in" to the 11:00 AM instruction', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, morningType: 'sleep-in' });
    expect(result).toContain('11:00 AM');
    expect(result).toContain('NOT a morning person');
  });

  it('falls back to raw morningType for unknown values', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, morningType: 'custom-morning' });
    expect(result).toContain('Morning preference: custom-morning');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Morning preference');
    expect(result).not.toContain('morning person');
  });
});

describe('buildTripPrompt — accommodationStyle', () => {
  it('is included when provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, accommodationStyle: 'luxury' });
    expect(result).toContain('Accommodation preference: luxury');
  });

  it('includes the "only suggest this type" instruction', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, accommodationStyle: 'hostel' });
    expect(result).toContain('Only suggest this type of accommodation');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Accommodation preference');
  });
});

describe('buildTripPrompt — transport', () => {
  it('is included when provided with values', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, transport: ['subway', 'walk'] });
    expect(result).toContain('Preferred transport: subway, walk');
    expect(result).toContain('Only use these modes in transitToNext directions.');
  });

  it('is absent when transport is an empty array', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, transport: [] });
    expect(result).not.toContain('Preferred transport');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Preferred transport');
  });
});

describe('buildTripPrompt — dietary', () => {
  it('is included when provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, dietary: ['vegan', 'gluten-free'] });
    expect(result).toContain('Dietary requirements: vegan, gluten-free');
    expect(result).toContain('ALL food recommendations MUST respect these restrictions');
  });

  it('is absent when dietary is an empty array', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, dietary: [] });
    expect(result).not.toContain('Dietary requirements');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('Dietary requirements');
  });
});

// ---------------------------------------------------------------------------
// Special sections (mustVisit, avoidList, specialRequests)
// ---------------------------------------------------------------------------

describe('buildTripPrompt — mustVisit', () => {
  it('inserts the MUST-VISIT block with correct header and footer', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, mustVisit: 'Senso-ji Temple, teamLab Planets' });
    expect(result).toContain('--- MUST-VISIT SPOTS (work these into the itinerary, do NOT skip them) ---');
    expect(result).toContain('Senso-ji Temple, teamLab Planets');
    expect(result).toContain('---');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('MUST-VISIT SPOTS');
  });
});

describe('buildTripPrompt — avoidList', () => {
  it('inserts the AVOID block with correct header', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, avoidList: 'Tsukiji Outer Market, tourist traps' });
    expect(result).toContain('--- AVOID LIST (do NOT include any of these) ---');
    expect(result).toContain('Tsukiji Outer Market, tourist traps');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('AVOID LIST');
  });
});

describe('buildTripPrompt — specialRequests', () => {
  it('inserts the SPECIAL REQUESTS block', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, specialRequests: 'Anniversary trip, surprise hotel upgrade' });
    expect(result).toContain('--- SPECIAL REQUESTS (incorporate these into the plan) ---');
    expect(result).toContain('Anniversary trip');
  });

  it('is absent when not provided', () => {
    const result = buildTripPrompt(BASE_PARAMS);
    expect(result).not.toContain('SPECIAL REQUESTS');
  });
});

// ---------------------------------------------------------------------------
// Travel profile injection
// ---------------------------------------------------------------------------

describe('buildTripPrompt — travelProfile', () => {
  it('injects the TRAVELER PROFILE section when provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, travelProfile: MOCK_PROFILE });
    expect(result).toContain('--- TRAVELER PROFILE (personalize every recommendation to this) ---');
  });

  it('includes passport info from the profile', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, travelProfile: MOCK_PROFILE });
    expect(result).toContain('Passport: US passport');
  });

  it('includes travel frequency from the profile', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, travelProfile: MOCK_PROFILE });
    expect(result).toContain('few times a year');
  });

  it('does NOT inject profile section when travelProfile is null', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, travelProfile: null });
    expect(result).not.toContain('TRAVELER PROFILE');
  });

  it('does NOT inject profile section when travelProfile is undefined', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS });
    expect(result).not.toContain('TRAVELER PROFILE');
  });

  it('injects Austrian passport label for AT nationality', () => {
    const atProfile: TravelProfile = { ...MOCK_PROFILE, passportNationality: 'AT' };
    const result = buildTripPrompt({ ...BASE_PARAMS, travelProfile: atProfile });
    expect(result).toContain('Austrian passport');
  });
});

// ---------------------------------------------------------------------------
// Weather injection
// ---------------------------------------------------------------------------

describe('buildTripPrompt — weather', () => {
  it('injects the WEATHER FORECAST section when provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: MOCK_WEATHER });
    expect(result).toContain('--- WEATHER FORECAST (adapt activities to these conditions) ---');
  });

  it('formats each day with date, temp range, and description', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: MOCK_WEATHER });
    expect(result).toContain('2026-04-01: 12°C–19°C, Partly cloudy');
    expect(result).toContain('2026-04-03: 14°C–22°C, Sunny');
  });

  it('appends rain chance when pop > 0.30 (30%)', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: MOCK_WEATHER });
    // Day 2 has pop=0.75 → 75%
    expect(result).toContain('75% chance of rain');
  });

  it('does NOT append rain chance when pop is exactly 0.30', () => {
    const weather: WeatherContext = {
      days: [{ date: '2026-04-01', tempMin: 10, tempMax: 18, description: 'Cloudy', pop: 0.3 }],
    };
    const result = buildTripPrompt({ ...BASE_PARAMS, weather });
    expect(result).not.toContain('chance of rain');
  });

  it('does NOT append rain chance when pop is below 0.30', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: MOCK_WEATHER });
    // Day 1 has pop=0.1 → no rain annotation
    expect(result).not.toContain('10% chance of rain');
  });

  it('includes the rain-swap instruction when weather is provided', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: MOCK_WEATHER });
    expect(result).toContain('If rain is forecast');
    expect(result).toContain('>40%');
  });

  it('does NOT inject weather section when weather is null', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: null });
    expect(result).not.toContain('WEATHER FORECAST');
  });

  it('does NOT inject weather section when weather.days is empty', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, weather: { days: [] } });
    expect(result).not.toContain('WEATHER FORECAST');
  });
});

// ---------------------------------------------------------------------------
// Multiple optional params combined
// ---------------------------------------------------------------------------

describe('buildTripPrompt — combined optional params', () => {
  it('correctly includes all optional sections when all are provided', () => {
    const result = buildTripPrompt({
      ...BASE_PARAMS,
      groupSize: 3,
      tripComposition: 'Friends',
      pace: 'relaxed',
      morningType: 'sleep-in',
      accommodationStyle: 'boutique',
      transport: ['metro', 'walk'],
      dietary: ['vegetarian'],
      mustVisit: 'teamLab Planets',
      avoidList: 'Hard Rock Cafe',
      specialRequests: 'Birthday trip',
      travelProfile: MOCK_PROFILE,
      weather: MOCK_WEATHER,
    });

    expect(result).toContain('Tokyo, Japan');
    expect(result).toContain('3 travelers');
    expect(result).toContain('Trip composition: Friends');
    expect(result).toContain('Travel pace: relaxed');
    expect(result).toContain('11:00 AM');
    expect(result).toContain('boutique');
    expect(result).toContain('metro, walk');
    expect(result).toContain('vegetarian');
    expect(result).toContain('teamLab Planets');
    expect(result).toContain('Hard Rock Cafe');
    expect(result).toContain('Birthday trip');
    expect(result).toContain('TRAVELER PROFILE');
    expect(result).toContain('WEATHER FORECAST');
  });

  it('produces a deterministic output for the same inputs', () => {
    const a = buildTripPrompt({ ...BASE_PARAMS, travelProfile: MOCK_PROFILE });
    const b = buildTripPrompt({ ...BASE_PARAMS, travelProfile: MOCK_PROFILE });
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Edge cases — added for extended coverage
// ---------------------------------------------------------------------------

describe('buildTripPrompt — edge cases: days boundary', () => {
  it('handles days=1 (single day trip)', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, days: 1 });
    expect(result).toContain('1-day trip');
  });

  it('handles days=30 (max trip)', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, days: 30 });
    expect(result).toContain('30-day trip');
  });
});

describe('buildTripPrompt — edge cases: groupSize', () => {
  it('groupSize=0 is not shown', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, groupSize: 0 });
    expect(result).not.toContain('Group size');
  });

  it('groupSize=10 is shown', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, groupSize: 10 });
    expect(result).toContain('Group size: 10 travelers');
  });
});

describe('buildTripPrompt — edge cases: vibes', () => {
  it('handles 10 vibes joined correctly', () => {
    const vibes = ['adventure', 'culture', 'food', 'nightlife', 'nature',
      'photography', 'relaxation', 'history', 'art', 'wellness'];
    const result = buildTripPrompt({ ...BASE_PARAMS, vibes });
    expect(result).toContain('adventure, culture, food');
    expect(result).toContain('wellness');
  });

  it('single vibe produces no comma', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, vibes: ['adventure'] });
    expect(result).toContain('adventure');
    expect(result).not.toContain('adventure,');
  });
});

describe('buildTripPrompt — edge cases: weather rain boundary', () => {
  it('pop=0.31 (31%) shows rain chance', () => {
    const weather = { days: [{ date: '2026-05-01', tempMin: 10, tempMax: 18, description: 'Cloudy', pop: 0.31 }] };
    expect(buildTripPrompt({ ...BASE_PARAMS, weather })).toContain('31% chance of rain');
  });

  it('pop=0.30 (30%) does NOT show rain chance', () => {
    const weather = { days: [{ date: '2026-05-01', tempMin: 10, tempMax: 18, description: 'Overcast', pop: 0.30 }] };
    expect(buildTripPrompt({ ...BASE_PARAMS, weather })).not.toContain('chance of rain');
  });

  it('pop=0.00 never shows rain', () => {
    const weather = { days: [{ date: '2026-05-01', tempMin: 15, tempMax: 25, description: 'Clear', pop: 0 }] };
    expect(buildTripPrompt({ ...BASE_PARAMS, weather })).not.toContain('chance of rain');
  });
});

describe('buildTripPrompt — edge cases: special chars in free-text fields', () => {
  it('mustVisit with special characters is included verbatim', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, mustVisit: 'Café de Flore & Shakespeare\'s' });
    expect(result).toContain('Café de Flore');
  });

  it('avoidList with commas and quotes is included verbatim', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, avoidList: '"Hard Rock Cafe", "TGI Fridays"' });
    expect(result).toContain('Hard Rock Cafe');
  });

  it('specialRequests with newlines is included', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, specialRequests: 'Anniversary\nBirthday cake' });
    expect(result).toContain('Anniversary');
  });
});

describe('buildTripPrompt — edge cases: profile passport nationalities', () => {
  it('AT passport shows "Austrian passport"', () => {
    const atProfile: TravelProfile = { ...MOCK_PROFILE, passportNationality: 'AT' };
    const result = buildTripPrompt({ ...BASE_PARAMS, travelProfile: atProfile });
    expect(result).toContain('Austrian passport');
    expect(result).not.toContain('US passport');
  });

  it('US passport shows "US passport"', () => {
    const usProfile: TravelProfile = { ...MOCK_PROFILE, passportNationality: 'US' };
    expect(buildTripPrompt({ ...BASE_PARAMS, travelProfile: usProfile })).toContain('US passport');
  });
});

describe('buildTripPrompt — edge cases: empty optional arrays vs undefined', () => {
  it('empty transport produces no "Preferred transport" line', () => {
    expect(buildTripPrompt({ ...BASE_PARAMS, transport: [] })).not.toContain('Preferred transport');
  });

  it('empty dietary produces no "Dietary requirements" line', () => {
    expect(buildTripPrompt({ ...BASE_PARAMS, dietary: [] })).not.toContain('Dietary requirements');
  });

  it('single transport item works correctly', () => {
    expect(buildTripPrompt({ ...BASE_PARAMS, transport: ['metro'] })).toContain('metro');
  });

  it('single dietary restriction works correctly', () => {
    expect(buildTripPrompt({ ...BASE_PARAMS, dietary: ['halal'] })).toContain('halal');
  });
});
