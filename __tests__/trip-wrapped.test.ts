/**
 * Test Suite: trip-wrapped — parseItinerary structural integrity
 *
 * Verifies that a full parsed itinerary has the expected shape:
 *   - days array is present and non-empty
 *   - each day has morning / afternoon / evening time slots
 *   - neighborhoods can be extracted from all three slots
 *
 * This is a structural smoke test: ensures the type contract holds
 * when code builds a "trip wrapped" summary from parsed data.
 */

import { parseItinerary, type Itinerary, type ItineraryDay } from '../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Sample itinerary JSON (as Claude would return it)
// ---------------------------------------------------------------------------

const SAMPLE_RAW = JSON.stringify({
  destination: 'Kyoto, Japan',
  tagline: 'Ancient temples, bamboo forests, and the best ramen you have ever had.',
  totalBudget: '$1,500',
  days: [
    {
      day: 1,
      theme: 'Arrival and First Impressions',
      morning: {
        activity: 'Fushimi Inari Shrine',
        location: 'Fushimi Inari Taisha',
        cost: 'Free',
        tip: 'Go before 8am to avoid crowds',
        time: '7:00 AM',
        duration: '120',
        neighborhood: 'Fushimi',
        address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
        transitToNext: 'Take Keihan Line 15 min to Gion-Shijo station',
      },
      afternoon: {
        activity: 'Gion district walking tour',
        location: 'Gion',
        cost: '$0',
        tip: 'Machiya townhouses line Hanamikoji Street — peek inside the open ones',
        time: '2:00 PM',
        duration: '90',
        neighborhood: 'Gion',
        address: 'Hanamikoji Street, Higashiyama Ward, Kyoto',
        transitToNext: '10 min walk north to Kiyomizudera',
      },
      evening: {
        activity: 'Pontocho alley dinner',
        location: 'Pontocho',
        cost: '$20–$40',
        tip: 'Yakiniku joints on the side alleys are half the price of the main strip',
        time: '7:30 PM',
        duration: '90',
        neighborhood: 'Nakagyo',
      },
      accommodation: {
        name: 'The Millennials Kyoto',
        type: 'capsule hotel',
        pricePerNight: '$55',
        neighborhood: 'Shijo',
      },
      dailyCost: '$120',
      routeSummary: 'Fushimi → Gion → Pontocho',
    },
    {
      day: 2,
      theme: 'Arashiyama and the Bamboo Grove',
      morning: {
        activity: 'Sagano Bamboo Forest',
        location: 'Arashiyama',
        cost: 'Free',
        tip: 'Best light is in the morning before 9am',
        time: '8:00 AM',
        duration: '60',
        neighborhood: 'Arashiyama',
      },
      afternoon: {
        activity: 'Tenryu-ji Zen Garden',
        location: 'Tenryu-ji Temple',
        cost: '$5 (¥700)',
        tip: 'The garden is better than the interior — budget your time accordingly',
        time: '1:00 PM',
        duration: '75',
        neighborhood: 'Arashiyama',
      },
      evening: {
        activity: 'Nijo Castle night illumination',
        location: 'Nijo Castle',
        cost: '$8 (¥1,000)',
        tip: 'Seasonal — check dates in advance',
        time: '6:30 PM',
        duration: '90',
        neighborhood: 'Nakagyo',
      },
      accommodation: {
        name: 'The Millennials Kyoto',
        type: 'capsule hotel',
        pricePerNight: '$55',
      },
      dailyCost: '$100',
    },
  ],
  budgetBreakdown: {
    accommodation: '$110',
    food: '$200',
    activities: '$80',
    transportation: '$60',
    miscellaneous: '$50',
  },
  packingEssentials: [
    'Comfortable walking shoes',
    'IC card (Suica or ICOCA)',
    'Light rain jacket',
  ],
  proTip: 'The Kyoto City Bus day pass ($5.50) covers all major sights. Buy at the bus terminal next to Kyoto Station.',
  visaInfo: 'Most passport holders: 90-day visa-free. Verify at MOFA Japan website.',
});

// ---------------------------------------------------------------------------
// Parsed result
// ---------------------------------------------------------------------------

let parsed: Itinerary;

beforeAll(() => {
  parsed = parseItinerary(SAMPLE_RAW);
});

// ---------------------------------------------------------------------------
// Days array
// ---------------------------------------------------------------------------

describe('trip-wrapped — days array', () => {
  it('has a days array', () => {
    expect(Array.isArray(parsed.days)).toBe(true);
  });

  it('days array is non-empty', () => {
    expect(parsed.days.length).toBeGreaterThan(0);
  });

  it('contains the correct number of days (2)', () => {
    expect(parsed.days).toHaveLength(2);
  });

  it('each day has a numeric day number', () => {
    for (const day of parsed.days) {
      expect(typeof day.day).toBe('number');
    }
  });

  it('day numbers are sequential starting at 1', () => {
    parsed.days.forEach((d, i) => {
      expect(d.day).toBe(i + 1);
    });
  });

  it('each day has a theme string', () => {
    for (const day of parsed.days) {
      expect(typeof day.theme).toBe('string');
      expect(day.theme.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Time slots — morning / afternoon / evening
// ---------------------------------------------------------------------------

describe('trip-wrapped — each day has morning, afternoon, evening', () => {
  it('every day has a morning slot', () => {
    for (const day of parsed.days) {
      expect(day.morning).toBeDefined();
    }
  });

  it('every day has an afternoon slot', () => {
    for (const day of parsed.days) {
      expect(day.afternoon).toBeDefined();
    }
  });

  it('every day has an evening slot', () => {
    for (const day of parsed.days) {
      expect(day.evening).toBeDefined();
    }
  });

  it('each time slot has activity, location, cost, tip', () => {
    for (const day of parsed.days) {
      for (const slot of [day.morning, day.afternoon, day.evening]) {
        expect(typeof slot.activity).toBe('string');
        expect(typeof slot.location).toBe('string');
        expect(typeof slot.cost).toBe('string');
        expect(typeof slot.tip).toBe('string');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Neighborhood extraction
// ---------------------------------------------------------------------------

describe('trip-wrapped — neighborhood extraction', () => {
  it('can extract neighborhoods from all three slots on day 1', () => {
    const day = parsed.days[0];
    const neighborhoods = [
      day.morning.neighborhood,
      day.afternoon.neighborhood,
      day.evening.neighborhood,
    ].filter(Boolean);
    expect(neighborhoods.length).toBeGreaterThan(0);
  });

  it('day 1 morning neighborhood is Fushimi', () => {
    expect(parsed.days[0].morning.neighborhood).toBe('Fushimi');
  });

  it('day 1 afternoon neighborhood is Gion', () => {
    expect(parsed.days[0].afternoon.neighborhood).toBe('Gion');
  });

  it('day 1 has a routeSummary that lists neighborhoods', () => {
    expect(parsed.days[0].routeSummary).toContain('Fushimi');
    expect(parsed.days[0].routeSummary).toContain('Gion');
  });

  it('can collect unique neighborhoods across all days', () => {
    const neighborhoods = new Set<string>();
    for (const day of parsed.days) {
      for (const slot of [day.morning, day.afternoon, day.evening]) {
        if (slot.neighborhood) {
          neighborhoods.add(slot.neighborhood);
        }
      }
    }
    expect(neighborhoods.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Top-level itinerary fields
// ---------------------------------------------------------------------------

describe('trip-wrapped — top-level fields', () => {
  it('destination is Kyoto, Japan', () => {
    expect(parsed.destination).toBe('Kyoto, Japan');
  });

  it('totalBudget is a string', () => {
    expect(typeof parsed.totalBudget).toBe('string');
  });

  it('packingEssentials is an array with 3 items', () => {
    expect(Array.isArray(parsed.packingEssentials)).toBe(true);
    expect(parsed.packingEssentials).toHaveLength(3);
  });

  it('proTip is non-empty', () => {
    expect(parsed.proTip.length).toBeGreaterThan(0);
  });

  it('budgetBreakdown has all 5 required fields', () => {
    const bb = parsed.budgetBreakdown;
    expect(typeof bb.accommodation).toBe('string');
    expect(typeof bb.food).toBe('string');
    expect(typeof bb.activities).toBe('string');
    expect(typeof bb.transportation).toBe('string');
    expect(typeof bb.miscellaneous).toBe('string');
  });
});
