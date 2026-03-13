/**
 * Test Suite 1: parseItinerary — The most critical function in ROAM
 * If this breaks, every trip generation fails.
 */
import { parseItinerary } from '../lib/types/itinerary';

// A valid itinerary matching the exact Claude output format
const VALID_ITINERARY = {
  destination: 'Tokyo, Japan',
  tagline: 'Neon lights and ancient temples',
  totalBudget: '$2,500',
  days: [
    {
      day: 1,
      theme: 'Arrival & Shibuya',
      morning: {
        activity: 'Arrive at Narita, train to Shibuya',
        location: 'Narita International Airport',
        cost: '$30',
        tip: 'Get a Suica card at the airport',
      },
      afternoon: {
        activity: 'Explore Shibuya Crossing',
        location: 'Shibuya Crossing',
        cost: '$0',
        tip: 'Best viewed from Starbucks above',
      },
      evening: {
        activity: 'Ramen at Ichiran',
        location: 'Ichiran Shibuya',
        cost: '$15',
        tip: 'Go after 9pm to avoid lines',
      },
      accommodation: {
        name: 'Hotel Gracery Shinjuku',
        type: 'Hotel',
        pricePerNight: '$120',
      },
      dailyCost: '$165',
    },
  ],
  budgetBreakdown: {
    accommodation: '$840',
    food: '$420',
    activities: '$350',
    transportation: '$280',
    miscellaneous: '$200',
  },
  packingEssentials: ['Portable charger', 'Walking shoes', 'Rain jacket'],
  proTip: 'Download the Suica app before you land',
  visaInfo: 'US citizens: 90-day visa-free entry',
};

describe('parseItinerary', () => {
  // ── Happy path ──────────────────────────────────────────────
  it('parses valid JSON string', () => {
    const result = parseItinerary(JSON.stringify(VALID_ITINERARY));
    expect(result.destination).toBe('Tokyo, Japan');
    expect(result.days).toHaveLength(1);
    expect(result.days[0].morning.activity).toBe('Arrive at Narita, train to Shibuya');
  });

  it('strips markdown code fences', () => {
    const wrapped = '```json\n' + JSON.stringify(VALID_ITINERARY) + '\n```';
    const result = parseItinerary(wrapped);
    expect(result.destination).toBe('Tokyo, Japan');
  });

  it('strips code fences without json label', () => {
    const wrapped = '```\n' + JSON.stringify(VALID_ITINERARY) + '\n```';
    const result = parseItinerary(wrapped);
    expect(result.destination).toBe('Tokyo, Japan');
  });

  it('handles leading/trailing whitespace', () => {
    const result = parseItinerary('  \n' + JSON.stringify(VALID_ITINERARY) + '\n  ');
    expect(result.destination).toBe('Tokyo, Japan');
  });

  it('preserves all fields in the output', () => {
    const result = parseItinerary(JSON.stringify(VALID_ITINERARY));
    expect(result.tagline).toBe('Neon lights and ancient temples');
    expect(result.totalBudget).toBe('$2,500');
    expect(result.budgetBreakdown.accommodation).toBe('$840');
    expect(result.packingEssentials).toEqual(['Portable charger', 'Walking shoes', 'Rain jacket']);
    expect(result.proTip).toBe('Download the Suica app before you land');
    expect(result.visaInfo).toBe('US citizens: 90-day visa-free entry');
  });

  it('handles multi-day itineraries', () => {
    const multiDay = {
      ...VALID_ITINERARY,
      days: [
        VALID_ITINERARY.days[0],
        { ...VALID_ITINERARY.days[0], day: 2, theme: 'Asakusa & Akihabara' },
        { ...VALID_ITINERARY.days[0], day: 3, theme: 'Day Trip to Kamakura' },
      ],
    };
    const result = parseItinerary(JSON.stringify(multiDay));
    expect(result.days).toHaveLength(3);
    expect(result.days[2].theme).toBe('Day Trip to Kamakura');
  });

  // ── Error cases ─────────────────────────────────────────────
  it('throws on invalid JSON', () => {
    expect(() => parseItinerary('not json')).toThrow('Failed to parse itinerary JSON');
  });

  it('throws on null', () => {
    expect(() => parseItinerary('null')).toThrow('Itinerary must be a JSON object');
  });

  it('throws on array (missing required fields)', () => {
    expect(() => parseItinerary('[]')).toThrow();
  });

  it('throws when destination is missing', () => {
    const { destination, ...noDestination } = VALID_ITINERARY;
    expect(() => parseItinerary(JSON.stringify(noDestination))).toThrow(
      'missing required string field: destination'
    );
  });

  it('throws when days is empty', () => {
    const empty = { ...VALID_ITINERARY, days: [] };
    expect(() => parseItinerary(JSON.stringify(empty))).toThrow(
      'must include at least one day'
    );
  });

  it('throws when days is not an array', () => {
    const bad = { ...VALID_ITINERARY, days: 'not an array' };
    expect(() => parseItinerary(JSON.stringify(bad))).toThrow(
      'must include at least one day'
    );
  });

  it('throws when budgetBreakdown is missing', () => {
    const { budgetBreakdown, ...noBudget } = VALID_ITINERARY;
    expect(() => parseItinerary(JSON.stringify(noBudget))).toThrow(
      'must include budgetBreakdown'
    );
  });

  it('throws when time slot is missing a field', () => {
    const badDay = {
      ...VALID_ITINERARY,
      days: [{
        ...VALID_ITINERARY.days[0],
        morning: { activity: 'Walk', location: 'Park' }, // missing cost and tip
      }],
    };
    expect(() => parseItinerary(JSON.stringify(badDay))).toThrow('cost must be a string');
  });

  it('throws when accommodation is malformed', () => {
    const badAcc = {
      ...VALID_ITINERARY,
      days: [{
        ...VALID_ITINERARY.days[0],
        accommodation: { name: 'Hotel' }, // missing type and pricePerNight
      }],
    };
    expect(() => parseItinerary(JSON.stringify(badAcc))).toThrow('type must be a string');
  });

  it('throws when packingEssentials is not an array', () => {
    const bad = { ...VALID_ITINERARY, packingEssentials: 'sunscreen' };
    expect(() => parseItinerary(JSON.stringify(bad))).toThrow('packingEssentials array');
  });
});
