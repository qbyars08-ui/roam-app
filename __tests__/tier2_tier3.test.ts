/**
 * QA Agent — Tier 2 & Tier 3 tests
 * Run with: npx jest --testPathPattern=tier2_tier3
 */
import { buildTripPrompt } from '../lib/claude';
import { parseItinerary } from '../lib/types/itinerary';

// 10 test destinations
const DESTINATIONS = [
  'Tokyo, Japan',
  'Marrakech, Morocco',
  'Buenos Aires, Argentina',
  'Reykjavik, Iceland',
  'Bali, Indonesia',
  'Cape Town, South Africa',
  'Oaxaca, Mexico',
  'Tbilisi, Georgia',
  'Queenstown, New Zealand',
  'Seoul, South Korea',
];

const BASE_PARAMS = {
  days: 5,
  budget: 'mid',
  vibes: ['culture', 'food'],
} as const;

describe('Tier 2 — Core Flow: buildTripPrompt with 10 destinations', () => {
  DESTINATIONS.forEach((dest) => {
    it(`generates valid prompt for ${dest}`, () => {
      const result = buildTripPrompt({ ...BASE_PARAMS, destination: dest });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
      expect(result).toContain(dest);
      expect(result).toContain('5-day trip');
      expect(result).toContain('mid');
      expect(result).toContain('culture');
      expect(result).toContain('Provide a complete itinerary');
    });
  });
});

describe('Tier 3 — Edge Cases: invalid trip duration', () => {
  it('rejects 0-day trip with error', () => {
    expect(() => buildTripPrompt({ ...BASE_PARAMS, destination: 'Tokyo', days: 0 }))
      .toThrow('Trip duration must be between 1 and 30 days');
  });

  it('rejects 31-day trip with error', () => {
    expect(() => buildTripPrompt({ ...BASE_PARAMS, destination: 'Tokyo', days: 31 }))
      .toThrow('Trip duration must be between 1 and 30 days');
  });

  it('accepts minimum 1-day trip', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, destination: 'Tokyo', days: 1 });
    expect(result).toContain('1-day trip');
  });

  it('accepts maximum 30-day trip', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, destination: 'Tokyo', days: 30 });
    expect(result).toContain('30-day trip');
  });
});

describe('Tier 3 — Edge Cases: empty destination', () => {
  it('rejects empty destination string', () => {
    expect(() => buildTripPrompt({ ...BASE_PARAMS, destination: '' }))
      .toThrow('Destination is required');
  });

  it('rejects whitespace-only destination', () => {
    expect(() => buildTripPrompt({ ...BASE_PARAMS, destination: '   ' }))
      .toThrow('Destination is required');
  });
});

describe('Tier 3 — Edge Cases: special characters in destination', () => {
  it('handles destination with accented characters (São Paulo)', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, destination: 'São Paulo, Brazil' });
    expect(result).toContain('São Paulo, Brazil');
  });

  it('handles destination with non-Latin script (東京)', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, destination: '東京, Japan' });
    expect(result).toContain('東京, Japan');
  });

  it('handles destination with special characters (Côte d\'Ivoire)', () => {
    const result = buildTripPrompt({ ...BASE_PARAMS, destination: "Côte d'Ivoire" });
    expect(result).toContain("Côte d'Ivoire");
  });
});

describe('Tier 3 — Edge Cases: special characters in free-text fields', () => {
  it('handles mustVisit with SQL injection-like text', () => {
    const result = buildTripPrompt({
      ...BASE_PARAMS,
      destination: 'Tokyo',
      mustVisit: "Tsukiji'; DROP TABLE trips; --"
    });
    expect(result).toContain("Tsukiji'; DROP TABLE trips; --");
  });

  it('handles specialRequests with emojis', () => {
    const result = buildTripPrompt({
      ...BASE_PARAMS,
      destination: 'Tokyo',
      specialRequests: 'Birthday trip 🎂🎉'
    });
    expect(result).toContain('Birthday trip');
  });

  it('handles very long destination name (100+ chars)', () => {
    const longDest = 'The Very Long City Name in The Country of Very Long Names ' + 'A'.repeat(50);
    const result = buildTripPrompt({ ...BASE_PARAMS, destination: longDest });
    expect(result).toContain(longDest);
  });
});

describe('Tier 3 — Edge Cases: budget selector', () => {
  const budgets = ['budget', 'mid', 'comfort', 'luxury'];
  budgets.forEach((budget) => {
    it(`accepts budget tier: ${budget}`, () => {
      const result = buildTripPrompt({ ...BASE_PARAMS, destination: 'Tokyo', budget });
      expect(result).toContain(budget);
    });
  });
});

describe('Tier 3 — Edge Cases: empty API response handling', () => {
  it('parseItinerary throws on null input', () => {
    expect(() => parseItinerary(null as any)).toThrow();
  });

  it('parseItinerary throws on undefined input', () => {
    expect(() => parseItinerary(undefined as any)).toThrow();
  });

  it('parseItinerary throws on empty string', () => {
    expect(() => parseItinerary('' as any)).toThrow();
  });

  it('parseItinerary throws on malformed JSON object (no destination)', () => {
    expect(() => parseItinerary({} as any)).toThrow();
  });
});
